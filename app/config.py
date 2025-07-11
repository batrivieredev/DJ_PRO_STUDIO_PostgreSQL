import os
from pathlib import Path

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    # Configuration de la base de données
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configuration des uploads
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB max

    # Sécurité
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vous-devriez-changer-cette-cle'

    # Configuration par défaut
    LAST_SCAN_TIME = 0

    @staticmethod
    def init_app(app):
        # Crée le dossier d'upload s'il n'existe pas
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
