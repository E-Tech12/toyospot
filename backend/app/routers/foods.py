from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Category, Food, OrderItem
from app.schemas.food import FoodOut

router = APIRouter(prefix="/foods", tags=["catalog"])


def _base_query(db: Session):
    return db.query(Food).options(joinedload(Food.category)).filter(Food.is_archived.is_(False))


@router.get("", response_model=list[FoodOut])
def list_foods(category: str | None = None, search: str | None = None, db: Session = Depends(get_db)):
    query = _base_query(db)
    if category:
        query = query.join(Category).filter(Category.slug == category)
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    foods = query.order_by(Food.name).all()
    return [FoodOut.from_model(f) for f in foods]


@router.get("/featured", response_model=list[FoodOut])
def list_featured(db: Session = Depends(get_db)):
    foods = _base_query(db).filter(Food.is_featured.is_(True)).all()
    return [FoodOut.from_model(f) for f in foods]


@router.get("/popular", response_model=list[FoodOut])
def list_popular(limit: int = 8, db: Session = Depends(get_db)):
    """"Popular" is computed from real order history (most units sold),
    not a manually toggled flag -- per the brief this reflects actual
    customer behaviour. New stores with no order history yet fall back to
    the admin's manual `is_popular` flag so the homepage isn't empty on day one.
    """
    ranked_ids = (
        db.query(OrderItem.food_id, func.sum(OrderItem.quantity).label("sold"))
        .group_by(OrderItem.food_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    if ranked_ids:
        id_order = [row.food_id for row in ranked_ids]
        foods = _base_query(db).filter(Food.id.in_(id_order)).all()
        foods_by_id = {f.id: f for f in foods}
        ordered_foods = [foods_by_id[fid] for fid in id_order if fid in foods_by_id]
        return [FoodOut.from_model(f) for f in ordered_foods]

    foods = _base_query(db).filter(Food.is_popular.is_(True)).limit(limit).all()
    return [FoodOut.from_model(f) for f in foods]


@router.get("/{slug}", response_model=FoodOut)
def get_food(slug: str, db: Session = Depends(get_db)):
    food = _base_query(db).filter(Food.slug == slug).first()
    if not food:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Food not found")
    return FoodOut.from_model(food)
