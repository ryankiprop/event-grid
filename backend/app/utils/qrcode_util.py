import hashlib
import uuid
import json
from datetime import datetime

def generate_ticket_qr(
    order_id: uuid.UUID, item_id: uuid.UUID, user_id: uuid.UUID
) -> str:
    """
    Returns a compact string that can be encoded as a QR later.
    We avoid external dependencies for now; this acts as a unique verifier.
    Format: evlync:<sha1-12>
    """
    base = f"{order_id}:{item_id}:{user_id}"
    digest = hashlib.sha1(base.encode("utf-8")).hexdigest()[:12]
    return f"evlync:{digest}"

def build_ticket_qr_payload(
    *,
    order_id: uuid.UUID,
    item_id: uuid.UUID,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    event_title: str | None = None,
    event_start_date_iso: str | None = None,
    ticket_type_id: uuid.UUID | None = None,
    ticket_type_name: str | None = None,
) -> str:
    """
    Returns a JSON string with ticket details suitable for encoding as a QR.
    Includes a compact verifier code generated from order/item/user ids.
    """
    verifier = generate_ticket_qr(order_id, item_id, user_id)
    payload = {
        "type": "ticket",
        "code": verifier,
        "order_id": str(order_id),
        "order_item_id": str(item_id),
        "user_id": str(user_id),
        "event": {
            "id": str(event_id),
            "title": event_title,
            "start_date": event_start_date_iso,
        },
        "ticket_type": {
            "id": str(ticket_type_id) if ticket_type_id else None,
            "name": ticket_type_name,
        },
        "issued_at": datetime.utcnow().isoformat() + "Z",
        "version": 1,
    }
    return json.dumps(payload, separators=(",", ":"))