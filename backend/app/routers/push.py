from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.deps import get_current_user
from app.models import PushSubscription, User
from app.schemas.misc import PushSubscribeRequest

router = APIRouter(prefix="/push", tags=["push"])
settings = get_settings()


@router.get("/vapid-public-key")
def get_vapid_public_key():
    return {"publicKey": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
def subscribe(payload: PushSubscribeRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if existing:
        existing.user_id = user.id
        existing.p256dh = payload.p256dh
        existing.auth = payload.auth
    else:
        db.add(PushSubscription(user_id=user.id, endpoint=payload.endpoint, p256dh=payload.p256dh, auth=payload.auth))
    db.commit()


@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
def unsubscribe(payload: PushSubscribeRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == payload.endpoint, PushSubscription.user_id == user.id
    ).delete()
    db.commit()
