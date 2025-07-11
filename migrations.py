"""
Script de migration de la base de données:
- Ajoute les colonnes de validation utilisateur
- Ajoute la colonne pour le thème
"""
from app import create_app, db
import sqlite3
from pathlib import Path

def upgrade_database():
    """Met à jour la structure de la base de données"""
    app = create_app()
    db_path = Path(app.root_path) / 'app.db'

    print("🔄 Migration de la base de données...")

    # Connexion directe à SQLite pour les migrations
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # Ajout des colonnes de validation
        print("➕ Ajout des colonnes de validation utilisateur...")
        migration_commands = [
            'ALTER TABLE users ADD COLUMN is_validated BOOLEAN DEFAULT 0',
            'ALTER TABLE users ADD COLUMN validated_at DATETIME',
            'ALTER TABLE users ADD COLUMN validated_by INTEGER REFERENCES users(id)',
            'ALTER TABLE users ADD COLUMN theme VARCHAR(10) DEFAULT "dark"'
        ]

        for command in migration_commands:
            try:
                cursor.execute(command)
                print(f"✓ {command}")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e):
                    print(f"ℹ️ Colonne déjà existante : {command}")
                else:
                    raise

        # Mise à jour des utilisateurs existants
        print("\n🔄 Mise à jour des utilisateurs existants...")
        cursor.execute('''
            UPDATE users
            SET is_validated = 1,
                validated_at = CURRENT_TIMESTAMP
            WHERE is_admin = 1
        ''')

        # Commit des changements
        conn.commit()
        print("\n✅ Migration terminée avec succès!")

    except Exception as e:
        conn.rollback()
        print(f"\n❌ Erreur lors de la migration: {str(e)}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    upgrade_database()
