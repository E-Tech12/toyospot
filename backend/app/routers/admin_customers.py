from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import Order, User, UserRole
from app.schemas.auth import UserOut

router = APIRouter(prefix="/admin/customers", tags=["admin: customers"])


class CustomerSummary(UserOut):
    order_count: int
    total_spent: int


@router.get("", response_model=list[CustomerSummary])
def list_customers(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    rows = (
        db.query(
            User,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.grand_total), 0).label("total_spent"),
        )
        .outerjoin(Order, Order.user_id == User.id)
        .filter(User.role == UserRole.customer)
        .group_by(User.id)
        .order_by(User.created_at.desc())
        .all()
    )
    return [
        CustomerSummary(**UserOut.model_validate(user).model_dump(), order_count=order_count, total_spent=total_spent)
        for user, order_count, total_spent in rows
    ]


@router.get("/{customer_id}", response_model=CustomerSummary)
def get_customer(customer_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    user = db.get(User, customer_id)
    if not user or user.role != UserRole.customer:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")
    order_count = db.query(func.count(Order.id)).filter(Order.user_id == user.id).scalar() or 0
    total_spent = db.query(func.coalesce(func.sum(Order.grand_total), 0)).filter(Order.user_id == user.id).scalar() or 0
    return CustomerSummary(**UserOut.model_validate(user).model_dump(), order_count=order_count, total_spent=total_spent)
