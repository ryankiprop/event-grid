from app import create_app
from app.extensions import db
from app.models import Order, OrderItem
from app.utils.qrcode_util import generate_ticket_qr

def fix_missing_qr_codes():
    app = create_app()
    with app.app_context():
        # Find all paid orders with items that have no QR code
        orders = Order.query.filter_by(status='paid').all()
        fixed_count = 0
        
        for order in orders:
            for item in order.items:
                if not item.qr_code:
                    try:
                        item.qr_code = generate_ticket_qr(order.id, item.id, order.user_id)
                        print(f"Generated QR code for order {order.id}, item {item.id}")
                        fixed_count += 1
                    except Exception as e:
                        print(f"Error generating QR code for order {order.id}, item {item.id}: {str(e)}")
                        db.session.rollback()
                        continue
        
        if fixed_count > 0:
            db.session.commit()
            print(f"Successfully generated {fixed_count} QR codes")
        else:
            print("No missing QR codes found")

if __name__ == "__main__":
    fix_missing_qr_codes()
