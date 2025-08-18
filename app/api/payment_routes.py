from flask import Blueprint, request
from flask_login import login_required, current_user
from app.models import db, Payment, UserCompany, Invoice
from datetime import datetime
from sqlalchemy import func

payment_routes = Blueprint('payments', __name__)

def check_access(company_id):
    return UserCompany.query.filter_by(user_id=current_user.id, company_id=company_id).first()

def _parse_date(date_str):
    return datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else None

def _recompute_invoice_status(invoice_id):
    inv = Invoice.query.get(invoice_id)
    if not inv:
        return
    total_paid = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.invoice_id == invoice_id).scalar() or 0
    try:
        inv_amt = float(inv.amount or 0)
    except Exception:
        inv_amt = 0
    if total_paid >= inv_amt and inv_amt > 0:
        inv.status = "Paid"
    db.session.commit()

@payment_routes.route('/companies/<int:company_id>/payments', methods=['GET'])
@login_required
def get_payments(company_id):
    if not check_access(company_id):
        return {"errors": ["Unauthorized"]}, 403
    payments = Payment.query.filter_by(company_id=company_id).all()
    return {"payments": [payment.to_dict() for payment in payments]}, 200

@payment_routes.route('/payments/<int:id>', methods=['GET'])
@login_required
def get_payment(id):
    payment = Payment.query.get(id)
    if not payment:
        return {"errors": ["Payment not found"]}, 404
    if not check_access(payment.company_id):
        return {"errors": ["Unauthorized"]}, 403
    return payment.to_dict(), 200

@payment_routes.route('/companies/<int:company_id>/payments', methods=['POST'])
@login_required
def create_payment(company_id):
    if not check_access(company_id):
        return {"errors": ["Unauthorized"]}, 403
    data = request.get_json(silent=True) or {}

    try:
        payment_date = _parse_date(data.get('payment_date'))
    except Exception:
        return {"errors": ["Invalid date format. Use YYYY-MM-DD"]}, 400

    payment = Payment(
        company_id=company_id,
        invoice_id=data.get('invoice_id'),
        vendor_id=data.get('vendor_id'),
        user_id=current_user.id,
        payment_date=payment_date,
        amount=data.get('amount'),
        method=data.get('method'),
        reference_number=data.get('reference_no') or data.get('reference_number'),
        notes=data.get('notes'),
        batch_id=data.get('batch_id')
    )
    db.session.add(payment)
    db.session.commit()
    _recompute_invoice_status(payment.invoice_id)
    return payment.to_dict(), 201

@payment_routes.route('/payments/<int:id>', methods=['PUT'])
@login_required
def update_payment(id):
    payment = Payment.query.get(id)
    if not payment:
        return {"errors": ["Payment not found"]}, 404
    if not check_access(payment.company_id):
        return {"errors": ["Unauthorized"]}, 403

    data = request.get_json(silent=True) or {}
    if 'invoice_id' in data:
        payment.invoice_id = data['invoice_id']
    if 'vendor_id' in data:
        payment.vendor_id = data['vendor_id']
    if 'payment_date' in data and data['payment_date']:
        try:
            payment.payment_date = _parse_date(data['payment_date'])
        except Exception:
            return {"errors": ["Invalid date format. Use YYYY-MM-DD"]}, 400
    if 'amount' in data:
        payment.amount = data['amount']
    if 'method' in data:
        payment.method = data['method']
    if 'reference_no' in data or 'reference_number' in data:
        payment.reference_number = data.get('reference_no') or data.get('reference_number')
    if 'notes' in data:
        payment.notes = data['notes']
    if 'batch_id' in data:
        payment.batch_id = data['batch_id']

    db.session.commit()
    _recompute_invoice_status(payment.invoice_id)
    return payment.to_dict(), 200

@payment_routes.route('/payments/<int:id>', methods=['DELETE'])
@login_required
def delete_payment(id):
    payment = Payment.query.get(id)
    if not payment:
        return {"errors": ["Payment not found"]}, 404
    if not check_access(payment.company_id):
        return {"errors": ["Unauthorized"]}, 403
    inv_id = payment.invoice_id
    db.session.delete(payment)
    db.session.commit()
    _recompute_invoice_status(inv_id)
    return {"message": "Successfully deleted"}, 200
