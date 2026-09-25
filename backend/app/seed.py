"""Seeds the database with the same categories/foods used by the frontend's
mock data (src/mock/data.js), so once the frontend is wired to this API the
menu looks identical to what was demoed.

Run with:  python -m app.seed
"""

import os

from app.database import Base, SessionLocal, engine
from app.models import Category, Food, User, UserRole
from app.security import hash_password

CATEGORIES = [
    ("rice-dishes", "Rice Dishes", "\U0001F35A"),
    ("swallows", "Swallows", "\U0001F365"),
    ("soups", "Soups", "\U0001F372"),
    ("proteins", "Proteins", "\U0001F357"),
    ("drinks", "Drinks", "\U0001F964"),
    ("pastries", "Pastries", "\U0001F950"),
    ("combo-meals", "Combo Meals", "\U0001F371"),
]

# (slug, name, category_slug, price, daily_qty, qty_available, prep_min, featured, popular, image)
FOODS = [
    ("jollof-rice", "Jollof Rice", "rice-dishes", 3500, 60, 42, 20, True, True, "/images/jollof.jpg"),
    ("fried-rice", "Fried Rice", "rice-dishes", 3500, 50, 31, 20, True, True, "/images/friedrice.jpg"),
    ("ofada-rice-ayamase", "Ofada Rice & Ayamase", "rice-dishes", 4500, 30, 9, 25, True, False, "/images/ofada.jpg"),
    ("white-rice-stew", "White Rice & Stew", "rice-dishes", 3000, 40, 40, 15, False, False, "/images/whiterice.jpg"),
    ("eba", "Eba", "swallows", 1200, 60, 38, 10, False, True, "/images/eba.jpg"),
    ("amala", "Amala", "swallows", 1200, 50, 22, 10, False, True, "/images/amala.jpg"),
    ("pounded-yam", "Pounded Yam", "swallows", 1500, 40, 17, 15, True, True, "/images/pounded.jpg"),
    ("semovita", "Semovita", "swallows", 1200, 40, 40, 10, False, False, "/images/semo.jpg"),
    ("wheat-swallow", "Wheat Swallow", "swallows", 1300, 30, 12, 10, False, False, "/images/Wheat.jpg"),
    ("fufu", "Fufu", "swallows", 1300, 30, 0, 10, False, False, "/images/fufuu.jpg"),
    ("egusi-soup", "Egusi Soup", "soups", 2800, 40, 26, 15, True, True, "/images/Egusi.jpg"),
    ("efo-riro", "Efo Riro", "soups", 2800, 35, 14, 15, False, True, "/images/efo.jpg"),
    ("ewedu-soup", "Ewedu Soup", "soups", 1800, 35, 20, 12, False, False, "/images/ewedu.jpg"),
    ("okro-soup", "Okro Soup", "soups", 2500, 30, 5, 15, False, False, "/images/okro.jpg"),
    ("grilled-chicken", "Grilled Chicken", "proteins", 2500, 50, 33, 15, True, True, "/images/chicken.jpg"),
    ("full-chicken", "Whole Roast Chicken", "proteins", 9000, 15, 4, 35, False, False, "/images/fullchicken.jpg"),
    ("assorted-meat", "Assorted Meat", "proteins", 2000, 50, 29, 10, False, False, "/images/meat.jpg"),
    ("moin-moin", "Moin Moin", "proteins", 1000, 40, 40, 10, False, True, "/images/moinmoin.jpg"),
    ("pomo", "Pomo", "proteins", 1000, 30, 18, 10, False, False, "/images/pomo.jpg"),
    ("coca-cola", "Coca-Cola (50cl)", "drinks", 600, 100, 80, 1, False, True, "/images/coke.jpg"),
    ("fanta", "Fanta (50cl)", "drinks", 600, 80, 60, 1, False, False, "/images/fanta.jpg"),
    ("pepsi", "Pepsi (50cl)", "drinks", 600, 80, 55, 1, False, False, "/images/pepsi.jpg"),
    ("malt", "Malt (33cl)", "drinks", 700, 60, 40, 1, False, False, "/images/malt.jpg"),
    ("sobo-drink", "Zobo (50cl)", "drinks", 800, 40, 21, 1, True, True, "/images/sobo.jpg"),
    ("vitamilk", "Vitamilk", "drinks", 700, 40, 40, 1, False, False, "/images/vitamilk.jpg"),
    ("vital-water", "Vital Water (75cl)", "drinks", 400, 100, 90, 1, False, False, "/images/vital.jpg"),
    ("meat-pie", "Meat Pie", "pastries", 800, 60, 44, 5, False, True, "/images/pie.jpg"),
    ("doughnuts", "Doughnuts", "pastries", 500, 60, 12, 5, False, False, "/images/Doughnuts.jpg"),
    ("croissant", "Croissant", "pastries", 900, 40, 25, 5, False, False, "/images/croissants.jpg"),
    ("egg-roll", "Egg Roll", "pastries", 600, 50, 30, 5, False, False, "/images/eggroll.jpg"),
    ("shawarma-combo", "Chicken Shawarma", "combo-meals", 3200, 40, 27, 15, True, True, "/images/shawarma.jpg"),
    ("burger-combo", "Toyo Beef Burger", "combo-meals", 3800, 30, 16, 18, False, False, "/images/burger.jpg"),
    ("pizza-combo", "Personal Pizza", "combo-meals", 4500, 20, 8, 20, False, False, "/images/pizz.jpg"),
    ("pasta-combo", "Jollof Pasta & Chicken", "combo-meals", 3800, 30, 19, 20, False, False, "/images/pasta.jpg"),
]

