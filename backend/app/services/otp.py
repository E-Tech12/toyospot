from datetime import datetime, timedelta, timezone

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import OtpCode, OtpPurpose
from app.security import generate_otp_code, hash_otp_code
from app.services.email import send_otp_email

settings = get_settings()

MAX_ATTEMPTS = 5


def issue_otp(db: Session, background_tasks: BackgroundTasks, email: str, first_name: str, purpose: OtpPurpose) -> None:
    code = generate_otp_code()
    otp = OtpCode(
        email=email,
        code_hash=hash_otp_code(code),
        purpose=purpose,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
    )
    db.add(otp)
    db.commit()
    background_tasks.add_task(send_otp_email, email, first_name, code, purpose.value)


def verify_otp(db: Session, email: str, code: str, purpose: OtpPurpose) -> bool:
    """Returns True and consumes the OTP row if valid. Rate-limits guesses
    per-code via `attempts` so a 4-digit code can't be brute forced.
    """
    otp = (
        db.query(OtpCode)
        .filter(
            OtpCode.email == email,
            OtpCode.purpose == purpose,
            OtpCode.consumed.is_(False),
        )
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not otp:
        return False
    if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return False
    if otp.attempts >= MAX_ATTEMPTS:
        return False

    otp.attempts += 1
    if otp.code_hash != hash_otp_code(code):
        db.commit()
        return False

    otp.consumed = True
    db.commit()
    return True
