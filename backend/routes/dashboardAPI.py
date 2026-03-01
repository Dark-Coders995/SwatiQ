from flask import Blueprint
from flask import request, jsonify
from datetime import date, datetime , timedelta
from models.models import Sale , Medicine , PurchaseOrder
from models.database import db
from typing import Any, Dict, List


def _success(data, status_code: int = 200):
    return jsonify({"success": True, "data": data, "error": None}), status_code


def serialize_sale(sale: Sale) -> Dict[str, Any]:
    return {
        "id": sale.id,
        "invoice_no": sale.invoice_no,
        "patient_name": sale.patient_name,
        "items_count": sale.items_count,
        "payment_method": sale.payment_method,
        "total_amount": sale.total_amount,
        "created_at": sale.created_at.isoformat(),
    }


def serialize_sales(items: List[Sale]) -> List[Dict[str, Any]]:
    return [serialize_sale(s) for s in items]



def _sync_medicine_statuses() -> None:
    medicines = db.session.execute(db.select(Medicine)).scalars().all()
    changed = False
    for m in medicines:
        before = m.status
        m.recompute_status()
        if m.status != before:
            changed = True
    if changed:
        db.session.commit()



dashboard = Blueprint('dashboard', __name__ , url_prefix="/api/dashboard")

@dashboard.get("/today-sales-summary")
def today_sales_summary():
    today = date.today()
    start_today = datetime.combine(today, datetime.min.time())
    start_yesterday = start_today - timedelta(days=1)
    start_day_before_yesterday = start_yesterday - timedelta(days=1)

    today_sales = (
        db.session.execute(
            db.select(Sale).where(Sale.created_at >= start_today)
        )
        .scalars()
        .all()
    )
    yesterday_sales = (
        db.session.execute(
            db.select(Sale).where(
                Sale.created_at >= start_yesterday, Sale.created_at < start_today
            )
        )
        .scalars()
        .all()
    )

    total_today = sum(s.total_amount for s in today_sales)
    total_yesterday = sum(s.total_amount for s in yesterday_sales)
    change_percent = 0.0
    if total_yesterday > 0:
        change_percent = ((total_today - total_yesterday) / total_yesterday) * 100

    data = {
        "total_amount": round(total_today, 2),
        "change_percent": round(change_percent, 2),
        "orders_count": len(today_sales),
    }
    return _success(data)


@dashboard.get("/items-sold-today")
def items_sold_today():
    today = date.today()
    start_today = datetime.combine(today, datetime.min.time())

    today_sales = (
        db.session.execute(
            db.select(Sale).where(Sale.created_at >= start_today)
        )
        .scalars()
        .all()
    )
    items_sold = sum(s.items_count for s in today_sales)
    return _success({"items_sold": items_sold})





@dashboard.get("/low-stock-items")
def low_stock_items():
    _sync_medicine_statuses()
    limit = request.args.get("limit", default=5, type=int)
    total_count = (
        db.session.query(Medicine)
        .filter(Medicine.status == "low_stock")
        .count()
    )
    low_stock = (
        db.session.execute(
            db.select(Medicine)
            .where(Medicine.status == "low_stock")
            .order_by(Medicine.quantity.asc())
            .limit(limit)
        )
        .scalars()
        .all()
    )
    data = {
        "count": total_count,
        "items": [
            {"id": m.id, "name": m.name, "quantity": m.quantity} for m in low_stock
        ],
    }
    return _success(data)


@dashboard.get("/purchase-orders-summary")
def purchase_orders_summary():
    purchase_orders = (
        db.session.execute(db.select(PurchaseOrder))
        .scalars()
        .all()
    )
    pending = [po for po in purchase_orders if po.status == "pending"]
    total_value = sum(po.total_amount for po in purchase_orders)
    data = {
        "pending_count": len(pending),
        "total_value": round(total_value, 2),
    }
    return _success(data)



@dashboard.get("/recent-sales")
def recent_sales():
    limit = request.args.get("limit", default=5, type=int)
    sales = (
        db.session.execute(
            db.select(Sale).order_by(Sale.created_at.desc()).limit(limit)
        )
        .scalars()
        .all()
    )

    return _success(serialize_sales(sales))