DESCRIPTIONS = {
    "jollof-rice": "Smoky party-style jollof rice, slow-cooked in a rich pepper and tomato base.",
    "fried-rice": "Fried rice loaded with sweetcorn, carrots, green beans and liver.",
    "ofada-rice-ayamase": "Local ofada rice with green pepper ayamase sauce and assorted meat.",
    "white-rice-stew": "Fluffy white rice with a rich tomato and pepper stew.",
    "eba": "Smooth garri swallow, made fresh to order.",
    "amala": "Soft yam-flour swallow with the deep, dark colour it should have.",
    "pounded-yam": "Hand-pounded texture without the hand-pounding wait.",
    "semovita": "Light semovita swallow, smooth and easy to mould.",
    "wheat-swallow": "A lighter, fibre-rich swallow alternative.",
    "fufu": "Fermented cassava swallow with its signature tang.",
    "egusi-soup": "Ground melon seed soup with spinach and assorted meat.",
    "efo-riro": "Vegetable soup cooked in a rich palm-oil pepper base.",
    "ewedu-soup": "Silky jute-leaf soup, the classic partner to amala and gbegiri.",
    "okro-soup": "Draw soup made fresh with okra, seafood and assorted meat.",
    "grilled-chicken": "Marinated and chargrilled chicken, smoky on the outside, juicy inside.",
    "full-chicken": "A whole roast chicken, great for sharing or a combo order.",
    "assorted-meat": "A mix of shaki, beef and cow leg simmered in pepper sauce.",
    "moin-moin": "Steamed bean pudding with egg and a hint of pepper.",
    "pomo": "Well-seasoned cow skin, cooked soft and spicy.",
    "coca-cola": "Chilled and ready.",
    "fanta": "Chilled and ready.",
    "pepsi": "Chilled and ready.",
    "malt": "Chilled malt drink.",
    "sobo-drink": "House-made hibiscus zobo, lightly spiced.",
    "vitamilk": "Chilled soy milk drink.",
    "vital-water": "Chilled table water.",
    "meat-pie": "Flaky pastry filled with seasoned minced meat and potato.",
    "doughnuts": "Soft, lightly sugared doughnuts.",
    "croissant": "Buttery, flaky croissant.",
    "egg-roll": "A boiled egg wrapped in soft, lightly sweet dough.",
    "shawarma-combo": "Grilled chicken shawarma wrapped with veggies and sauce.",
    "burger-combo": "Grilled beef patty, cheese and house sauce in a toasted bun.",
    "pizza-combo": "A personal-size pizza, baked fresh to order.",
    "pasta-combo": "Smoky jollof-style pasta with grilled chicken.",
}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        category_by_slug = {}
        for slug, name, icon in CATEGORIES:
            existing = db.query(Category).filter(Category.slug == slug).first()
            if existing:
                category_by_slug[slug] = existing
                continue
            category = Category(slug=slug, name=name, icon=icon, sort_order=len(category_by_slug))
            db.add(category)
            db.flush()
            category_by_slug[slug] = category

        created = 0
        for (
            slug,
            name,
            cat_slug,
            price,
            daily_qty,
            qty_available,
            prep_min,
            featured,
            popular,
            image,
        ) in FOODS:
            if db.query(Food).filter(Food.slug == slug).first():
                continue
            food = Food(
                slug=slug,
                name=name,
                description=DESCRIPTIONS.get(slug, ""),
                category_id=category_by_slug[cat_slug].id,
                price=price,
                daily_quantity=daily_qty,
                quantity_available=qty_available,
                prep_time_minutes=prep_min,
                is_featured=featured,
                is_popular=popular,
                image_url=image,
            )
            db.add(food)
            created += 1

        admin_email = os.environ.get("SEED_ADMIN_EMAIL", "admin@toyospot.ng")
        if not db.query(User).filter(User.email == admin_email).first():
            db.add(
                User(
                    first_name="Toyo",
                    last_name="Admin",
                    email=admin_email,
                    hashed_password=hash_password(os.environ.get("SEED_ADMIN_PASSWORD", "change-me-now")),
                    role=UserRole.admin,
                    is_verified=True,
                )
            )
            print(f"Created admin account: {admin_email} (set SEED_ADMIN_PASSWORD before running in production)")

        db.commit()
        print(f"Seeded {len(category_by_slug)} categories and {created} foods.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
