from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant, Product, SupplierOrder
from ..schemas import ProductItem, InventoryForecastItem, SupplierOrderCreate, SupplierOrderUpdate, SupplierOrderOut
from ..auth import get_current_merchant
from ..services.inventory import get_inventory_status
from ..services.forecasting import generate_inventory_forecast

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=List[ProductItem])
def get_inventory(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return get_inventory_status(db, current_merchant.id)


@router.get("/forecast", response_model=List[InventoryForecastItem])
def get_forecast(
    days: int = Query(7, ge=1, le=30),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return generate_inventory_forecast(db, current_merchant.id, forecast_days=days)


@router.post("/reorders", response_model=SupplierOrderOut, status_code=status.HTTP_201_CREATED)
def create_reorder(
    req: SupplierOrderCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Create a persistent reorder record. Called when merchant taps 'Restock Now'."""
    # Verify product belongs to this merchant
    product = db.query(Product).filter(
        Product.id == req.product_id,
        Product.merchant_id == current_merchant.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if req.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive.")

    order = SupplierOrder(
        merchant_id=current_merchant.id,
        product_id=req.product_id,
        supplier_name=req.supplier_name,
        quantity=req.quantity,
        order_status="pending",
        expected_delivery_date=req.expected_delivery_date,
        notes=req.notes,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        **order.__dict__,
        "product_name": product.name,
    }


@router.get("/reorders", response_model=List[SupplierOrderOut])
def list_reorders(
    order_status: str = Query(None),
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """List all reorder records for this merchant, optionally filtered by status."""
    q = db.query(SupplierOrder, Product.name.label("product_name")).join(
        Product, SupplierOrder.product_id == Product.id
    ).filter(SupplierOrder.merchant_id == current_merchant.id)

    if order_status:
        q = q.filter(SupplierOrder.order_status == order_status)

    results = q.order_by(SupplierOrder.created_at.desc()).all()
    return [
        {**row.SupplierOrder.__dict__, "product_name": row.product_name}
        for row in results
    ]


@router.patch("/reorders/{order_id}", response_model=SupplierOrderOut)
def update_reorder(
    order_id: int,
    req: SupplierOrderUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Update reorder status or details. Enforces merchant ownership."""
    order = db.query(SupplierOrder).filter(
        SupplierOrder.id == order_id,
        SupplierOrder.merchant_id == current_merchant.id
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Reorder not found.")

    valid_statuses = ("pending", "confirmed", "delivered", "cancelled")
    if req.order_status and req.order_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    if req.order_status:
        order.order_status = req.order_status
    if req.supplier_name is not None:
        order.supplier_name = req.supplier_name
    if req.expected_delivery_date is not None:
        order.expected_delivery_date = req.expected_delivery_date
    if req.notes is not None:
        order.notes = req.notes

    db.commit()
    db.refresh(order)

    product = db.query(Product).filter(Product.id == order.product_id).first()
    return {**order.__dict__, "product_name": product.name if product else None}
