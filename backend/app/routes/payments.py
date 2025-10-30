import json
from uuid import UUID as _UUID

from flask import current_app, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required

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


def init_app(app):
    @app.route('/api/payments/mpesa/initiate', methods=['POST'])
    @jwt_required()
    def initiate_mpesa_payment():
        data = request.get_json() or {}
        user_id = _uuid(get_jwt_identity())
        if not user_id:
            return jsonify({"message": "Invalid token"}), 400
            
        event_id = _uuid(data.get("event_id"))
        phone = (data.get("phone") or "").strip()
        if not phone or not phone.startswith("254") or len(phone) != 12:
            return jsonify({"message": "Invalid phone number. Use format 2547XXXXXXXX"}), 400

        # Verify event exists and get ticket types
        event = Event.query.get(event_id)
        if not event:
            return jsonify({"message": "Event not found"}), 404

        # Create order
        order = Order(
            user_id=user_id,
            event_id=event_id,
            status="pending",
            total_amount=0,  # Will be updated with ticket amounts
        )
        db.session.add(order)

        # Process ticket types
        total_amount = 0
        for item in data.get("tickets", []):
            ticket_type = TicketType.query.get(_uuid(item.get("ticket_type_id")))
            if not ticket_type or ticket_type.event_id != event_id:
                db.session.rollback()
                return jsonify({"message": f"Invalid ticket type: {item.get('ticket_type_id')}"}), 400

            quantity = int(item.get("quantity", 1))
            if quantity < 1:
                continue

            # Check ticket availability
            if ticket_type.quantity_available is not None and quantity > ticket_type.quantity_available:
                db.session.rollback()
                return jsonify({
                    "message": f"Not enough tickets available for {ticket_type.name}"
                }), 400

            # Create order item
            order_item = OrderItem(
                order=order,
                ticket_type=ticket_type,
                quantity=quantity,
                price=ticket_type.price,
            )
            db.session.add(order_item)
            total_amount += ticket_type.price * quantity

        if total_amount <= 0:
            db.session.rollback()
            return jsonify({"message": "No valid tickets in order"}), 400

        # Update order total
        order.total_amount = total_amount

        # Create payment record
        payment = Payment(
            order=order,
            amount=total_amount,
            provider="mpesa",
            status="pending",
            phone=phone,
        )
        db.session.add(payment)
        db.session.commit()

        # Initiate STK push
        try:
            response = initiate_stk_push(
                phone=phone,
                amount=total_amount,
                account_reference=f"EVENT-{event.id}",
                callback_url=f"{app.config.get('BASE_URL')}/api/payments/mpesa/callback",
                description=f"Payment for {event.title}",
            )
            payment.provider_reference = response.get("CheckoutRequestID")
            db.session.commit()
            return jsonify({
                "message": "Payment initiated", 
                "payment_id": str(payment.id)
            })
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Failed to initiate M-Pesa payment: {str(e)}")
            return jsonify({"message": "Failed to initiate payment"}), 500

    @app.route('/api/payments/<payment_id>/status', methods=['GET'])
    @jwt_required()
    def get_payment_status(payment_id):
        payment = Payment.query.get(_uuid(payment_id))
        if not payment:
            return jsonify({"message": "Payment not found"}), 404

        # Verify the payment belongs to the current user
        if str(payment.order.user_id) != get_jwt_identity():
            return jsonify({"message": "Unauthorized"}), 403

        return jsonify({
            "payment_id": str(payment.id),
            "status": payment.status,
            "amount": payment.amount,
            "provider": payment.provider,
            "created_at": payment.created_at.isoformat(),
            "updated_at": payment.updated_at.isoformat(),
        })

    @app.route('/api/payments/mpesa/callback', methods=['POST'])
    def mpesa_callback():
        data = request.get_json()
        app.logger.info(f"M-Pesa callback received: {data}")

        # Verify the callback is from M-Pesa
        # In production, verify the callback signature

        # Process the callback
        result = data.get("Body", {}).get("stkCallback", {})
        checkout_request_id = result.get("CheckoutRequestID")
        result_code = result.get("ResultCode")

        if not checkout_request_id:
            app.logger.error("No CheckoutRequestID in M-Pesa callback")
            return jsonify({"message": "Invalid callback"}), 400

        # Find the payment
        payment = Payment.query.filter_by(provider_reference=checkout_request_id).first()
        if not payment:
            app.logger.error(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
            return jsonify({"message": "Payment not found"}), 404

        # Update payment status based on M-Pesa response
        if result_code == "0":
            payment.status = "completed"
            payment.order.status = "completed"
            # Generate QR codes for tickets
            for item in payment.order.items:
                for _ in range(item.quantity):
                    # Generate QR code with ticket details
                    ticket_data = {
                        "order_id": str(payment.order.id),
                        "ticket_type_id": str(item.ticket_type_id),
                        "event_id": str(item.ticket_type.event_id),
                    }
                    qr_code_url = generate_ticket_qr(ticket_data)
                    # In a real app, you would save this QR code URL to a ticket record
                    current_app.logger.exception(f"mpesa.callback ticket processing failed: {str(e)}")
                    db.session.rollback()
                    # Re-raise to trigger the outer exception handler
                    raise
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


# Create the payments blueprint
payments_bp = Blueprint('payments', __name__)
api = Api(payments_bp)

# Add resources to the API
api.add_resource(MpesaInitiateResource, '/mpesa/initiate')
api.add_resource(PaymentStatusResource, '/status/<string:payment_id>')
api.add_resource(MpesaCallbackResource, '/mpesa/callback')
api.add_resource(MpesaTestEnvResource, '/mpesa/test-env')
