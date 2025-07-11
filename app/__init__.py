from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)

    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-replace-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db?timeout=30'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024  # 64MB max file size
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'connect_args': {
            'check_same_thread': False,
            'timeout': 30
        },
        'pool_pre_ping': True,
        'pool_recycle': 300
    }

    # Ensure upload folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'

    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register blueprints
    from .routes import main as main_blueprint
    app.register_blueprint(main_blueprint)

    from .routes import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)

    from .routes import api as api_blueprint
    app.register_blueprint(api_blueprint)

    from .routes import admin as admin_blueprint
    app.register_blueprint(admin_blueprint)

    # Create database tables
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Error creating database tables: {e}")

    return app

# Error handlers
def init_error_handlers(app):
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not Found', 'message': str(error)}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal Server Error', 'message': str(error)}, 500

    @app.errorhandler(403)
    def forbidden_error(error):
        return {'error': 'Forbidden', 'message': str(error)}, 403

    @app.errorhandler(400)
    def bad_request_error(error):
        return {'error': 'Bad Request', 'message': str(error)}, 400
