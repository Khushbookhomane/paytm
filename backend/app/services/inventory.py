from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Product, Transaction, TransactionItem

def get_inventory_status(db: Session, merchant_id: int) -> List[Dict[str, Any]]:
    """Return inventory items with live computed stock status and burn rate."""
    products = db.query(Product).filter(
        Product.merchant_id == merchant_id
    ).order_by(Product.stock_qty.asc()).all()

    # Calculate 30-day sales rate per product to estimate days of stock left
    thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
    sales_query = db.query(
        TransactionItem.product_id,
        func.sum(TransactionItem.qty).label("units_sold")
    ).join(
        Transaction, TransactionItem.transaction_id == Transaction.id
    ).filter(
        Transaction.merchant_id == merchant_id,
        func.date(Transaction.ts) >= str(thirty_days_ago)
    ).group_by(
        TransactionItem.product_id
    ).all()

    burn_rates = {row.product_id: (row.units_sold or 0) / 30.0 for row in sales_query}

    items = []
    for p in products:
        daily_burn = burn_rates.get(p.id, 0.5)
        if daily_burn > 0:
            days_left = round(p.stock_qty / daily_burn, 1)
        else:
            days_left = 99.0

        if p.stock_qty <= 0:
            status = "out"
        elif p.stock_qty <= p.reorder_level:
            status = "low"
        else:
            status = "ok"

        items.append({
            "id": p.id,
            "name": p.name,
            "category": p.category,
            "cost_price": p.cost_price,
            "sell_price": p.sell_price,
            "stock_qty": p.stock_qty,
            "reorder_level": p.reorder_level,
            "status": status,
            "days_of_stock_left": days_left,
        })

    return items
