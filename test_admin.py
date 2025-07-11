from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash

def test_admin_user():
    app = create_app()

    with app.app_context():
        # Remove any existing admin user
        User.query.filter_by(username='admin').delete()
        db.session.commit()

        # Create admin user
        admin = User(
            username='admin',
            email='admin@example.com',
            is_admin=True,
            is_active=True,
            can_access_mixer=True
        )
        admin.set_password('admin')

        # Verify password hash is set
        print(f"Password hash: {admin.password_hash}")

        # Test password verification
        if admin.check_password('admin'):
            print("✅ Password verification successful")
        else:
            print("❌ Password verification failed")

        # Save to database
        db.session.add(admin)
        db.session.commit()

        # Verify admin exists in database
        saved_admin = User.query.filter_by(username='admin').first()
        if saved_admin and saved_admin.check_password('admin'):
            print("✅ Admin user saved and verified in database")
        else:
            print("❌ Failed to verify admin user in database")

if __name__ == '__main__':
    test_admin_user()
