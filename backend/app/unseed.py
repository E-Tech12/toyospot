from app.database import SessionLocal
from app.models import Category, Food, User, OrderItem, OrderMessage
from app.seed import CATEGORIES, FOODS

def unseed():
    db = SessionLocal()
    try:
        food_slugs = [f[0] for f in FOODS]
        cat_slugs = [c[0] for c in CATEGORIES]
        admin_email = "admin@toyospot.ng"

        # 1. Find admin user first (before deleting anything)
        admin = db.query(User).filter(User.email == admin_email).first()

        # 2. Delete order_messages from the admin
        if admin:
            deleted_msgs = db.query(OrderMessage).filter(
                OrderMessage.sender_user_id == admin.id
            ).delete(synchronize_session=False)
            print(f"Deleted {deleted_msgs} order messages from admin.")

        # 3. Delete order_items referencing seeded foods
        food_ids = [row.id for row in db.query(Food.id).filter(Food.slug.in_(food_slugs)).all()]
        deleted_items = db.query(OrderItem).filter(
            OrderItem.food_id.in_(food_ids)
        ).delete(synchronize_session=False)
        print(f"Deleted {deleted_items} order items referencing seeded foods.")

        # 4. Delete foods
        deleted_foods = db.query(Food).filter(Food.slug.in_(food_slugs)).delete(synchronize_session=False)

        # 5. Delete categories
        deleted_cats = db.query(Category).filter(Category.slug.in_(cat_slugs)).delete(synchronize_session=False)

        # 6. Delete admin user
        deleted_admin = 0
        if admin:
            deleted_admin = db.query(User).filter(User.id == admin.id).delete(synchronize_session=False)

        db.commit()
        print(f"Deleted {deleted_foods} foods, {deleted_cats} categories, {deleted_admin} admin(s).")
    finally:
        db.close()

if __name__ == "__main__":
    unseed()