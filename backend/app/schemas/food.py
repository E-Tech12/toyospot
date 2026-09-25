from pydantic import BaseModel, Field


class CategoryOut(BaseModel):
    id: str
    name: str
    slug: str
    icon: str

    model_config = {"from_attributes": True}


class FoodOut(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    category_slug: str
    price: int
    daily_quantity: int
    quantity_available: int
    prep_time_minutes: int
    is_featured: bool
    is_popular: bool
    image_url: str
    is_sold_out: bool
    is_low_stock: bool

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, food) -> "FoodOut":
        return cls(
            id=food.id,
            name=food.name,
            slug=food.slug,
            description=food.description,
            category_slug=food.category.slug,
            price=food.price,
            daily_quantity=food.daily_quantity,
            quantity_available=food.quantity_available,
            prep_time_minutes=food.prep_time_minutes,
            is_featured=food.is_featured,
            is_popular=food.is_popular,
            image_url=food.image_url,
            is_sold_out=food.is_sold_out,
            is_low_stock=food.is_low_stock,
        )


class FoodCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    slug: str = Field(min_length=1, max_length=160)
    description: str = ""
    category_id: str
    price: int = Field(gt=0)
    daily_quantity: int = Field(ge=0)
    quantity_available: int = Field(ge=0)
    prep_time_minutes: int = Field(ge=1, default=15)
    is_featured: bool = False
    is_popular: bool = False
    image_url: str = ""


class FoodUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: str | None = None
    price: int | None = Field(default=None, gt=0)
    daily_quantity: int | None = Field(default=None, ge=0)
    quantity_available: int | None = Field(default=None, ge=0)
    prep_time_minutes: int | None = None
    is_featured: bool | None = None
    is_popular: bool | None = None
    is_archived: bool | None = None
    image_url: str | None = None


class RestockRequest(BaseModel):
    quantity_available: int = Field(ge=0)
