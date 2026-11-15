import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

try:
    from dotenv import load_dotenv
    load_dotenv(backend_dir / ".env")
    load_dotenv(backend_dir.parent / ".env")
    load_dotenv()
except ImportError:
    pass

from app.db import SessionLocal, Base, engine
from app.adapters.seeded import SeededDemoAdapter
from app.models import Merchant, Product, Customer, Transaction, Expense

# Safety guard: refuse to seed if APP_ENV is production
APP_ENV = os.environ.get("APP_ENV", "development").lower()
if APP_ENV == "production":
    print("ERROR: seed.py must not be run in production. Set APP_ENV=development.")
    sys.exit(1)


def main():
    print("=" * 60)
    print("Paytm VentureAI: Seeding Development Test Data")
    print(f"Environment: {APP_ENV}")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        dev_email = os.environ.get("DEV_SEED_EMAIL", "demo@venture.ai")
        dev_password = os.environ.get("DEV_SEED_PASSWORD", "demo123")
        dev_name = os.environ.get("DEV_SEED_NAME", "Sharma General Store")
        adapter = SeededDemoAdapter(
            random_seed=42,
            merchant_email=dev_email,
            merchant_password=dev_password,
            merchant_name=dev_name,
        )
        result = adapter.ingest_data(db)

        print("\n[SUCCESS] Seed Data Generated:")
        for k, v in result.items():
            print(f"  - {k}: {v}")

        # Verification checks
        print("\nVerifying patterns:")

        low_stock = db.query(Product).filter(Product.stock_qty <= Product.reorder_level).all()
        print(f"  Low stock items: {len(low_stock)}")
        assert len(low_stock) >= 5, "Expected at least 5 products below reorder level"

        all_customers = db.query(Customer).all()
        print(f"  Customers seeded: {len(all_customers)}")
        assert "XXXXXX" in all_customers[0].phone_masked, "Phone must be masked"

        txs = db.query(Transaction).all()
        upi_count = sum(1 for t in txs if t.payment_mode == "UPI")
        upi_pct = (upi_count / len(txs)) * 100
        print(f"  Transactions: {len(txs)} | UPI share: {upi_pct:.1f}%")
        assert 65 < upi_pct < 85, f"UPI share out of range: {upi_pct:.1f}%"

        expenses = db.query(Expense).all()
        print(f"  Expenses seeded: {len(expenses)}")

        print("\nAll checks passed.")
        print("\n--- DEV TEST ACCOUNT (development only) ---")

        # Print the dev test merchant email (no hardcoded password printed)
        dev_merchant = db.query(Merchant).first()
        if dev_merchant:
            print(f"  Store:  {dev_merchant.name}")
            print(f"  Email:  {dev_merchant.email}")
            print("  Auth:   Use sign-in form with the registered password")
        print("=" * 60)

    finally:
        db.close()


if __name__ == "__main__":
    main()
