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

    @app.cli.command("orders_force_complete_pending")
    def orders_force_complete_pending():
        """Mark all pending orders as paid, generate QR codes, update quantity_sold."""
        from .models import Order, OrderItem, TicketType
        with app.app_context():
            updated = 0
            orders = Order.query.filter_by(status="pending").all()
            for order in orders:
                order.status = "paid"
                for oi in order.items:
                    if not oi.qr_code:
                        tt = TicketType.query.get(oi.ticket_type_id)
                        oi.qr_code = build_ticket_qr_payload(
                            order_id=order.id,
                            item_id=oi.id,
                            user_id=order.user_id,
                            event_id=order.event_id,
                            event_title=(order.event.title if getattr(order, "event", None) else None),
                            event_start_date_iso=(order.event.start_date.isoformat() if getattr(getattr(order, "event", None), "start_date", None) else None),
                            ticket_type_id=(tt.id if tt else None),
                            ticket_type_name=(tt.name if tt else None),
                        )
                    # Update sold counts conservatively
                    tt2 = TicketType.query.get(oi.ticket_type_id)
                    if tt2:
                        tt2.quantity_sold = (tt2.quantity_sold or 0) + (oi.quantity or 0)
                updated += 1
            db.session.commit()
            click.echo(f"Force-completed {updated} pending orders.")

    @app.cli.command("tickets_make_free")
    @click.option("--event", "event_id", default=None, help="Scope to a specific event UUID")
    def tickets_make_free(event_id):
        """Set all ticket types (or those under an event) to price=0."""
        from .models import TicketType
        with app.app_context():
            q = TicketType.query
            if event_id:
                try:
                    eid = UUID(str(event_id))
                except Exception:
                    click.echo("Invalid event id; aborting.")
                    return
                q = q.filter_by(event_id=eid)
            count = 0
            for tt in q.all():
                tt.price = 0
                count += 1
            db.session.commit()
            scope = f"event {event_id}" if event_id else "all events"
            click.echo(f"Set price=0 for {count} ticket types under {scope}.")
