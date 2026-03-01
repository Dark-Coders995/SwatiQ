
from flask import Blueprint , Request
from flask import request, jsonify
from datetime import date, datetime , timedelta
from models.models import Sale , Medicine , PurchaseOrder
from models.database import db
from typing import Any, Dict, List , Tuple , Optional

from models.database import db




def _success(data, status_code: int = 200):
    return jsonify({"success": True, "data": data, "error": None}), status_code


def _parse_iso_date(value: str) -> datetime.date:
    return datetime.fromisoformat(value).date()


def validate_medicine_payload(
    req: Request, *, require_all_fields: bool = True
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    payload = req.get_json(silent=True)
    if payload is None:
        return None, {"code": "invalid_json", "message": "Request body must be valid JSON."}

    required_fields = {
        "name",
        "generic_name",
        "category",
        "batch_no",
        "expiry_date",
        "quantity",
        "cost_price",
        "mrp",
        "supplier",
    }
    if require_all_fields:
        missing = [f for f in required_fields if f not in payload]
        if missing:
            return None, {
                "code": "missing_fields",
                "message": "Missing required fields.",
                "details": {"fields": missing},
            }
    else:
        if not payload:
            return None, {
                "code": "missing_fields",
                "message": "Request body must include at least one field.",
            }

    errors: Dict[str, str] = {}
    data: Dict[str, Any] = {}

    def should_validate(field: str) -> bool:
        return require_all_fields or field in payload

    def expect_str(field: str) -> None:
        if not should_validate(field):
            return
        value = payload.get(field)
        if not isinstance(value, str) or not value.strip():
            errors[field] = "Must be a non-empty string."
        else:
            data[field] = value.strip()

    for field in ["name", "generic_name", "category", "batch_no", "supplier"]:
        expect_str(field)

    for field in ["quantity", "cost_price", "mrp"]:
        if not should_validate(field):
            continue
        value = payload.get(field)
        if not isinstance(value, (int, float)):
            errors[field] = "Must be a number."
        elif value < 0:
            errors[field] = "Must be non-negative."
        else:
            data[field] = int(value) if field == "quantity" else float(value)

    if should_validate("expiry_date"):
        expiry_raw = payload.get("expiry_date")
        if not isinstance(expiry_raw, str):
            errors["expiry_date"] = "Must be an ISO date string (YYYY-MM-DD)."
        else:
            try:
                data["expiry_date"] = _parse_iso_date(expiry_raw)
            except ValueError:
                errors["expiry_date"] = "Invalid date format. Use YYYY-MM-DD."

    if errors:
        return None, {"code": "validation_error", "message": "Invalid request body.", "details": errors}

    return data, None


def serialize_medicine(medicine: Medicine) -> Dict[str, Any]:
    return {
        "id": medicine.id,
        "name": medicine.name,
        "generic_name": medicine.generic_name,
        "category": medicine.category,
        "batch_no": medicine.batch_no,
        "expiry_date": medicine.expiry_date.isoformat(),
        "quantity": medicine.quantity,
        "cost_price": medicine.cost_price,
        "mrp": medicine.mrp,
        "supplier": medicine.supplier,
        "status": medicine.status,
    }


def serialize_medicines(items: List[Medicine]) -> List[Dict[str, Any]]:
    return [serialize_medicine(m) for m in items]


inventory = Blueprint('inventory', __name__ , url_prefix="/api/inventory")

def _success(data, status_code: int = 200):
    return jsonify({"success": True, "data": data, "error": None}), status_code


def _error(message: str, code: str = "bad_request", status_code: int = 400, details=None):
    return (
        jsonify(
            {
                "success": False,
                "data": None,
                "error": {"code": code, "message": message, "details": details},
            }
        ),
        status_code,
    )


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


@inventory.get("/overview")
def inventory_overview():
    _sync_medicine_statuses()
    medicines = db.session.execute(db.select(Medicine)).scalars().all()
    total_items = len(medicines)
    active_stock = len([m for m in medicines if m.status == "active"])
    low_stock = len([m for m in medicines if m.status == "low_stock"])
    total_value = sum(m.quantity * m.cost_price for m in medicines)

    return _success(
        {
            "total_items": total_items,
            "active_stock": active_stock,
            "low_stock": low_stock,
            "total_value": round(total_value, 2),
        }
    )


@inventory.get("/medicines")
def list_medicines():
    _sync_medicine_statuses()
    search = request.args.get("search", type=str)
    status = request.args.get("status", type=str)
    category = request.args.get("category", type=str)

    query = db.select(Medicine)
    if search:
        like = f"%{search}%"
        query = query.where(
            (Medicine.name.ilike(like))
            | (Medicine.generic_name.ilike(like))
            | (Medicine.batch_no.ilike(like))
        )
    if status:
        query = query.where(Medicine.status == status)
    if category:
        query = query.where(Medicine.category == category)

    query = query.order_by(Medicine.name.asc())
    medicines = db.session.execute(query).scalars().all()
    return _success({"items": serialize_medicines(medicines), "total": len(medicines)})


@inventory.post("/medicines")
def add_medicine():
    data, error = validate_medicine_payload(request, require_all_fields=True)
    if error:
        return _error(error["message"], code=error.get("code", "validation_error"), status_code=422, details=error.get("details"))

    medicine = Medicine(**data)
    medicine.recompute_status()
    db.session.add(medicine)
    db.session.commit()
    return _success(serialize_medicine(medicine), status_code=201)


@inventory.put("/medicines/<int:medicine_id>")
def update_medicine(medicine_id: int):
    medicine = db.session.get(Medicine, medicine_id)
    if not medicine:
        return _error("Medicine not found.", code="not_found", status_code=404)

    data, error = validate_medicine_payload(request, require_all_fields=False)
    if error:
        return _error(error["message"], code=error.get("code", "validation_error"), status_code=422, details=error.get("details"))

    for key, value in data.items():
        setattr(medicine, key, value)
    medicine.recompute_status()
    db.session.commit()
    return _success(serialize_medicine(medicine))


@inventory.patch("/medicines/<int:medicine_id>/status")
def update_medicine_status(medicine_id: int):
    medicine = db.session.get(Medicine, medicine_id)
    if not medicine:
        return _error("Medicine not found.", code="not_found", status_code=404)

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in {"active", "low_stock", "expired", "out_of_stock"}:
        return _error(
            "Invalid status value.",
            code="validation_error",
            status_code=422,
            details={"status": "Must be one of active, low_stock, expired, out_of_stock."},
        )

    medicine.status_override = status
    medicine.recompute_status()
    db.session.commit()
    return _success(serialize_medicine(medicine))

