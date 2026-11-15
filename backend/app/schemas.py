from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    merchant: "MerchantOut"

class TokenData(BaseModel):
    email: Optional[str] = None
    merchant_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class MerchantOut(BaseModel):
    id: int
    name: str
    email: str
    category: str
    language: str
    plan: str
    model_config = ConfigDict(from_attributes=True)

# New auth schemas
class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    language: str = "en"
    plan: str = "free"
    category: str = "general"
    onboarding_complete: bool = False
    organization_id: Optional[int] = None

# Dashboard & Analytics Schemas
class PaymentSplit(BaseModel):
    mode: str
    amount: float
    percentage: float
    count: int

class TopProduct(BaseModel):
    id: int
    name: str
    category: str
    qty_sold: int
    revenue: float

class DashboardSummary(BaseModel):
    today_sales: float
    vs_yesterday_pct: float
    seven_day_trend: List[Dict[str, Any]]
    top_5_products: List[TopProduct]
    estimated_profit: float
    margin_pct: float
    payment_mode_split: List[PaymentSplit]
    active_customers_today: int
    low_stock_count: int

# Sales Schemas
class SalesRangeResponse(BaseModel):
    range: str
    total_sales: float
    total_transactions: int
    average_order_value: float
    sales_series: List[Dict[str, Any]]
    category_breakdown: List[Dict[str, Any]]
    peak_hours: List[Dict[str, Any]]
    best_day: Dict[str, Any]
    worst_day: Dict[str, Any]

# Inventory Schemas
class ProductItem(BaseModel):
    id: int
    name: str
    category: str
    cost_price: float
    sell_price: float
    stock_qty: int
    reorder_level: int
    status: str
    days_of_stock_left: float
    model_config = ConfigDict(from_attributes=True)

class InventoryForecastItem(BaseModel):
    product_id: int
    product_name: str
    category: str
    current_stock: int
    predicted_demand_7d: float
    daily_forecast: List[Dict[str, Any]]
    weekend_spike_flag: bool
    weekend_uplift_pct: float
    suggested_reorder_qty: int
    urgency: str

# Supplier Order Schemas
class SupplierOrderCreate(BaseModel):
    product_id: int
    quantity: int
    supplier_name: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None

class SupplierOrderUpdate(BaseModel):
    order_status: Optional[str] = None   # pending, confirmed, delivered, cancelled
    supplier_name: Optional[str] = None
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None

class SupplierOrderOut(BaseModel):
    id: int
    merchant_id: int
    product_id: int
    product_name: Optional[str] = None
    supplier_name: Optional[str] = None
    quantity: int
    order_status: str
    created_at: datetime
    expected_delivery_date: Optional[date] = None
    notes: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

# Customers Schemas
class CustomerItem(BaseModel):
    id: int
    name: str
    phone_masked: str
    first_seen: datetime
    recency_days: int
    visit_count: int
    total_spend: float
    avg_bill: float
    segment: str
    churn_risk: bool
    reason: str
    model_config = ConfigDict(from_attributes=True)

class SegmentCount(BaseModel):
    segment: str
    count: int
    percentage: float
    description: str

class CustomerSegmentsResponse(BaseModel):
    summary: List[SegmentCount]
    customers: List[CustomerItem]

# Marketing Schemas
class MarketingGenerateRequest(BaseModel):
    segment: str
    goal: str
    language: str = "hi"
    product: Optional[str] = None
    discount_pct: Optional[int] = 10

class MarketingVariant(BaseModel):
    id: int
    text: str
    character_count: int
    suggested_channel: str

class MarketingGenerateResponse(BaseModel):
    variants: List[MarketingVariant]
    language: str
    segment: str
    goal: str

# Finance Schemas
class ExpenseItem(BaseModel):
    id: int
    date: date
    category: str
    amount: float
    model_config = ConfigDict(from_attributes=True)

class FinanceSummaryResponse(BaseModel):
    range: str
    revenue: float
    cogs: float
    gross_profit: float
    expenses_total: float
    expenses_by_category: Dict[str, float]
    net_profit: float
    net_margin_pct: float
    cash_flow_series: List[Dict[str, Any]]

class FinanceExplainRequest(BaseModel):
    range: str = "month"
    language: str = "hi"

class FinanceExplainResponse(BaseModel):
    summary_text: str
    sentences: List[str]
    language: str
    key_metrics: Dict[str, Any]

# Recommendation Schemas
class RecommendationCard(BaseModel):
    id: int
    title: str
    why: str
    numbers: Dict[str, Any]
    suggested_action: str
    button_target: str
    button_text: str
    type: str
    status: str

# Copilot Schemas
class CopilotMessage(BaseModel):
    role: str
    content: str
    ts: Optional[datetime] = None

class CopilotChatRequest(BaseModel):
    message: str
    language: str = "hi"

class CopilotChatResponse(BaseModel):
    reply: str
    language: str
    tools_used: List[str]
    tool_results: Dict[str, Any]

# CSV Upload Schemas
class CsvUploadResponse(BaseModel):
    success: bool
    rows_processed: int
    transactions_added: int
    items_added: int
    skipped_duplicates: int = 0
    message: str
