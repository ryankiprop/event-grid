from datetime import datetime, timedelta
from uuid import UUID

import click

from .extensions import db
from .models.event import Event
from .models.order import Order, OrderItem
from .models.ticket import TicketType
from .models.user import User
from .utils.auth import hash_password
from .utils.qrcode_util import build_ticket_qr_payload


def _get_or_create_user(email, role, first_name, last_name, password):
    user = User.query.filter_by(email=email.lower()).first()
    if user:
        return user
    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
    )
    db.session.add(user)
    db.session.commit()
    return user


def _create_event(organizer, title, days_from_now=7, published=True):
    start = datetime.utcnow() + timedelta(days=days_from_now)
    end = start + timedelta(hours=2)
    ev = Event(
        organizer_id=organizer.id,
        title=title,
        description=f"Sample description for {title}",
        category="Conference",
        venue_name="Main Hall",
        address="123 Sample St, City",
        start_date=start,
        end_date=end,
        banner_image_url="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
        is_published=published,
    )
    db.session.add(ev)
    db.session.commit()
    return ev


def _create_tickets(event, specs):
    tickets = []
    for name, price_cents, qty in specs:
        t = TicketType(
            event_id=event.id,
            name=name,
            price=price_cents,
            quantity_total=qty,
            quantity_sold=0,
        )
        db.session.add(t)
        tickets.append(t)
    db.session.commit()
    return tickets


def _create_order(user, event, items_specs):
    order = Order(user_id=user.id, event_id=event.id, total_amount=0, status="paid")
    db.session.add(order)
    db.session.flush()

    total = 0
    for ticket_type, qty in items_specs:
        oi = OrderItem(
            order_id=order.id,
            ticket_type_id=ticket_type.id,
            quantity=qty,
            unit_price=ticket_type.price,
            qr_code=None,
        )
        total += ticket_type.price * qty
        ticket_type.quantity_sold = (ticket_type.quantity_sold or 0) + qty
        db.session.add(oi)
        db.session.flush()
        if not oi.qr_code:
            oi.qr_code = build_ticket_qr_payload(
                order_id=order.id,
                item_id=oi.id,
                user_id=user.id,
                event_id=event.id,
                event_title=event.title,
                event_start_date_iso=(event.start_date.isoformat() if getattr(event, "start_date", None) else None),
                ticket_type_id=ticket_type.id,
                ticket_type_name=ticket_type.name,
            )
    order.total_amount = total
    db.session.commit()
    return order


def register_cli(app):
    @app.cli.command("seed")
    def seed_command():
        """Seed database with demo users, events, tickets, and an order."""
        click.echo("Seeding database with demo data...")
        # Users
        admin = _get_or_create_user(
            "admin@example.com", "admin", "Admin", "User", "password123"
        )
        organizer = _get_or_create_user(
            "organizer@example.com", "organizer", "Olivia", "Organizer", "password123"
        )
        customer = _get_or_create_user(
            "user@example.com", "user", "Charlie", "Customer", "password123"
        )

        # Events created by organizer
        ev1 = _create_event(
            organizer, "Eventgrid Launch Conference", days_from_now=7, published=True
        )
        ev2 = _create_event(
            organizer, "Tech Meetup Night", days_from_now=14, published=False
        )

        # Ticket types
        t1, t2 = _create_tickets(
            ev1, [("General Admission", 2500, 100), ("VIP", 7500, 20)]
        )
        _create_tickets(ev2, [("Standard", 1500, 50)])

        # Sample order by customer for ev1
        _create_order(customer, ev1, [(t1, 2), (t2, 1)])

        click.echo("Seed completed. Login with:")
        click.echo(" - Admin: admin@example.com / password123")
        click.echo(" - Organizer: organizer@example.com / password123")
        click.echo(" - User: user@example.com / password123")
