import os
import random
from datetime import datetime, timedelta, date
from typing import Dict, Any
from sqlalchemy.orm import Session

import hashlib
from ..models import Merchant, Product, Customer, Transaction, TransactionItem, Expense, Recommendation
from .base import BaseDataAdapter


def _hash_password(password: str) -> str:
    """Simple SHA-256 hash for dev seed data only — not used in production auth."""
    import secrets as _s
    salt = _s.token_hex(16)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{h}"


class SeededDemoAdapter(BaseDataAdapter):
    """
    Deterministic 90-day Indian Kirana Store Seed Data Generator.
    Used for development and testing only.
    Credentials are passed in — never hardcoded.
    """

    def __init__(
        self,
        random_seed: int = 42,
        merchant_email: str = None,
        merchant_password: str = None,
        merchant_name: str = "Dev Test Store",
    ):
        self.random_seed = random_seed
        # Read from env if not passed directly — never hardcode
        self.merchant_email = merchant_email or os.environ.get("DEV_SEED_EMAIL", "dev@ventureai.local")
        self.merchant_password = merchant_password or os.environ.get("DEV_SEED_PASSWORD", "")
        self.merchant_name = merchant_name

    def ingest_data(self, db: Session, merchant_id: int = None) -> Dict[str, Any]:
        random.seed(self.random_seed)

        if not self.merchant_password:
            raise ValueError(
                "DEV_SEED_PASSWORD environment variable is required to seed data. "
                "Set it in your .env file. Do not hardcode passwords."
            )

        # Find or create the dev merchant
        merchant = db.query(Merchant).filter(Merchant.email == self.merchant_email).first()
        if not merchant:
            merchant = Merchant(
                name=self.merchant_name,
                email=self.merchant_email,
                password_hash=_hash_password(self.merchant_password),
                category="kirana",
                language="hi",
                plan="free",
                email_verified="1",
            )
            db.add(merchant)
            db.commit()
            db.refresh(merchant)
        merchant_id = merchant.id

        # Clear existing data for deterministic idempotency
        db.query(TransactionItem).filter(
            TransactionItem.transaction_id.in_(
                db.query(Transaction.id).filter(Transaction.merchant_id == merchant_id)
            )
        ).delete(synchronize_session=False)
        db.query(Transaction).filter(Transaction.merchant_id == merchant_id).delete(synchronize_session=False)
        db.query(Customer).filter(Customer.merchant_id == merchant_id).delete(synchronize_session=False)
        db.query(Product).filter(Product.merchant_id == merchant_id).delete(synchronize_session=False)
        db.query(Expense).filter(Expense.merchant_id == merchant_id).delete(synchronize_session=False)
        db.query(Recommendation).filter(Recommendation.merchant_id == merchant_id).delete(synchronize_session=False)
        db.commit()

        # Products catalog
        products_data = [
            ("Amul Taaza Milk 500ml", "Dairy", 24.0, 27.0, 40, 25),
            ("Amul Gold Milk 500ml", "Dairy", 30.0, 33.0, 3, 25),
            ("Modern White Bread 400g", "Bakery", 28.0, 35.0, 30, 20),
            ("Britannia Brown Bread", "Bakery", 40.0, 50.0, 22, 15),
            ("Amul Butter 100g", "Dairy", 48.0, 56.0, 25, 15),
            ("Mother Dairy Dahi 400g", "Dairy", 35.0, 42.0, 20, 15),
            ("Paneer Fresh 200g", "Dairy", 70.0, 90.0, 18, 12),
            ("Nandini Ghee 500ml", "Dairy", 280.0, 320.0, 15, 8),
            ("Aashirvaad Shudh Chakki Atta 5kg", "Staples", 210.0, 255.0, 35, 15),
            ("Fortune Sunlite Oil 1L", "Staples", 125.0, 150.0, 40, 20),
            ("India Gate Basmati Rice 1kg", "Staples", 95.0, 125.0, 30, 15),
            ("Tata Sampann Toor Dal 1kg", "Staples", 145.0, 175.0, 28, 15),
            ("Tata Salt 1kg", "Staples", 22.0, 28.0, 50, 20),
            ("Madhur Pure Sugar 1kg", "Staples", 42.0, 50.0, 45, 20),
            ("Tata Tea Premium 250g", "Beverages", 120.0, 150.0, 5, 15),
            ("Taj Mahal Tea 250g", "Beverages", 175.0, 210.0, 18, 10),
            ("Bru Instant Coffee 50g", "Beverages", 85.0, 105.0, 22, 10),
            ("Everest Turmeric Powder 100g", "Spices", 28.0, 36.0, 35, 15),
            ("Everest Red Chilli Powder 100g", "Spices", 38.0, 48.0, 30, 15),
            ("Everest Coriander Powder 100g", "Spices", 32.0, 40.0, 25, 15),
            ("Thums Up 750ml", "Cold Drinks", 32.0, 40.0, 4, 20),
            ("Coca Cola 750ml", "Cold Drinks", 32.0, 40.0, 35, 20),
            ("Sprite 750ml", "Cold Drinks", 32.0, 40.0, 30, 20),
            ("Frooti Mango Drink 600ml", "Cold Drinks", 30.0, 38.0, 28, 15),
            ("Bisleri Mineral Water 1L", "Cold Drinks", 12.0, 20.0, 60, 25),
            ("Red Bull Energy Drink 250ml", "Cold Drinks", 105.0, 125.0, 24, 10),
            ("Maaza Mango Drink 600ml", "Cold Drinks", 32.0, 40.0, 26, 15),
            ("Lay's Magic Masala Chips 50g", "Snacks", 16.0, 20.0, 45, 25),
            ("Kurkure Masala Munch 85g", "Snacks", 16.0, 20.0, 50, 25),
            ("Haldiram Bhujia Sev 200g", "Snacks", 45.0, 58.0, 32, 15),
            ("Parle-G Biscuits 250g", "Snacks", 22.0, 28.0, 6, 30),
            ("Britannia Good Day Butter 120g", "Snacks", 25.0, 32.0, 40, 20),
            ("Cadbury Dairy Milk Silk 60g", "Snacks", 68.0, 80.0, 25, 12),
            ("Oreo Vanilla Creme 120g", "Snacks", 30.0, 38.0, 30, 15),
            ("Dettol Original Soap 75g", "Personal Care", 30.0, 38.0, 40, 15),
            ("Lifebuoy Total Soap 100g", "Personal Care", 28.0, 36.0, 35, 15),
            ("Colgate Strong Teeth 100g", "Personal Care", 52.0, 65.0, 30, 15),
            ("Surf Excel Quick Wash 1kg", "Home Care", 130.0, 158.0, 4, 12),
            ("Vim Dishwash Bar 300g", "Home Care", 20.0, 26.0, 45, 20),
            ("Harpic Toilet Cleaner 500ml", "Home Care", 75.0, 95.0, 25, 10),
        ]

        product_objs = []
        for name, cat, cp, sp, stock, reorder in products_data:
            p = Product(
                merchant_id=merchant_id,
                name=name,
                category=cat,
                cost_price=cp,
                sell_price=sp,
                stock_qty=stock,
                reorder_level=reorder,
            )
            db.add(p)
            product_objs.append(p)
        db.commit()

        prod_map = {p.name: p for p in product_objs}

        # Customers
        first_names = [
            "Ramesh", "Suresh", "Sunita", "Amit", "Pooja", "Rajesh", "Kavita", "Vikas",
            "Deepak", "Anita", "Manoj", "Sneha", "Rahul", "Priya", "Santosh", "Rekha",
            "Ashok", "Geeta", "Mahesh", "Sangeeta", "Ganesh", "Swati", "Dinesh", "Preeti",
            "Sanjay", "Neeta", "Kishore", "Anjali", "Sachin", "Meena", "Vijay", "Asha"
        ]
        last_names = [
            "Sharma", "Patel", "Verma", "Gupta", "Deshmukh", "Joshi", "Yadav", "Kulkarni",
            "Chavan", "Mehta", "Singh", "Shah", "Shinde", "Pawar", "Mishra", "Pandey"
        ]

        customer_objs = []
        now = datetime.utcnow()
        ninety_days_ago = now - timedelta(days=90)

        for i in range(150):
            fname = first_names[i % len(first_names)]
            lname = last_names[(i * 3 + 7) % len(last_names)]
            prefix = random.choice(["98", "97", "99", "93", "88", "77", "91"])
            suffix = f"{random.randint(10, 99)}"
            c = Customer(
                merchant_id=merchant_id,
                name=f"{fname} {lname}",
                phone_masked=f"{prefix}XXXXXX{suffix}",
                first_seen=ninety_days_ago + timedelta(days=random.randint(0, 75)),
            )
            db.add(c)
            customer_objs.append(c)
        db.commit()

        churn_customers = set(customer_objs[:20])
        regular_customers = customer_objs[20:]

        # Transactions
        today = now.date()
        tx_count = 0
        tx_item_count = 0

        for day_offset in range(89, -1, -1):
            current_date = today - timedelta(days=day_offset)
            is_weekend = current_date.weekday() in (5, 6)
            is_in_last_21_days = day_offset < 21

            base_txs = random.randint(28, 48)
            if is_weekend:
                base_txs = int(base_txs * 1.25)

            for _ in range(base_txs):
                if is_in_last_21_days:
                    cust = random.choice(regular_customers) if random.random() < 0.85 else None
                else:
                    if random.random() < 0.25:
                        cust = random.choice(list(churn_customers))
                    else:
                        cust = random.choice(regular_customers) if random.random() < 0.8 else None

                hour_choice = random.choices(
                    [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
                    weights=[12, 14, 11, 7, 5, 4, 3, 4, 6, 9, 15, 18, 14, 8],
                    k=1
                )[0]
                tx_ts = datetime(
                    current_date.year, current_date.month, current_date.day,
                    hour_choice, random.randint(0, 59), random.randint(0, 59)
                )
                pay_mode = random.choices(["UPI", "cash", "card"], weights=[75, 20, 5], k=1)[0]

                basket_items = []
                if random.random() < 0.45:
                    staple = random.choice(["Amul Taaza Milk 500ml", "Amul Gold Milk 500ml", "Modern White Bread 400g"])
                    basket_items.append((prod_map[staple], random.choices([1, 2, 3], weights=[70, 25, 5], k=1)[0]))

                snack_prob = 0.55 if is_weekend else 0.35
                if random.random() < snack_prob:
                    snack = random.choice([
                        "Thums Up 750ml", "Coca Cola 750ml", "Sprite 750ml",
                        "Lay's Magic Masala Chips 50g", "Kurkure Masala Munch 85g", "Haldiram Bhujia Sev 200g"
                    ])
                    basket_items.append((prod_map[snack], random.choices([1, 2, 3], weights=[60, 30, 10], k=1)[0]))

                for _ in range(random.choices([0, 1, 2], weights=[40, 45, 15], k=1)[0]):
                    rp = random.choice(product_objs)
                    if rp not in [i[0] for i in basket_items]:
                        basket_items.append((rp, 1))

                if not basket_items:
                    basket_items.append((random.choice(product_objs), 1))

                tx = Transaction(
                    merchant_id=merchant_id,
                    customer_id=cust.id if cust else None,
                    ts=tx_ts,
                    amount=round(sum(p.sell_price * q for p, q in basket_items), 2),
                    payment_mode=pay_mode,
                )
                db.add(tx)
                db.flush()
                tx_count += 1

                for prod, qty in basket_items:
                    db.add(TransactionItem(transaction_id=tx.id, product_id=prod.id, qty=qty, price=prod.sell_price))
                    tx_item_count += 1

        db.commit()

        # Expenses
        for m_offset in range(3):
            month_date = today - timedelta(days=m_offset * 30)
            for cat, day, amount in [
                ("Rent", 1, 12000.0),
                ("Salary", 5, 8000.0),
                ("Electricity", 10, round(2800.0 + random.uniform(-200, 300), 2)),
                ("Inventory", 14, round(15500.0 + random.uniform(-1000, 1500), 2)),
                ("Inventory", 28, round(14500.0 + random.uniform(-1000, 1500), 2)),
            ]:
                db.add(Expense(
                    merchant_id=merchant_id,
                    date=date(month_date.year, month_date.month, day),
                    category=cat,
                    amount=amount,
                ))
        db.commit()

        return {
            "merchant": merchant.name,
            "merchant_email": merchant.email,
            "products_count": len(product_objs),
            "customers_count": len(customer_objs),
            "transactions_count": tx_count,
            "items_count": tx_item_count,
            "churn_candidates_count": len(churn_customers),
        }
