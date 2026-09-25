import hashlib
import hmac
import logging

import httpx
from fastapi import HTTPException, status

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("toyospot.paystack")

PAYSTACK_BASE_URL = "https://api.paystack.co"


def _require_configured() -> None:
    if not settings.PAYSTACK_SECRET_KEY:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Online payment isn't configured yet -- set PAYSTACK_SECRET_KEY.",
        )


async def initialize_transaction(email: str, amount_naira: int, reference: str, metadata: dict) -> dict:
    """Starts a Paystack transaction. Amount must be sent in kobo (naira *
    100) -- Paystack's smallest currency unit, same idea as cents for USD.
    Returns Paystack's response body, which includes `authorization_url`
    (for a redirect flow) and `access_code` (for the Inline popup flow the
    frontend actually uses).
    """
    _require_configured()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
            json={
                "email": email,
                "amount": amount_naira * 100,
                "reference": reference,
                "currency": "NGN",
                "metadata": metadata,
            },
        )

    data = response.json()
    if not response.is_success or not data.get("status"):
        logger.error("Paystack initialize failed: %s %s", response.status_code, data)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not start payment. Please try again.")

    return data["data"]


async def verify_transaction(reference: str) -> dict:
    """Asks Paystack directly whether a transaction actually succeeded --
    never trust a client-reported "success" callback on its own, since
    that value comes from the browser and is trivially spoofable.
    """
    _require_configured()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"},
        )

    data = response.json()
    if not response.is_success or not data.get("status"):
        logger.error("Paystack verify failed: %s %s", response.status_code, data)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Could not verify payment with Paystack.")

    return data["data"]


def verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> bool:
    """Paystack signs webhook bodies with HMAC-SHA512 using the secret key.
    Without this check, anyone could POST a fake "charge.success" event and
    mark any order as paid for free.
    """
    if not signature_header or not settings.PAYSTACK_SECRET_KEY:
        return False
    computed = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(computed, signature_header)
