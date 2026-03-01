

from models.models import *
from models.database import db
from datetime import timedelta



def seed_database() -> None:
    """Populate the database with a small set of demo data if empty."""
    if Medicine.query.first() is not None:
        return

    today = date.today()

    medicines = [
        Medicine(
            name="Paraceta mol 650mg",
            generic_name="Acetaminophen",
            category="Analgesic",
            batch_no="PCM-2024-0892",
            expiry_date=today + timedelta(days=540),
            quantity=500,
            cost_price=15.0,
            mrp=25.0,
            supplier="MedSupply Co.",
        ),
        Medicine(
            name="Omeprazole 20mg Capsule",
            generic_name="Omeprazole",
            category="Gastric",
            batch_no="OMP-2024-5873",
            expiry_date=today + timedelta(days=260),
            quantity=45,
            cost_price=65.0,
            mrp=95.75,
            supplier="HealthCare Ltd.",
        ),
        Medicine(
            name="Aspirin 75mg",
            generic_name="Aspirin",
            category="Anticoagulant",
            batch_no="ASP-2023-3401",
            expiry_date=today - timedelta(days=150),
            quantity=300,
            cost_price=28.0,
            mrp=45.0,
            supplier="GreenMed",
        ),
        Medicine(
            name="Atorvastatin 10mg",
            generic_name="Atorvastatin Besylate",
            category="Cardiovascular",
            batch_no="AME-2024-0945",
            expiry_date=today + timedelta(days=220),
            quantity=0,
            cost_price=145.0,
            mrp=195.0,
            supplier="PharmaCorp",
        ),
    ]

    for med in medicines:
        med.recompute_status()
        db.session.add(med)

    db.session.flush()

    # Recent sales (today and yesterday)
    sale1 = Sale(
        invoice_no="INV-2024-1234",
        patient_name="Rajesh Kumar",
        items_count=3,
        payment_method="Card",
        total_amount=340.0,
        created_at=datetime.utcnow().replace(hour=11, minute=0, second=0, microsecond=0),
    )
    sale2 = Sale(
        invoice_no="INV-2024-1235",
        patient_name="Sarah Smith",
        items_count=2,
        payment_method="Cash",
        total_amount=145.0,
        created_at=datetime.utcnow().replace(hour=14, minute=30, second=0, microsecond=0),
    )
    sale3 = Sale(
        invoice_no="INV-2024-1236",
        patient_name="Michael Johnson",
        items_count=5,
        payment_method="UPI",
        total_amount=625.0,
        created_at=datetime.utcnow() - timedelta(days=1),
    )

    db.session.add_all([sale1, sale2, sale3])
    db.session.flush()

    # Simple sale items linking to medicines
    for sale in (sale1, sale2, sale3):
        for med in medicines[:2]:
            db.session.add(
                SaleItem(
                    sale_id=sale.id,
                    medicine_id=med.id,
                    quantity=1,
                    price=med.mrp,
                )
            )

    # Purchase orders
    purchase_orders = [
        PurchaseOrder(
            order_no="PO-2024-0001",
            supplier="MedSupply Co.",
            status="pending",
            total_amount=96250.0,
            created_at=datetime.utcnow() - timedelta(days=2),
        ),
        PurchaseOrder(
            order_no="PO-2024-0002",
            supplier="HealthCare Ltd.",
            status="completed",
            total_amount=55200.0,
            created_at=datetime.utcnow() - timedelta(days=7),
        ),
    ]
    db.session.add_all(purchase_orders)

    db.session.commit()

