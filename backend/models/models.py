from models.database import db
from datetime import date, datetime

class Medicine(db.Model):
    __tablename__ = 'medicines'
    id = db.Column(db.Integer , primary_key = True , autoincrement = True)
    name = db.Column(db.String(255) , nullable=False)
    generic_name = db.Column(db.String(255) , nullable=False)
    category = db.Column(db.String(255) , nullable=False)
    batch_no = db.Column(db.String(255) , unique = True,  nullable=False)
    expiry_date = db.Column(db.Date , nullable = False )
    quantity = db.Column(db.Integer, nullable=False)
    cost_price = db.Column(db.Float, nullable=False)
    supplier = db.Column(db.String(255) , nullable=False)
    status = db.Column(db.String(255) , default = 'active')

    mrp = db.Column(db.Float, nullable=False)
    status_override = db.Column(db.String(50), nullable=True)

    sale_items = db.relationship("SaleItem", back_populates="medicine")

    def recompute_status(self, low_stock_threshold: int = 50) -> None:
        today = date.today()

        if self.expiry_date < today:
            self.status = "expired"
        elif self.quantity == 0:
            self.status = "out_of_stock"
        elif self.status_override in {"active", "low_stock", "expired", "out_of_stock"}:
            self.status = self.status_override
        elif self.quantity < low_stock_threshold:
            self.status = "low_stock"
        else:
            self.status = "active"


class Sale(db.Model):
    __tablename__ = "sales"

    id = db.Column(db.Integer, primary_key=True)
    invoice_no = db.Column(db.String(100), nullable=False, unique=True)
    patient_name = db.Column(db.String(255), nullable=False)
    items_count = db.Column(db.Integer, nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    items = db.relationship("SaleItem", back_populates="sale")


class SaleItem(db.Model):
    __tablename__ = "sale_items"

    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sales.id"), nullable=False)
    medicine_id = db.Column(db.Integer, db.ForeignKey("medicines.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    sale = db.relationship("Sale", back_populates="items")
    medicine = db.relationship("Medicine", back_populates="sale_items")


class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"

    id = db.Column(db.Integer, primary_key=True)
    order_no = db.Column(db.String(100), nullable=False, unique=True)
    supplier = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="pending")
    total_amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

