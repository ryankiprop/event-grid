import os
import logging
import datetime
from typing import Optional

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Configure logging
logger = logging.getLogger(__name__)

# Environment variables
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "no-reply@eventgrid.app")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "EventGrid")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
APP_NAME = "EventGrid"

# Check if we should actually send emails (False in development unless overridden)
SEND_EMAILS = (os.getenv("SEND_EMAILS", "false").lower() == "true")


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email using SendGrid.
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not SEND_EMAILS or not SENDGRID_API_KEY:
        logger.info(f"Email not sent (SEND_EMAILS={SEND_EMAILS}): {subject} to {to_email}")
        return False
        
    message = Mail(
        from_email=(SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME),
        to_emails=to_email,
        subject=subject,
        html_content=html_content,
    )
    
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        if response.status_code >= 200 and response.status_code < 300:
            logger.info(f"Email sent successfully: {subject} to {to_email}")
            return True
        else:
            logger.error(f"Failed to send email: {response.status_code} - {response.body}")
            return False
    except Exception as e:
        logger.exception(f"Error sending email to {to_email}: {str(e)}")
        return False


def send_welcome_email(user) -> bool:
    """Send a welcome email to a new user."""
    if not user or not getattr(user, "email", None):
        return False
        
    subject = f"Welcome to {APP_NAME}!"
    first_name = getattr(user, 'first_name', 'there')
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6baf;">Welcome to {APP_NAME}, {first_name}!</h2>
        <p>Thank you for joining {APP_NAME}. We're excited to have you on board!</p>
        
        <div style="margin: 30px 0;">
            <a href="{FRONTEND_URL}/dashboard" 
               style="background-color: #4a6baf; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Your Dashboard
            </a>
        </div>
        
        <p>If you have any questions, feel free to reply to this email.</p>
        
        <p>Best regards,<br>The {APP_NAME} Team</p>
        
        <p style="font-size: 12px; color: #666; margin-top: 30px;">
            © {APP_NAME} {datetime.datetime.now().year}. All rights reserved.
        </p>
    </div>
    """
    
    return send_email(user.email, subject, html)


def send_order_confirmation(user, order) -> bool:
    """Send an order confirmation email."""
    if not user or not getattr(user, "email", None) or not order:
        return False
        
    subject = f"Your {APP_NAME} Order Confirmation"
    first_name = getattr(user, 'first_name', 'Customer')
    order_total = f"${(order.total_amount or 0)/100:.2f}" if order.total_amount else "$0.00"
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6baf;">Thank you for your order, {first_name}!</h2>
        <p>We've received your order and it's being processed.</p>
        
        <div style="background-color: #f5f7fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Order Total:</strong> {order_total}</p>
            <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y %I:%M %p')}</p>
        </div>
        
        <p>You can view your order details and download your tickets from your dashboard.</p>
        
        <div style="margin: 30px 0;">
            <a href="{FRONTEND_URL}/dashboard/orders/{order.id}" 
               style="background-color: #4a6baf; color: white; padding: 10px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
                View Order Details
            </a>
        </div>
        
        <p>If you have any questions about your order, please contact our support team.</p>
        
        <p>Best regards,<br>The {APP_NAME} Team</p>
    </div>
    """
    
    return send_email(user.email, subject, html)
