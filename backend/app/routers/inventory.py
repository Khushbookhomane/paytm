from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import Merchant, Product, SupplierOrder
from ..schemas import ProductItem, InventoryForecastItem, SupplierOrderCreate, SupplierOrderUpdate, SupplierOrderOut
from ..auth import get_current_merchant
from ..services.inventory import get_inventory_status
from ..services.forecasting import generate_inventory_forecast

router = APIRouter(prefix="/inventory", tags=["inventory"])

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str = Field(..., min_length=2, max_length=50)
    cost_price: float = Field(..., gt=0)
    sell_price: float = Field(..., gt=0)
    stock_qty: int = Field(0, ge=0)
    reorder_level: int = Field(10, ge=1)

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    cost_price: Optional[float] = None
    sell_price: Optional[float] = None
    stock_qty: Optional[int] = None
    reorder_level: Optional[int] = None


@router.get("", response_model=List[ProductItem])
def get_inventory(
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    return get_inventory_status(db, current_merchant.id)


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(
    req: ProductCreate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Add a new product to the merchant's catalog."""
    prod = Product(
        merchant_id=current_merchant.id,
        name=req.name,
        category=req.category,
        cost_price=req.cost_price,
        sell_price=req.sell_price,
        stock_qty=req.stock_qty,
        reorder_level=req.reorder_level,
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return {
        "id": prod.id,
        "name": prod.name,
        "category": prod.category,
        "cost_price": prod.cost_price,
        "sell_price": prod.sell_price,
        "stock_qty": prod.stock_qty,
        "reorder_level": prod.reorder_level,
        "status": "ok" if prod.stock_qty > prod.reorder_level else "low"
    }


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    req: ProductUpdate,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Update product details or inventory count."""
    prod = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == current_merchant.id
    ).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    if req.name is not None:
        prod.name = req.name
    if req.category is not None:
        prod.category = req.category
    if req.cost_price is not None:
        prod.cost_price = req.cost_price
    if req.sell_price is not None:
        prod.sell_price = req.sell_price
    if req.stock_qty is not None:
        prod.stock_qty = req.stock_qty
    if req.reorder_level is not None:
        prod.reorder_level = req.reorder_level

    db.commit()
    db.refresh(prod)
    return {
        "id": prod.id,
        "name": prod.name,
        "category": prod.category,
        "cost_price": prod.cost_price,
        "sell_price": prod.sell_price,
        "stock_qty": prod.stock_qty,
        "reorder_level": prod.reorder_level,
        "status": "out" if prod.stock_qty <= 0 else ("low" if prod.stock_qty <= prod.reorder_level else "ok")
    }


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_merchant: Merchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """Delete a product from the catalog."""
    prod = db.query(Product).filter(
        Product.id == product_id,
        Product.merchant_id == current_merchant.id
    ).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")

    db.delete(prod)
    db.commit()
    return {"status": "success", "message": f"Product '{prod.name}' deleted successfully."}


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

    if order_status and isinstance(order_status, str) and order_status.lower() != "all":
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
