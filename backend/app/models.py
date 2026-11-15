from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, ForeignKey,
    Text, Boolean, Numeric, UniqueConstraint, Index,
)
from sqlalchemy.orm import relationship
from .db import Base


# ---------------------------------------------------------------------------
# Auth & Identity
# ---------------------------------------------------------------------------

class User(Base):
    """Primary identity record — one per email address."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active | suspended | deleted
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    identities = relationship("AuthIdentity", back_populates="user", cascade="all, delete-orphan")
    magic_link_tokens = relationship("MagicLinkToken", back_populates="user", cascade="all, delete-orphan")
    passkey_credentials = relationship("PasskeyCredential", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    org_memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="actor", cascade="all, delete-orphan")

    # Legacy fields kept for backward compat with existing business modules
    # These are populated from the first org the user creates
    name = Column(String(100), nullable=True)
    category = Column(String(50), default="general")
    language = Column(String(10), default="en")
    plan = Column(String(20), default="free")


class AuthIdentity(Base):
    """One row per auth provider per user (google, magic_link, passkey)."""
    __tablename__ = "auth_identities"
    __table_args__ = (UniqueConstraint("provider", "provider_subject"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(30), nullable=False)          # google | magic_link | passkey
    provider_subject = Column(String(255), nullable=False) # Google sub / email / credential_id
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="identities")


class MagicLinkToken(Base):
    __tablename__ = "magic_link_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    consumed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="magic_link_tokens")


class PasskeyCredential(Base):
    __tablename__ = "passkey_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    credential_id = Column(String(512), unique=True, nullable=False, index=True)
    public_key = Column(Text, nullable=False)
    sign_counter = Column(Integer, default=0)
    device_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="passkey_credentials")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")


# ---------------------------------------------------------------------------
# Organisation & Onboarding
# ---------------------------------------------------------------------------

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    legal_name = Column(String(200), nullable=False)
    trading_name = Column(String(200), nullable=True)
    business_type = Column(String(50), nullable=True)  # sole_proprietorship | partnership | llp | pvt_ltd | pub_ltd | other
    category = Column(String(50), default="general")
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pin_code = Column(String(10), nullable=True)
    country = Column(String(50), default="India")
    business_email = Column(String(255), nullable=True)
    gstin = Column(String(20), nullable=True)
    pan = Column(String(20), nullable=True)
    cin = Column(String(30), nullable=True)
    website = Column(String(255), nullable=True)
    language = Column(String(10), default="en")
    currency = Column(String(5), default="INR")
    status = Column(String(20), default="onboarding")  # onboarding | active | suspended
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    onboarding = relationship("OnboardingProgress", back_populates="organization", uselist=False, cascade="all, delete-orphan")
    business_verifications = relationship("BusinessVerification", back_populates="organization", cascade="all, delete-orphan")
    bank_accounts = relationship("BankAccount", back_populates="organization", cascade="all, delete-orphan")
    financial_consents = relationship("FinancialConsent", back_populates="organization", cascade="all, delete-orphan")
    integrations = relationship("Integration", back_populates="organization", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="organization", cascade="all, delete-orphan")

    # Legacy fields for existing business modules
    name = Column(String(100), nullable=True)  # alias for trading_name
    plan = Column(String(20), default="free")


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("organization_id", "user_id"),)

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), default="owner")  # owner | admin | accountant | staff | read_only
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="members")
    user = relationship("User", back_populates="org_memberships")


class OnboardingProgress(Base):
    __tablename__ = "onboarding_progress"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), unique=True, nullable=False, index=True)
    current_step = Column(String(50), default="ACCOUNT_CREATED")
    completed_steps = Column(Text, default="[]")  # JSON list
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="onboarding")


# ---------------------------------------------------------------------------
# Business Verification (KYB)
# ---------------------------------------------------------------------------

class BusinessVerification(Base):
    __tablename__ = "business_verifications"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)          # gstin | pan | cin | manual
    verification_type = Column(String(50), nullable=False)
    provider_reference = Column(String(255), nullable=True)
    status = Column(String(30), default="NOT_STARTED")     # NOT_STARTED | PENDING | VERIFIED | FAILED | REQUIRES_REVIEW
    result = Column(Text, nullable=True)                   # JSON
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    organization = relationship("Organization", back_populates="business_verifications")


# ---------------------------------------------------------------------------
# Bank Account & Verification
# ---------------------------------------------------------------------------

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    bank_name = Column(String(100), nullable=True)
    encrypted_account_number = Column(Text, nullable=True)   # encrypted at rest
    masked_account_number = Column(String(30), nullable=True) # e.g. XXXX1234
    ifsc = Column(String(15), nullable=True)
    account_holder_name = Column(String(200), nullable=True)
    account_type = Column(String(20), nullable=True)          # savings | current
    verification_status = Column(String(30), default="NOT_STARTED")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="bank_accounts")
    verifications = relationship("BankVerification", back_populates="bank_account", cascade="all, delete-orphan")


class BankVerification(Base):
    __tablename__ = "bank_verifications"

    id = Column(Integer, primary_key=True, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)           # cashfree | manual
    provider_reference = Column(String(255), nullable=True)
    name_match_status = Column(String(30), nullable=True)   # matched | partial | mismatch
    status = Column(String(30), default="PENDING")
    result = Column(Text, nullable=True)                    # JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    bank_account = relationship("BankAccount", back_populates="verifications")


# ---------------------------------------------------------------------------
# Financial Consent (Account Aggregator)
# ---------------------------------------------------------------------------

class FinancialConsent(Base):
    __tablename__ = "financial_consents"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)
    consent_reference = Column(String(255), nullable=True)
    purpose = Column(String(255), nullable=True)
    data_range = Column(String(100), nullable=True)
    data_range_from = Column(Date, nullable=True)
    data_range_to = Column(Date, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    status = Column(String(30), default="NOT_CONNECTED")
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="financial_consents")


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True, index=True)
    provider_transaction_id = Column(String(255), nullable=True, index=True)
    transaction_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # CREDIT | DEBIT
    category = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization")
    bank_account = relationship("BankAccount")


class StatementImport(Base):
    __tablename__ = "statement_imports"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # csv | pdf
    status = Column(String(30), default="PROCESSED")  # PENDING | PROCESSED | FAILED
    transactions_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization")


class PasskeyChallenge(Base):
    __tablename__ = "passkey_challenges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    challenge = Column(String(255), unique=True, nullable=False, index=True)
    challenge_type = Column(String(20), default="login")  # register | login
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Integrations
# ---------------------------------------------------------------------------

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False)           # paytm | razorpay | etc.
    external_reference = Column(String(255), nullable=True)
    connection_status = Column(String(30), default="disconnected")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="integrations")


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String(50), nullable=True)
    event_metadata = Column(Text, nullable=True)  # JSON
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    actor = relationship("User", back_populates="audit_events")
    organization = relationship("Organization", back_populates="audit_events")


# ---------------------------------------------------------------------------
# Legacy models — preserved for existing business modules
# ---------------------------------------------------------------------------

class Merchant(Base):
    """Legacy model — kept for existing sales/inventory/finance modules.
    New auth uses User + Organization. This is populated via a compatibility
    shim when a user completes onboarding.
    """
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    category = Column(String(50), default="general")
    language = Column(String(10), default="en")
    plan = Column(String(20), default="free")
    email_verified = Column(String(1), default="0")
    # Link to new auth system
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)

    products = relationship("Product", back_populates="merchant", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="merchant", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="merchant", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="merchant", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="merchant", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="merchant", cascade="all, delete-orphan")
    supplier_orders = relationship("SupplierOrder", back_populates="merchant", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    cost_price = Column(Float, nullable=False)
    sell_price = Column(Float, nullable=False)
    stock_qty = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)

    merchant = relationship("Merchant", back_populates="products")
    transaction_items = relationship("TransactionItem", back_populates="product")
    supplier_orders = relationship("SupplierOrder", back_populates="product")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    phone_masked = Column(String(20), nullable=False)
    first_seen = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="customers")
    transactions = relationship("Transaction", back_populates="customer")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    ts = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String(20), nullable=False)

    merchant = relationship("Merchant", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")
    items = relationship("TransactionItem", back_populates="transaction", cascade="all, delete-orphan")


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    qty = Column(Integer, nullable=False, default=1)
    price = Column(Float, nullable=False)

    transaction = relationship("Transaction", back_populates="items")
    product = relationship("Product", back_populates="transaction_items")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    category = Column(String(50), nullable=False)
    amount = Column(Float, nullable=False)

    merchant = relationship("Merchant", back_populates="expenses")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    type = Column(String(50), nullable=False)
    text = Column(Text, nullable=False)
    status = Column(String(20), default="active")

    merchant = relationship("Merchant", back_populates="recommendations")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    ts = Column(DateTime, default=datetime.utcnow)

    merchant = relationship("Merchant", back_populates="chat_messages")


class SupplierOrder(Base):
    __tablename__ = "supplier_orders"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    supplier_name = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False)
    order_status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    expected_delivery_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    merchant = relationship("Merchant", back_populates="supplier_orders")
    product = relationship("Product", back_populates="supplier_orders")
