import io
import csv
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from ..models import Transaction, TransactionItem, Product
from .base import BaseDataAdapter


class CsvUploadAdapter(BaseDataAdapter):
    """
    Ingest store transactions from a CSV file.

    Required columns:
      date         — YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
      product_name — name of the product
      qty          — positive integer
      price        — positive sell price per unit

    Optional columns:
      category     — product category (default: General)
      cost_price   — cost per unit (required for new products; existing products reuse stored cost)
      payment_mode — UPI / CASH / CARD (default: UPI)

    New products without a cost_price column are rejected to prevent invented margins.
    Duplicate transactions (same merchant, product, date, qty, price) are skipped.
    """

    TEMPLATE_HEADER = "date,product_name,category,qty,price,cost_price,payment_mode"

    def __init__(self, csv_content: str):
        self.csv_content = csv_content

    def ingest_data(self, db: Session, merchant_id: int) -> Dict[str, Any]:
        if not self.csv_content or not self.csv_content.strip():
            raise ValueError("The uploaded CSV file is empty.")

        reader = csv.DictReader(io.StringIO(self.csv_content))
        rows = list(reader)
        if not rows:
            raise ValueError("CSV contains no data rows.")

        # Normalise header keys
        header_keys = {k.lower().strip() for k in rows[0].keys()}

        # Validate required columns
        has_product = any(k in header_keys for k in ("product_name", "product", "item", "name"))
        if not has_product:
            raise ValueError("CSV is missing required 'product_name' column.")
        if "qty" not in header_keys and "quantity" not in header_keys:
            raise ValueError("CSV is missing required 'qty' column.")
        if "price" not in header_keys and "rate" not in header_keys:
            raise ValueError("CSV is missing required 'price' column.")

        has_cost_price_col = "cost_price" in header_keys

        transactions_added = 0
        items_added = 0
        skipped_duplicates = 0

        for row_idx, row in enumerate(rows, start=2):
            # --- Date ---
            raw_ts = (row.get("date") or row.get("timestamp") or "").strip()
            if not raw_ts:
                raise ValueError(f"Row {row_idx}: Missing date.")
            try:
                ts = (
                    datetime.strptime(raw_ts, "%Y-%m-%d %H:%M:%S")
                    if " " in raw_ts
                    else datetime.strptime(raw_ts, "%Y-%m-%d")
                )
            except ValueError:
                raise ValueError(f"Row {row_idx}: Invalid date '{raw_ts}'. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS.")

            # --- Product name ---
            prod_name = (row.get("product_name") or row.get("product") or row.get("item") or row.get("name") or "").strip()
            if not prod_name:
                raise ValueError(f"Row {row_idx}: Missing product name.")

            # --- Qty ---
            try:
                qty = int(float(row.get("qty") or row.get("quantity") or ""))
                if qty <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ValueError(f"Row {row_idx}: Invalid qty '{row.get('qty')}'. Must be a positive integer.")

            # --- Price ---
            try:
                price = float(row.get("price") or row.get("rate") or "")
                if price <= 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ValueError(f"Row {row_idx}: Invalid price '{row.get('price')}'. Must be a positive number.")

            # --- Category & payment mode ---
            category = (row.get("category") or "General").strip()
            raw_mode = (row.get("payment_mode") or "UPI").strip().upper()
            payment_mode = raw_mode if raw_mode in ("UPI", "CASH", "CARD") else "UPI"

            # --- Find or create product ---
            product = db.query(Product).filter(
                Product.merchant_id == merchant_id,
                Product.name == prod_name
            ).first()

            if not product:
                # New product — cost_price is mandatory; do NOT invent it
                if not has_cost_price_col:
                    raise ValueError(
                        f"Row {row_idx}: Product '{prod_name}' is new but CSV has no 'cost_price' column. "
                        "Add a cost_price column so profit margins are accurate."
                    )
                raw_cost = (row.get("cost_price") or "").strip()
                if not raw_cost:
                    raise ValueError(f"Row {row_idx}: New product '{prod_name}' is missing cost_price.")
                try:
                    cost_price = float(raw_cost)
                    if cost_price <= 0:
                        raise ValueError()
                except (ValueError, TypeError):
                    raise ValueError(f"Row {row_idx}: Invalid cost_price '{raw_cost}' for '{prod_name}'.")

                product = Product(
                    merchant_id=merchant_id,
                    name=prod_name,
                    category=category,
                    cost_price=round(cost_price, 2),
                    sell_price=round(price, 2),
                    stock_qty=0,   # stock starts at 0; merchant manages actual stock separately
                    reorder_level=10,
                )
                db.add(product)
                db.flush()

            # --- Duplicate detection (same merchant, product, date, qty, price) ---
            tx_date_str = str(ts.date())
            existing = db.query(Transaction).join(TransactionItem).filter(
                Transaction.merchant_id == merchant_id,
                TransactionItem.product_id == product.id,
                TransactionItem.qty == qty,
                TransactionItem.price == price,
            ).filter(
                Transaction.ts.between(
                    datetime.strptime(tx_date_str, "%Y-%m-%d"),
                    datetime.strptime(tx_date_str + " 23:59:59", "%Y-%m-%d %H:%M:%S")
                )
            ).first()

            if existing:
                skipped_duplicates += 1
                continue

            # --- Create transaction ---
            tx = Transaction(
                merchant_id=merchant_id,
                customer_id=None,
                ts=ts,
                amount=round(qty * price, 2),
                payment_mode=payment_mode,
            )
            db.add(tx)
            db.flush()
            transactions_added += 1

            db.add(TransactionItem(transaction_id=tx.id, product_id=product.id, qty=qty, price=price))
            items_added += 1

        db.commit()
        return {
            "rows_processed": len(rows),
            "transactions_added": transactions_added,
            "items_added": items_added,
            "skipped_duplicates": skipped_duplicates,
        }
