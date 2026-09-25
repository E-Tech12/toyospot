from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import OtpPurpose, RefreshToken, User, UserRole
from app.schemas.auth import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    ResendOtpRequest,
    ResetPasswordRequest,
    TokenPair,
    UserOut,
    VerifyOtpRequest,
)
from app.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.services.email import send_registration_success_email
from app.services.otp import issue_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


def _issue_token_pair(db: Session, user: User) -> TokenPair:
    access = create_access_token(user.id, user.role.value)
    refresh_plain = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_plain),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    db.commit()
    return TokenPair(access_token=access, refresh_token=refresh_plain)


@router.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "An account with this email already exists.")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=UserRole.customer,
        is_verified=False,
    )
    db.add(user)
    db.commit()

    issue_otp(db, background_tasks, payload.email, payload.first_name, OtpPurpose.verify_email)
    return RegisterResponse(message="Account created. Check your email for a verification code.", email=payload.email)


@router.post("/resend-otp", response_model=RegisterResponse)
def resend_otp(payload: ResendOtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Don't reveal whether the email exists.
        return RegisterResponse(message="If that email has an account, a new code has been sent.", email=payload.email)
    issue_otp(db, background_tasks, payload.email, user.first_name, OtpPurpose.verify_email)
    return RegisterResponse(message="A new code has been sent.", email=payload.email)


@router.post("/verify-otp", response_model=AuthResponse)
def verify_email_otp(payload: VerifyOtpRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account found for this email.")

    if not verify_otp(db, payload.email, payload.code, OtpPurpose.verify_email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That code is invalid or has expired.")

    user.is_verified = True
    db.commit()
    background_tasks.add_task(send_registration_success_email, user.email, user.first_name)

    tokens = _issue_token_pair(db, user)
    return AuthResponse(**tokens.model_dump(), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password.")
    if not user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Please verify your email before logging in.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account has been deactivated.")

    tokens = _issue_token_pair(db, user)
    return AuthResponse(**tokens.model_dump(), user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenPair)
def refresh_token(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    invalid = HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token.")
    if not stored or stored.revoked:
        raise invalid
    if stored.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise invalid

    user = db.get(User, stored.user_id)
    if not user or not user.is_active:
        raise invalid

    # Rotate: revoke the old refresh token and issue a brand new pair.
    stored.revoked = True
    db.commit()
    return _issue_token_pair(db, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(payload: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hash_refresh_token(payload.refresh_token)
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if stored:
        stored.revoked = True
        db.commit()


@router.post("/forgot-password", response_model=RegisterResponse)
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        issue_otp(db, background_tasks, payload.email, user.first_name, OtpPurpose.password_reset)
    # Same response whether or not the account exists, to avoid leaking which emails are registered.
    return RegisterResponse(message="If that email has an account, a reset code has been sent.", email=payload.email)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_otp(db, payload.email, payload.code, OtpPurpose.password_reset):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "That code is invalid or has expired.")

    user.hashed_password = hash_password(payload.new_password)
    # Revoke every existing refresh token so a password reset also logs out
    # any other device that might be signed in.
    db.query(RefreshToken).filter(RefreshToken.user_id == user.id, RefreshToken.revoked.is_(False)).update(
        {"revoked": True}
    )
    db.commit()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


@router.patch("/me", response_model=UserOut)
def update_me(payload: UpdateProfileRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
