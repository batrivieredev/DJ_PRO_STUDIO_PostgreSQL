import os
from app import create_app
from app.models import db, User, Track
from flask_login import current_user
from werkzeug.middleware.proxy_fix import ProxyFix
import socket

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('0.0.0.0', port))
            return False
        except socket.error:
            return True

def find_available_port(start_port=5000, max_port=5050):
    port = start_port
    while port <= max_port:
        if not is_port_in_use(port):
            return port
        port += 1
    raise RuntimeError(f"No available ports in range {start_port}-{max_port}")

app = create_app()
app.wsgi_app = ProxyFix(app.wsgi_app)

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return {
        'error': 'Not Found',
        'message': 'The requested resource was not found'
    }, 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return {
        'error': 'Internal Server Error',
        'message': 'An unexpected error occurred'
    }, 500

@app.errorhandler(403)
def forbidden_error(error):
    return {
        'error': 'Forbidden',
        'message': 'You do not have permission to access this resource'
    }, 403

# Context processors
@app.context_processor
def utility_processor():
    def format_timestamp(value, format='%Y-%m-%d %H:%M:%S'):
        if value is None:
            return ''
        return value.strftime(format)

    return dict(
        format_timestamp=format_timestamp,
        current_user=current_user
    )

# Shell context
@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'User': User,
        'Track': Track
    }

if __name__ == '__main__':
    if not os.path.exists('uploads'):
        os.makedirs('uploads')

    try:
        # Try to find an available port
        port = find_available_port()
        print(f"\nStarting server on port {port}")
        print(f"Access the application at http://localhost:{port}\n")

        app.run(
            host='127.0.0.1',  # Changed from 0.0.0.0 to 127.0.0.1 for security
            port=port,
            debug=True
        )
    except Exception as e:
        print(f"\nError starting server: {str(e)}")
        print("Please ensure no other instances of the application are running")
        print("You can use 'pkill -f \"python3 app.py\"' to stop all instances\n")
