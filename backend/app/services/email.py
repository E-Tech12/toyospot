import logging
from pathlib import Path

import httpx

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger("toyospot.email")

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "emails"
_BASE_TEMPLATE = (TEMPLATE_DIR / "base.html").read_text()

# Human-readable copy for each order status, used both in the email and as
# the basis for the matching push/in-app notification text.
ORDER_STATUS_COPY = {
    "pending": ("Order received", "We've got your order and we're getting it ready to confirm."),
    "accepted": ("Order accepted", "Toyo's Pot has accepted your order and the kitchen is queuing it up."),
    "preparing": ("Your order is being prepared", "Your meal is on the stove right now."),
    "ready": ("Your order is ready", "Your order is packed and waiting for a rider."),
    "out_for_delivery": ("Order out for delivery", "Your order has left the kitchen and is on its way to you."),
    "delivered": ("Order delivered", "Enjoy your meal! Thanks for ordering from Toyo's Pot."),
    "cancelled": ("Order cancelled", "Your order has been cancelled. If you were charged, a refund is on its way."),
}

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _render(body_html: str) -> str:
    return _BASE_TEMPLATE.replace("{{BODY}}", body_html)


def _send(to_email: str, subject: str, html_body: str) -> None:
    """Sends one email via Brevo's HTTP API. Called from FastAPI BackgroundTasks
    so it never blocks the request/response cycle.

    Brevo's API runs over HTTPS (port 443), which works on Render's free tier.
    Traditional SMTP (ports 25/465/587) is blocked by Render.
    """
    if not settings.BREVO_API_KEY:
        logger.warning("Brevo API key not configured; skipping email '%s' to %s", subject, to_email)
        return

    payload = {
        "sender": {
            "name": settings.SMTP_FROM_NAME,
            "email": settings.SMTP_FROM_EMAIL,
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": _render(html_body),
    }

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = httpx.post(BREVO_API_URL, json=payload, headers=headers, timeout=15.0)
        if response.status_code in (200, 201, 202):
            logger.info("Sent email '%s' to %s via Brevo", subject, to_email)
        else:
            logger.error(
                "Brevo rejected email '%s' to %s — status %s: %s",
                subject, to_email, response.status_code, response.text,
            )
    except Exception:
        logger.exception("Failed to send email '%s' to %s", subject, to_email)


def send_otp_email(to_email: str, first_name: str, code: str, purpose: str) -> None:
    heading = "Verify your email" if purpose == "verify_email" else "Reset your password"
    intro = (
        "Use the code below to verify your email and finish creating your account."
        if purpose == "verify_email"
        else "Use the code below to reset your password."
    )
    body = f"""
      <p style="margin:0 0 16px;">Hi {first_name},</p>
      <p style="margin:0 0 20px;">{intro}</p>
      <p style="text-align:center;margin:28px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#E1481F;">{code}</span>
      </p>
      <p style="margin:0;color:#8A7768;font-size:13px;">
        This code expires in {settings.OTP_EXPIRE_MINUTES} minutes. If you didn't request this, you can ignore this email.
      </p>
    """
    _send(to_email, heading, body)


def send_registration_success_email(to_email: str, first_name: str) -> None:
    body = f"""
      <p style="margin:0 0 16px;">Hi {first_name},</p>
      <p style="margin:0 0 16px;">Welcome to Toyo's Pot! Your account is verified and ready.</p>
      <p style="margin:0;">Browse today's menu and place your first order whenever you're hungry.</p>
    """
    _send(to_email, "Welcome to Toyo's Pot", body)


def send_order_status_email(to_email: str, first_name: str, order_number: str, status: str) -> None:
    heading, message = ORDER_STATUS_COPY.get(status, ("Order update", "Your order status has changed."))
    body = f"""
      <p style="margin:0 0 16px;">Hi {first_name},</p>
      <p style="margin:0 0 8px;font-weight:600;">{heading} &middot; Order {order_number}</p>
      <p style="margin:0;">{message}</p>
    """
    _send(to_email, f"{heading} — {order_number}", body)


def send_admin_new_order_email(to_email: str, order_number: str, customer_name: str, grand_total_naira: str) -> None:
    body = f"""
      <p style="margin:0 0 16px;font-weight:600;">New order {order_number}</p>
      <p style="margin:0 0 8px;">Customer: {customer_name}</p>
      <p style="margin:0;">Total: {grand_total_naira}</p>
    """
    _send(to_email, f"New order {order_number}", body)