import json
import logging

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import PushSubscription

settings = get_settings()
logger = logging.getLogger("toyospot.push")


def send_push_to_user(db: Session, user_id: str, title: str, body: str, url: str = "/") -> None:
    """Sends a Web Push notification to every device the user has
    subscribed on. Silently skips if VAPID keys aren't configured yet, and
    prunes subscriptions the push service reports as gone (410/404).
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.info("VAPID keys not configured; skipping push '%s' for user %s", title, user_id)
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush not installed; skipping push")
        return

    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    payload = json.dumps({"title": title, "body": body, "url": url})

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_CLAIM_EMAIL},
            )
        except WebPushException as exc:
            status_code = getattr(exc.response, "status_code", None)
            if status_code in (404, 410):
                db.delete(sub)
                db.commit()
            else:
                logger.warning("Push failed for user %s: %s", user_id, exc)
