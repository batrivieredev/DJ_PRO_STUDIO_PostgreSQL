"""
Script de démarrage de l'application.
À lancer uniquement après avoir exécuté initialization.py
"""

from app import create_app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5012)
