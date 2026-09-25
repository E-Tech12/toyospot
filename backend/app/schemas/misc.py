from datetime import datetime

from pydantic import BaseModel, Field


class OrderMessageIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class OrderMessageOut(BaseModel):
    id: str
    sender: str
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AddressIn(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    line1: str = Field(min_length=1, max_length=255)
    city: str = ""
    phone: str = ""
    is_default: bool = False


class AddressOut(AddressIn):
    id: str

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: str
    type: str
    title: str
    body: str
    order_id: str | None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PushSubscribeRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


class AnnouncementIn(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    body: str = Field(min_length=1)
