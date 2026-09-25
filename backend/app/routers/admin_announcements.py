from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import Announcement, User, UserRole
from app.schemas.misc import AnnouncementIn
from app.services.notifications import notify_announcement

router = APIRouter(prefix="/admin/announcements", tags=["admin: announcements"])


@router.get("")
def list_announcements(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return [
        {"id": a.id, "title": a.title, "body": a.body, "created_at": a.created_at.isoformat()} for a in announcements
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Broadcasts a notification (e.g. "We are closed today.") to every
    active customer. Fans out as individual Notification rows so each
    customer's read/unread state is independent, same as an order update.
    """
    announcement = Announcement(title=payload.title, body=payload.body, created_by=admin.id)
    db.add(announcement)
    db.commit()

    customers = db.query(User).filter(User.role == UserRole.customer, User.is_active.is_(True)).all()
    for customer in customers:
        notify_announcement(db, background_tasks, customer, payload.title, payload.body)

    return {"message": f"Announcement sent to {len(customers)} customers."}
