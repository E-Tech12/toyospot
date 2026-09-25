import uuid
import logging

import httpx
from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("toyospot.storage")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


async def upload_food_image(file: UploadFile) -> str:
    """Uploads a food photo to Supabase Storage and returns its public URL.

    Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to be set (the same
    Supabase project as DATABASE_URL). The bucket (SUPABASE_STORAGE_BUCKET,
    default "food-images") must exist and be set to public in the Supabase
    dashboard -- Storage -> Buckets -> New bucket -> Public bucket.
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Image upload isn't configured yet -- set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        )

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPEG, PNG, or WebP images are allowed.")

    body = await file.read()
    if len(body) > MAX_UPLOAD_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image must be under 5MB.")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    object_path = f"{uuid.uuid4()}.{ext}"

    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{object_path}"

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            upload_url,
            content=body,
            headers={
                "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
                "Content-Type": file.content_type,
                "x-upsert": "true",
            },
        )

    if response.status_code not in (200, 201):
        logger.error("Supabase Storage upload failed: %s %s", response.status_code, response.text)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Image upload failed. Please try again.")

    return f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{object_path}"
