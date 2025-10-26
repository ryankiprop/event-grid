import hashlib
import uuid

def generate_ticket_qr(order_id: uuid.UUID, item_id: uuid.UUID, user_id: uuid.UUID) -> str:
    """
    Returns a compact string that can be encoded as a QR later.
    We avoid external dependencies for now; this acts as a unique verifier.
    Format: evlync:<sha1-12>
    """
    base = f"{order_id}:{item_id}:{user_id}"
    digest = hashlib.sha1(base.encode('utf-8')).hexdigest()[:12]
    return f"evlync:{digest}"