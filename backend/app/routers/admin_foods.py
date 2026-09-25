from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_admin
from app.models import Food, User
from app.schemas.food import FoodCreate, FoodOut, FoodUpdate, RestockRequest
from app.services.storage import upload_food_image

router = APIRouter(prefix="/admin/foods", tags=["admin: foods"])


def _get_food_or_404(db: Session, food_id: str) -> Food:
    food = db.query(Food).options(joinedload(Food.category)).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Food not found")
    return food


@router.get("", response_model=list[FoodOut])
def list_all_foods(include_archived: bool = False, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    query = db.query(Food).options(joinedload(Food.category))
    if not include_archived:
        query = query.filter(Food.is_archived.is_(False))
    foods = query.order_by(Food.name).all()
    return [FoodOut.from_model(f) for f in foods]


@router.get("/low-stock", response_model=list[FoodOut])
def list_low_stock(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    foods = db.query(Food).options(joinedload(Food.category)).filter(Food.is_archived.is_(False)).all()
    return [FoodOut.from_model(f) for f in foods if f.is_low_stock or f.is_sold_out]


@router.post("", response_model=FoodOut, status_code=status.HTTP_201_CREATED)
def create_food(payload: FoodCreate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    if db.query(Food).filter(Food.slug == payload.slug).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A food with this slug already exists.")
    food = Food(**payload.model_dump())
    db.add(food)
    db.commit()
    return FoodOut.from_model(_get_food_or_404(db, food.id))


@router.post("/{food_id}/image", response_model=FoodOut)
async def upload_image(
    food_id: str,
    file: UploadFile,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Uploads a photo for an existing food to Supabase Storage and points
    `image_url` at it. To set an image while creating a food, upload first
    via POST /admin/uploads/image and pass the returned URL in FoodCreate.
    """
    food = _get_food_or_404(db, food_id)
    url = await upload_food_image(file)
    food.image_url = url
    db.commit()
    return FoodOut.from_model(_get_food_or_404(db, food_id))


@router.patch("/{food_id}", response_model=FoodOut)
def update_food(food_id: str, payload: FoodUpdate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    food = _get_food_or_404(db, food_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(food, field, value)
    db.commit()
    return FoodOut.from_model(_get_food_or_404(db, food_id))


@router.post("/{food_id}/restock", response_model=FoodOut)
def restock_food(food_id: str, payload: RestockRequest, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    """Sets today's available quantity -- typically called each morning to
    restock, but also usable to correct a count mid-day.
    """
    food = _get_food_or_404(db, food_id)
    food.quantity_available = payload.quantity_available
    db.commit()
    return FoodOut.from_model(_get_food_or_404(db, food_id))


@router.post("/{food_id}/mark-sold-out", response_model=FoodOut)
def mark_sold_out(food_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    food = _get_food_or_404(db, food_id)
    food.quantity_available = 0
    db.commit()
    return FoodOut.from_model(_get_food_or_404(db, food_id))


@router.post("/{food_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
def archive_food(food_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    food = _get_food_or_404(db, food_id)
    food.is_archived = True
    db.commit()


@router.post("/{food_id}/unarchive", status_code=status.HTTP_204_NO_CONTENT)
def unarchive_food(food_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    food = _get_food_or_404(db, food_id)
    food.is_archived = False
    db.commit()


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(food_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    """Hard delete. Prefer /archive for foods that have ever been ordered,
    since order history snapshots the name/price already and doesn't
    depend on this row -- but deleting is offered for menu items added by
    mistake with zero orders against them.
    """
    food = _get_food_or_404(db, food_id)
    db.delete(food)
    db.commit()
