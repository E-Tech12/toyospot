from pydantic import BaseModel


class DashboardOverview(BaseModel):
    revenue_today: int
    revenue_week: int
    revenue_month: int
    orders_today: int
    pending_orders: int
    delivered_orders: int
    low_stock_foods: int


class DailyOrdersPoint(BaseModel):
    date: str
    orders: int
    revenue: int


class BestSellerPoint(BaseModel):
    food_id: str
    name: str
    quantity_sold: int
    revenue: int


class InventoryUsagePoint(BaseModel):
    food_id: str
    name: str
    daily_quantity: int
    quantity_available: int
    units_sold_today: int
    usage_pct: float
    is_sold_out: bool
    is_low_stock: bool


class CustomerGrowthPoint(BaseModel):
    date: str
    new_customers: int
