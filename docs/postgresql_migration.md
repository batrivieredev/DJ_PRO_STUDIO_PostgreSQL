# Migration vers PostgreSQL

Ce document décrit la procédure de migration de la base de données SQLite vers PostgreSQL.

## Prérequis

1. PostgreSQL installé sur le système
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   ```

2. Python et les dépendances requises
   ```bash
   pip install -r requirements.txt
   ```

## Configuration de PostgreSQL

1. Créer une base de données et un utilisateur
   ```sql
   sudo -u postgres psql
   CREATE DATABASE project_test;
   CREATE USER project_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE project_test TO project_user;
   ```

2. Configuration des variables d'environnement
   Créer un fichier `.env` à la racine du projet avec les informations suivantes:
   ```
   DB_TYPE=postgresql
   DB_USER=project_user
   DB_PASSWORD=secure_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=project_test
   ```

## Migration des données

1. Sauvegarde de la base SQLite
   Le script de migration créera automatiquement une sauvegarde de la base SQLite avant la migration.

2. Exécution de la migration
   ```bash
   python migrate_to_postgres.py
   ```

   Le script effectue les opérations suivantes:
   - Sauvegarde des données SQLite au format JSON
   - Migration des données vers PostgreSQL
   - Vérification de l'intégrité des données

3. Vérification post-migration
   - Le script affiche des statistiques sur les données migrées
   - Une sauvegarde des données SQLite est conservée au format JSON

## Structure du projet

Les fichiers suivants ont été modifiés ou créés pour supporter PostgreSQL:

- `config.py`: Configuration de la connexion à la base de données
- `initialization.py`: Support de l'initialisation avec PostgreSQL
- `migrate_to_postgres.py`: Script de migration des données
- `.env`: Variables d'environnement pour la configuration

## Retour à SQLite

Si nécessaire, vous pouvez revenir à SQLite en modifiant la variable `DB_TYPE` dans le fichier `.env`:
```
DB_TYPE=sqlite
```

## Dépannage

1. Erreur de connexion à PostgreSQL
   - Vérifier que le service PostgreSQL est en cours d'exécution
   - Vérifier les informations de connexion dans le fichier `.env`
   - Vérifier les permissions de l'utilisateur PostgreSQL

2. Erreur pendant la migration
   - Vérifier que la base SQLite existe et est accessible
   - Vérifier l'espace disque disponible
   - Consulter les logs pour plus de détails

3. Problèmes de performance
   - Ajuster les paramètres de PostgreSQL dans postgresql.conf
   - Optimiser les index après la migration

## Maintenance

1. Sauvegarde de la base PostgreSQL
   ```bash
   pg_dump -U project_user project_test > backup.sql
   ```

2. Restauration d'une sauvegarde
   ```bash
   psql -U project_user project_test < backup.sql
   ```

3. Surveillance des performances
   - Utiliser les outils de monitoring PostgreSQL
   - Vérifier régulièrement la taille de la base
   - Optimiser les requêtes si nécessaire
