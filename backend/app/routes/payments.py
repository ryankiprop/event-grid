import json
from uuid import UUID as _UUID

from flask import current_app, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restful import Resource

from ..extensions import db
from ..models import Event, Order, OrderItem, TicketType
from ..models.payment import Payment
from ..utils.mpesa import initiate_stk_push
from ..utils.qrcode_util import generate_ticket_qr


def _uuid(v):
    try:
        return _UUID(str(v))
    except Exception:
        return None


class MpesaInitiateResource(Resource):
    @jwt_required()
    def post(self):
        data = request.get_json() or {}
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return {"message": "Invalid token"}, 400
        event_id = _uuid(data.get("event_id"))
        phone = (data.get("phone") or "").strip()
        items = data.get("items") or []
        if not event_id or not phone or not items:
            return {"message": "event_id, phone and items are required"}, 400

        event = Event.query.get(event_id)
        if not event:
            return {"message": "Event not found"}, 404

        # Create order in pending state and reserve items
        order = Order(
            user_id=user_id, event_id=event.id, total_amount=0, status="pending"
        )
        db.session.add(order)
        db.session.flush()

        total = 0
        for it in items:
            tt_id = _uuid(it.get("ticket_type_id"))
            qty = int(it.get("quantity") or 0)
            if not tt_id or qty <= 0:
                db.session.rollback()
                return {"message": "Invalid ticket item"}, 400
            tt = TicketType.query.get(tt_id)
            if not tt or tt.event_id != event.id:
                db.session.rollback()
                return {"message": "Ticket type not found for event"}, 404
            if tt.quantity_available < qty:
                db.session.rollback()
                return {"message": f"Insufficient availability for {tt.name}"}, 400
            line_total = tt.price * qty
            total += line_total
            oi = OrderItem(
                order_id=order.id,
                ticket_type_id=tt.id,
                quantity=qty,
                unit_price=tt.price,
            )
            db.session.add(oi)
            db.session.flush()
            oi.qr_code = generate_ticket_qr(order.id, oi.id, user_id)
        order.total_amount = total
        db.session.flush()

        # Amount is stored in cents; convert to KES integer amount
        amount_kes = max(1, total // 100)

        # Create payment record
        payment = Payment(
            order_id=order.id,
            provider="mpesa",
            amount=total,
            phone=phone,
            status="initiated",
        )
        db.session.add(payment)
        db.session.flush()

        try:
            resp = initiate_stk_push(
                phone_msisdn=phone,
                amount_kes=amount_kes,
                account_ref=str(order.id).replace("-", "")[:12],
                description=f"Event {event.title}",
            )
            payment.status = "processing"
            payment.merchant_request_id = resp.get("MerchantRequestID")
            payment.checkout_request_id = resp.get("CheckoutRequestID")
            db.session.commit()
            return {
                "payment": {
                    "id": str(payment.id),
                    "status": payment.status,
                    "order_id": str(order.id),
                    "amount_kes": amount_kes,
                    "checkout_request_id": payment.checkout_request_id,
                },
                "order": {"id": str(order.id)},
            }, 200
        except Exception as e:
            current_app.logger.exception("mpesa.initiate failed")
            payment.status = "failed"
            db.session.commit()
            return {"message": "Failed to initiate payment"}, 500


class PaymentStatusResource(Resource):
    @jwt_required()
    def get(self, payment_id):
        try:
            pid = _uuid(payment_id)
        except Exception:
            pid = None
        if not pid:
            return {"message": "Invalid payment id"}, 400
        p = Payment.query.get(pid)
        if not p:
            return {"message": "Not found"}, 404
        return {
            "payment": {
                "id": str(p.id),
                "order_id": str(p.order_id),
                "status": p.status,
                "result_code": p.result_code,
                "result_desc": p.result_desc,
            }
        }, 200


class MpesaCallbackResource(Resource):
    def post(self):
        payload = request.get_json() or {}
        try:
            # Per Daraja docs: Body.stkCallback.CheckoutRequestID
            cb = payload.get("Body", {}).get("stkCallback", {})
            checkout_id = cb.get("CheckoutRequestID")
            result_code = str(cb.get("ResultCode"))
            result_desc = cb.get("ResultDesc")
        except Exception:
            checkout_id = None
            result_code = None
            result_desc = None

        if not checkout_id:
            return {"message": "Invalid callback"}, 400

        p = Payment.query.filter_by(checkout_request_id=checkout_id).first()
        if not p:
            return {"message": "Payment not found"}, 404

        p.raw_callback = json.dumps(payload)
        p.result_code = result_code
        p.result_desc = result_desc
        if result_code == "0":
            p.status = "success"
            # Mark order paid
            order = Order.query.get(p.order_id)
            if order:
                order.status = "paid"
                # increment sold counts on success
                try:
                    for oi in order.items:
                        tt = TicketType.query.get(oi.ticket_type_id)
                        if tt:
                            tt.quantity_sold = (tt.quantity_sold or 0) + (
                                oi.quantity or 0
                            )
                except Exception:
                    current_app.logger.exception("mpesa.callback increment sold failed")
        else:
            p.status = "failed"
        db.session.commit()
        return {"message": "ok"}, 200


class MpesaTestEnvResource(Resource):
    def get(self):
        """Test endpoint to check M-Pesa environment variables"""
        import os

        env_vars = {
            "MPESA_ENV": os.getenv("MPESA_ENV"),
            "MPESA_CONSUMER_KEY": (
                "***" + os.getenv("MPESA_CONSUMER_KEY", "")[-4:]
                if os.getenv("MPESA_CONSUMER_KEY")
                else None
            ),
            "MPESA_CONSUMER_SECRET": (
                "***" + os.getenv("MPESA_CONSUMER_SECRET", "")[-4:]
                if os.getenv("MPESA_CONSUMER_SECRET")
                else None
            ),
            "MPESA_SHORT_CODE": os.getenv("MPESA_SHORT_CODE"),
            "MPESA_PASSKEY": (
                "***" + os.getenv("MPESA_PASSKEY", "")[-4:]
                if os.getenv("MPESA_PASSKEY")
                else None
            ),
            "MPESA_CALLBACK_URL": os.getenv("MPESA_CALLBACK_URL"),
        }
        return env_vars, 200
