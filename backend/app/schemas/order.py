from datetime import datetime

from pydantic import BaseModel, Field


class OrderItemIn(BaseModel):
    food_id: str
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    items: list[OrderItemIn]
    full_name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=1, max_length=30)
    address_line: str = Field(min_length=1, max_length=255)
    notes: str = ""
    payment_method: str = "on_delivery"  # "online" | "on_delivery"


class OrderItemOut(BaseModel):
    food_id: str
    name: str
    price: int
    image_url: str
    quantity: int

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: str
    order_number: str
    status: str
    payment_status: str
    payment_method: str
    full_name: str
    phone: str
    address_line: str
    notes: str
    item_total: int
    delivery_fee: int
    grand_total: int
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class OrderSummaryOut(BaseModel):
    id: str
    order_number: str
    status: str
    payment_status: str
    grand_total: int
    created_at: datetime
    item_count: int
    first_item_name: str
    first_item_image: str

    model_config = {"from_attributes": True}


class UpdateOrderStatusRequest(BaseModel):
    status: str


class UpdatePaymentStatusRequest(BaseModel):
    payment_status: str
