from datetime import datetime, timedelta
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    require_admin,
    verify_password,
)
from app.models import all_models

router = APIRouter()
MONTH_SHORT_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    role: str


class UserUpdate(BaseModel):
    username: str
    role: str
    password: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    barcode: str
    purchase_price: float
    sale_price: float
    stock: int
    min_stock: Optional[int] = 5


class ProductUpdate(BaseModel):
    name: str
    barcode: str
    purchase_price: float
    sale_price: float
    stock: int
    min_stock: int


class SaleItemSchema(BaseModel):
    product_id: int
    quantity: int
    price: float


class SaleCreate(BaseModel):
    items: List[SaleItemSchema]
    total: float


class ExpenseCreate(BaseModel):
    type: str
    amount: float
    description: str


class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime


def get_period_start(date_value: datetime, period: str) -> datetime:
    normalized = datetime(date_value.year, date_value.month, date_value.day)
    if period == "daily":
        return normalized
    if period == "weekly":
        return normalized - timedelta(days=normalized.weekday())
    if period == "monthly":
        return datetime(normalized.year, normalized.month, 1)
    if period == "quarterly":
        quarter_start_month = ((normalized.month - 1) // 3) * 3 + 1
        return datetime(normalized.year, quarter_start_month, 1)
    raise HTTPException(status_code=400, detail="Periodo inválido")


def get_period_label(date_value: datetime, period: str) -> str:
    start = get_period_start(date_value, period)
    if period == "daily":
        return start.strftime("%Y-%m-%d")
    if period == "weekly":
        end = start + timedelta(days=6)
        return f"{start.strftime('%Y-%m-%d')} al {end.strftime('%Y-%m-%d')}"
    if period == "monthly":
        return start.strftime("%Y-%m")
    quarter_end_month = start.month + 2
    return f"{MONTH_SHORT_NAMES[start.month - 1]}-{MONTH_SHORT_NAMES[quarter_end_month - 1]} {start.year}"


def get_period_end(date_value: datetime, period: str) -> datetime:
    start = get_period_start(date_value, period)
    if period == "daily":
        return start + timedelta(days=1)
    if period == "weekly":
        return start + timedelta(days=7)
    if period == "monthly":
        if start.month == 12:
            return datetime(start.year + 1, 1, 1)
        return datetime(start.year, start.month + 1, 1)
    if period == "quarterly":
        if start.month == 10:
            return datetime(start.year + 1, 1, 1)
        return datetime(start.year, start.month + 3, 1)
    raise HTTPException(status_code=400, detail="Periodo inválido")


@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    return db.query(all_models.User).all()


@router.post("/users")
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    existing_user = db.query(all_models.User).filter(all_models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    hashed_pwd = get_password_hash(user.password)
    db_user = all_models.User(username=user.username, password_hash=hashed_pwd, role=user.role)
    db.add(db_user)
    db.commit()
    return {"message": "Usuario creado"}


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: all_models.User = Depends(require_admin),
):
    db_user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    existing_user = db.query(all_models.User).filter(
        all_models.User.username == user.username,
        all_models.User.id != user_id,
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    if current_admin.id == user_id and user.role != "admin":
        raise HTTPException(status_code=400, detail="No puedes quitarte tu propio rol de administrador")

    db_user.username = user.username
    db_user.role = user.role
    if user.password:
        db_user.password_hash = get_password_hash(user.password)

    db.commit()
    return {"message": "Usuario actualizado"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: all_models.User = Depends(require_admin),
):
    db_user = db.query(all_models.User).filter(all_models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propio usuario")

    db.delete(db_user)
    db.commit()
    return {"message": "Usuario eliminado"}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(all_models.User).filter(all_models.User.username == data.username).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    return {
        "access_token": create_access_token(subject=user.username),
        "role": user.role,
        "username": user.username,
    }


@router.get("/products")
def get_products(
    db: Session = Depends(get_db),
    _: all_models.User = Depends(get_current_user),
):
    return db.query(all_models.Product).order_by(all_models.Product.name.asc()).all()


@router.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    existing_product = db.query(all_models.Product).filter(all_models.Product.barcode == product.barcode).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="El código de barras ya existe")

    db_product = all_models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    db_product = db.query(all_models.Product).filter(all_models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing_product = db.query(all_models.Product).filter(
        all_models.Product.barcode == product.barcode,
        all_models.Product.id != product_id,
    ).first()
    if existing_product:
        raise HTTPException(status_code=400, detail="El código de barras ya existe")

    db_product.name = product.name
    db_product.barcode = product.barcode
    db_product.purchase_price = product.purchase_price
    db_product.sale_price = product.sale_price
    db_product.stock = product.stock
    db_product.min_stock = product.min_stock

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    db_product = db.query(all_models.Product).filter(all_models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    product_has_sales = db.query(all_models.SaleItem).filter(all_models.SaleItem.product_id == product_id).first()
    if product_has_sales:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un producto con ventas registradas",
        )

    db.delete(db_product)
    db.commit()
    return {"message": "Producto eliminado"}


@router.get("/products/excel")
def export_products_excel(
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    products = db.query(all_models.Product).all()
    data = [
        {
            "Nombre": product.name,
            "Codigo": product.barcode,
            "P. Compra": product.purchase_price,
            "P. Venta": product.sale_price,
            "Stock": product.stock,
            "Stock Min": product.min_stock,
        }
        for product in products
    ]
    df = pd.DataFrame(data)
    file_path = "inventario_supermercado.xlsx"
    df.to_excel(file_path, index=False)
    return FileResponse(file_path, filename=file_path)


@router.post("/sales")
def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user: all_models.User = Depends(get_current_user),
):
    db_sale = all_models.Sale(total=sale.total, user_id=current_user.id)
    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)

    for item in sale.items:
        product = db.query(all_models.Product).filter(all_models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no encontrado")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {product.name}")

        db.add(all_models.SaleItem(sale_id=db_sale.id, **item.dict()))
        product.stock -= item.quantity

    db.commit()
    return {"message": "Venta registrada", "id": db_sale.id}


@router.get("/expenses")
def get_expenses(
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    return db.query(all_models.Expense).all()


@router.post("/expenses")
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    db_expense = all_models.Expense(**expense.dict())
    db.add(db_expense)
    db.commit()
    return {"message": "Gasto registrado"}


@router.get("/events")
def get_events(
    db: Session = Depends(get_db),
    _: all_models.User = Depends(get_current_user),
):
    return db.query(all_models.Event).all()


@router.post("/events")
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(get_current_user),
):
    db_event = all_models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    return {"message": "Evento creado"}


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    total_sales = db.query(all_models.Sale).count()
    total_income = db.query(all_models.Sale).with_entities(all_models.Sale.total).all()
    sum_income = sum(sale[0] for sale in total_income) if total_income else 0
    low_stock = db.query(all_models.Product).filter(all_models.Product.stock <= all_models.Product.min_stock).count()
    return {"total_sales": total_sales, "sum_income": sum_income, "low_stock_count": low_stock}


@router.get("/reports/summary")
def get_reports_summary(
    period: str = "daily",
    report_type: str = "mixed",
    limit: int = 30,
    reference_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _: all_models.User = Depends(require_admin),
):
    valid_periods = {"daily", "weekly", "monthly", "quarterly"}
    valid_types = {"sales", "expenses", "mixed"}
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail="Periodo inválido")
    if report_type not in valid_types:
        raise HTTPException(status_code=400, detail="Tipo de reporte inválido")
    limit = max(1, min(limit, 90))
    try:
        selected_date = datetime.strptime(reference_date, "%Y-%m-%d") if reference_date else datetime.utcnow()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Fecha inválida") from exc

    period_end = get_period_end(selected_date, period)

    bucket_map = {}

    if report_type in {"sales", "mixed"}:
        sales = db.query(all_models.Sale).filter(all_models.Sale.date < period_end).order_by(all_models.Sale.date.asc()).all()
        for sale in sales:
            bucket_start = get_period_start(sale.date, period)
            key = bucket_start.isoformat()
            if key not in bucket_map:
                bucket_map[key] = {
                    "label": get_period_label(sale.date, period),
                    "sales_count": 0,
                    "income_total": 0.0,
                    "expense_total": 0.0,
                }
            bucket_map[key]["sales_count"] += 1
            bucket_map[key]["income_total"] += float(sale.total or 0)

    if report_type in {"expenses", "mixed"}:
        expenses = db.query(all_models.Expense).filter(all_models.Expense.date < period_end).order_by(all_models.Expense.date.asc()).all()
        for expense in expenses:
            bucket_start = get_period_start(expense.date, period)
            key = bucket_start.isoformat()
            if key not in bucket_map:
                bucket_map[key] = {
                    "label": get_period_label(expense.date, period),
                    "sales_count": 0,
                    "income_total": 0.0,
                    "expense_total": 0.0,
                }
            bucket_map[key]["expense_total"] += float(expense.amount or 0)

    selected_key = get_period_start(selected_date, period).isoformat()
    ordered_keys = sorted([key for key in bucket_map.keys() if key <= selected_key])[-limit:]
    series = []
    for key in ordered_keys:
        item = bucket_map[key]
        series.append({
            "label": item["label"],
            "sales_count": item["sales_count"],
            "income_total": round(item["income_total"], 2),
            "expense_total": round(item["expense_total"], 2),
            "net_total": round(item["income_total"] - item["expense_total"], 2),
        })

    totals = {
        "sales_count": sum(item["sales_count"] for item in series),
        "income_total": round(sum(item["income_total"] for item in series), 2),
        "expense_total": round(sum(item["expense_total"] for item in series), 2),
        "net_total": round(sum(item["net_total"] for item in series), 2),
    }

    return {
        "period": period,
        "report_type": report_type,
        "limit": limit,
        "reference_date": selected_date.strftime("%Y-%m-%d"),
        "selected_label": get_period_label(selected_date, period),
        "series": series,
        "totals": totals,
    }
