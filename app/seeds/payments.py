from app.models import db, Payment, Invoice, environment, SCHEMA
from datetime import datetime, date
from sqlalchemy.sql import text

def seed_payments():
    invoice_numbers = ["INV-1001", "INV-1002", "INV-2001", "INV-3001"]
    invoices = Invoice.query.filter(Invoice.invoice_number.in_(invoice_numbers)).all()
    by_number = {i.invoice_number: i for i in invoices}

    payments = [
        Payment(
            company_id=by_number["INV-1001"].company_id,
            invoice_id=by_number["INV-1001"].id,
            vendor_id=by_number["INV-1001"].vendor_id,
            user_id=1,
            payment_date=date(2025, 8, 5),
            amount=500.00,
            method="ACH",
            reference_number="PAY-001",
            notes="Partial payment for laptops"
        ),
        Payment(
            company_id=by_number["INV-1002"].company_id,
            invoice_id=by_number["INV-1002"].id,
            vendor_id=by_number["INV-1002"].vendor_id,
            user_id=2,
            payment_date=date(2025, 8, 3),
            amount=300.00,
            method="Check",
            reference_number="PAY-002",
            notes="Full stationery payment"
        ),
        Payment(
            company_id=by_number["INV-2001"].company_id,
            invoice_id=by_number["INV-2001"].id,
            vendor_id=by_number["INV-2001"].vendor_id,
            user_id=3,
            payment_date=date(2025, 8, 7),
            amount=1000.00,
            method="Wire",
            reference_number="PAY-003",
            notes="First installment for legal fees"
        ),
        Payment(
            company_id=by_number["INV-3001"].company_id,
            invoice_id=by_number["INV-3001"].id,
            vendor_id=by_number["INV-3001"].vendor_id,
            user_id=4,
            payment_date=date(2025, 8, 2),
            amount=500.00,
            method="ACH",
            reference_number="PAY-004",
            notes="Paid food ingredients"
        ),
    ]
    db.session.add_all(payments)
    db.session.commit()

def undo_payments():
    if environment == "production":
        db.session.execute(f"TRUNCATE table {SCHEMA}.payments RESTART IDENTITY CASCADE;")
    else:
        db.session.execute(text("DELETE FROM payments"))
    db.session.commit()
