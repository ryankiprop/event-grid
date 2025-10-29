import os

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
FREE_MODE = (os.getenv("FREE_MODE") or "").lower() in ("1", "true", "yes")


def send_email(to_email: str, subject: str, html_content: str):
    if FREE_MODE:
        return False
    if not SENDGRID_API_KEY:
        return False
    message = Mail(
        from_email=("no-reply@eventlync.app", "Eventgrid"),
        to_emails=to_email,
        subject=subject,
        html_content=html_content,
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception:
        return False


def send_order_confirmation(user, order):
    if not user or not getattr(user, "email", None):
        return False
    subject = "Your Eventgrid Order Confirmation"
    html = f"""
    <div>
      <h2>Thank you for your order!</h2>
      <p>Order ID: {order.id}</p>
      <p>Total: ${(order.total_amount or 0)/100:.2f}</p>
      <p>View your tickets in your dashboard.</p>
      <p><a href='{FRONTEND_URL}'>Go to Eventgrid</a></p>
    </div>
    """
    return send_email(user.email, subject, html)
