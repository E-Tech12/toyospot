from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_admin
from app.models import Category, User
from app.schemas.food import CategoryOut

router = APIRouter(prefix="/admin/categories", tags=["admin: categories"])


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(name: str, slug: str, icon: str = "", db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    if db.query(Category).filter(Category.slug == slug).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A category with this slug already exists.")
    category = Category(name=name, slug=slug, icon=icon)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: str, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    if category.foods:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Move or delete foods in this category first.")
    db.delete(category)
    db.commit()
