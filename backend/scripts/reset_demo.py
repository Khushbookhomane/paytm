import os
import sys
import time
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.db import Base, engine, SessionLocal
from app.adapters.seeded import SeededDemoAdapter

def main():
    start_time = time.time()
    print("=" * 60)
    print("PAYTM VENTUREAI: FAST DEV RE-SEED")
    print("=" * 60)

    # Clean and re-seed dev environment
    Base.metadata.create_all(bind=engine)

    print("-> Seeding deterministic development store...")
    db = SessionLocal()
    try:
        adapter = SeededDemoAdapter(random_seed=42)
        result = adapter.ingest_data(db)
        duration = time.time() - start_time
        print(f"\n[DONE] Store seeded in {duration:.2f} seconds!")
        print(f"  - Products:     {result['products_count']}")
        print(f"  - Customers:    {result['customers_count']}")
        print(f"  - Transactions: {result['transactions_count']}")
        print(f"  - Dev Account:  dev@ventureai.local (Passwordless Magic Link or Dev Password)")
    finally:
        db.close()
    print("=" * 60)

if __name__ == "__main__":
    main()
