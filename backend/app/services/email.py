"""Email service — supports console (dev), Amazon SES, and Resend."""
import logging
from ..config import settings

logger = logging.getLogger(__name__)


def send_magic_link(to_email: str, magic_url: str) -> None:
    subject = "Your VentureAI sign-in link"
    html_body = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
      <h2 style="color:#002E6E">Sign in to VentureAI</h2>
      <p>Click the button below to sign in. This link expires in 10 minutes and can only be used once.</p>
      <a href="{magic_url}"
         style="display:inline-block;padding:14px 28px;background:#00BAF2;color:#fff;
                border-radius:8px;text-decoration:none;font-weight:700;margin:16px 0">
        Sign In to VentureAI
      </a>
      <p style="color:#64748b;font-size:13px">
        If you did not request this link, you can safely ignore this email.
      </p>
    </div>
    """
    _send(to_email, subject, html_body)


def _send(to: str, subject: str, html: str) -> None:
    provider = settings.EMAIL_PROVIDER.lower()

    if provider == "ses":
        _send_ses(to, subject, html)
    elif provider == "resend":
        _send_resend(to, subject, html)
    else:
        # Console fallback — safe for development
        logger.info("[EMAIL:console] To=%s | Subject=%s", to, subject)
        # Print the magic link URL only in non-production
        if not settings.is_production:
            import re
            urls = re.findall(r'href="([^"]+)"', html)
            for url in urls:
                logger.info("[EMAIL:console] Link: %s", url)


def _send_ses(to: str, subject: str, html: str) -> None:
    try:
        import boto3
        client = boto3.client("ses")
        client.send_email(
            Source=settings.EMAIL_FROM,
            Destination={"ToAddresses": [to]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Html": {"Data": html}},
            },
        )
    except Exception as exc:
        logger.error("SES send failed: %s", exc)
        raise


def _send_resend(to: str, subject: str, html: str) -> None:
    try:
        import httpx
        resp = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.EMAIL_API_KEY}"},
            json={"from": settings.EMAIL_FROM, "to": [to], "subject": subject, "html": html},
            timeout=10,
        )
        resp.raise_for_status()
    except Exception as exc:
        logger.error("Resend send failed: %s", exc)
        raise
