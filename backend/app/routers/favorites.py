from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Favorite, Food, User
from app.schemas.food import FoodOut

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FoodOut])
def list_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    favorites = (
        db.query(Favorite)
        .options(joinedload(Favorite.food).joinedload(Food.category))
        .filter(Favorite.user_id == user.id)
        .all()
    )
    return [FoodOut.from_model(f.food) for f in favorites if not f.food.is_archived]


@router.post("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(food_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    food = db.get(Food, food_id)
    if not food:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Food not found")
    exists = db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.food_id == food_id).first()
    if not exists:
        db.add(Favorite(user_id=user.id, food_id=food_id))
        db.commit()


@router.delete("/{food_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(food_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Favorite).filter(Favorite.user_id == user.id, Favorite.food_id == food_id).delete()
    db.commit()
