from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import Food, Order, OrderItem, OrderStatus, User
from app.schemas.analytics import BestSellerPoint, CustomerGrowthPoint, DailyOrdersPoint, DashboardOverview, InventoryUsagePoint

router = APIRouter(prefix="/admin/analytics", tags=["admin: analytics"])


def _start_of_day(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


@router.get("/overview", response_model=DashboardOverview)
def overview(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    today_start = _start_of_day(now)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    def revenue_since(start: datetime) -> int:
        return (
            db.query(func.coalesce(func.sum(Order.grand_total), 0))
            .filter(Order.created_at >= start, Order.status != OrderStatus.cancelled)
            .scalar()
            or 0
        )

    orders_today = db.query(func.count(Order.id)).filter(Order.created_at >= today_start).scalar() or 0
    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status.in_([OrderStatus.pending, OrderStatus.accepted, OrderStatus.preparing]))
        .scalar()
        or 0
    )
    delivered_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.delivered).scalar() or 0

    foods = db.query(Food).filter(Food.is_archived.is_(False)).all()
    low_stock_foods = sum(1 for f in foods if f.is_low_stock or f.is_sold_out)

    return DashboardOverview(
        revenue_today=revenue_since(today_start),
        revenue_week=revenue_since(week_start),
        revenue_month=revenue_since(month_start),
        orders_today=orders_today,
        pending_orders=pending_orders,
        delivered_orders=delivered_orders,
        low_stock_foods=low_stock_foods,
    )


@router.get("/orders-per-day", response_model=list[DailyOrdersPoint])
def orders_per_day(days: int = 14, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(
            func.date(Order.created_at).label("day"),
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.grand_total), 0).label("revenue"),
        )
        .filter(Order.created_at >= since, Order.status != OrderStatus.cancelled)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
        .all()
    )
    return [DailyOrdersPoint(date=str(r.day), orders=r.orders, revenue=r.revenue) for r in rows]


@router.get("/best-sellers", response_model=list[BestSellerPoint])
def best_sellers(limit: int = 10, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    rows = (
        db.query(
            OrderItem.food_id,
            OrderItem.name,
            func.sum(OrderItem.quantity).label("quantity_sold"),
            func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
        )
        .group_by(OrderItem.food_id, OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return [
        BestSellerPoint(food_id=r.food_id, name=r.name, quantity_sold=r.quantity_sold, revenue=r.revenue) for r in rows
    ]


@router.get("/customer-growth", response_model=list[CustomerGrowthPoint])
def customer_growth(days: int = 30, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(func.date(User.created_at).label("day"), func.count(User.id).label("new_customers"))
        .filter(User.created_at >= since)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
        .all()
    )
    return [CustomerGrowthPoint(date=str(r.day), new_customers=r.new_customers) for r in rows]


@router.get("/inventory-usage", response_model=list[InventoryUsagePoint])
def inventory_usage(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    """How much of today's stock has moved for each active food -- the
    admin-facing view of stock burn rate, distinct from /admin/foods/low-stock
    which only lists items that are already low or sold out.
    """
    today_start = _start_of_day(datetime.now(timezone.utc))

    sold_today_rows = (
        db.query(OrderItem.food_id, func.sum(OrderItem.quantity).label("sold"))
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= today_start, Order.status != OrderStatus.cancelled)
        .group_by(OrderItem.food_id)
        .all()
    )
    sold_today_by_food = {row.food_id: row.sold for row in sold_today_rows}

    foods = db.query(Food).filter(Food.is_archived.is_(False)).order_by(Food.name).all()
    points = []
    for food in foods:
        sold_today = sold_today_by_food.get(food.id, 0)
        usage_pct = round((sold_today / food.daily_quantity) * 100, 1) if food.daily_quantity else 0.0
        points.append(
            InventoryUsagePoint(
                food_id=food.id,
                name=food.name,
                daily_quantity=food.daily_quantity,
                quantity_available=food.quantity_available,
                units_sold_today=sold_today,
                usage_pct=usage_pct,
                is_sold_out=food.is_sold_out,
                is_low_stock=food.is_low_stock,
            )
        )
    return points
