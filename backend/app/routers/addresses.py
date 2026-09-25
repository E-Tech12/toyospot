from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Address, User
from app.schemas.misc import AddressIn, AddressOut

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressOut])
def list_addresses(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Address).filter(Address.user_id == user.id).order_by(Address.is_default.desc()).all()


@router.post("", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(payload: AddressIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.is_default:
        db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})
    address = Address(user_id=user.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.patch("/{address_id}", response_model=AddressOut)
def update_address(address_id: str, payload: AddressIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found")
    if payload.is_default:
        db.query(Address).filter(Address.user_id == user.id).update({"is_default": False})
    for field, value in payload.model_dump().items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if not address:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Address not found")
    db.delete(address)
    db.commit()
