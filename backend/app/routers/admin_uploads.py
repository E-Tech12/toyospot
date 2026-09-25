from fastapi import APIRouter, Depends, UploadFile

from app.deps import get_current_admin
from app.models import User
from app.services.storage import upload_food_image

router = APIRouter(prefix="/admin/uploads", tags=["admin: uploads"])


@router.post("/image")
async def upload_image(file: UploadFile, _admin: User = Depends(get_current_admin)):
    """Uploads an image and returns its public URL, for use in FoodCreate's
    image_url field when adding a brand new food (which has no id yet to
    attach the image to via POST /admin/foods/{id}/image).
    """
    url = await upload_food_image(file)
    return {"url": url}
