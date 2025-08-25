# 🎵 DJ Pro Studio - Online Music Mixing Platform - Portfolio 2025

### 📦 **Build and Test Coverage**
[![Version](https://img.shields.io/badge/version-1.0.0-brightgreen?style=for-the-badge&logo=git)](https://github.com/batrivieredev/DJ_PRO_STUDIO/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![CI Build](https://github.com/batrivieredev/DJ_PRO_STUDIO/actions/workflows/ci.yml/badge.svg)](https://github.com/batrivieredev/DJ_PRO_STUDIO/actions)
[![Deploy to Production](https://img.shields.io/badge/Deploy-Production-black)](https://mixer.fusikabdj.fr)

### 📊 **Project Statistics**
![GitHub Repo stars](https://img.shields.io/github/stars/batrivieredev/DJ_PRO_STUDIO?style=social)
![GitHub forks](https://img.shields.io/github/forks/batrivieredev/DJ_PRO_STUDIO?style=social)
[![GitHub Issues](https://img.shields.io/badge/Support-Issues-red?style=for-the-badge&logo=github)](https://github.com/batrivieredev/DJ_PRO_STUDIO/issues)
![GitHub last commit](https://img.shields.io/github/last-commit/batrivieredev/DJ_PRO_STUDIO?style=for-the-badge&color=blue)

### 🔗 **Important Links**
[![Landing Page](https://img.shields.io/badge/Landing_Page-DJ_Pro_Studio-blue?style=for-the-badge&logo=githubpages)](https://mixer.fusikabdj.fr)
[![Swagger Docs](https://img.shields.io/badge/Swagger-Docs-3cb371?style=for-the-badge&logo=swagger)](http://localhost:8082/swagger-ui/index.html)
[![Frontend](https://img.shields.io/badge/Frontend-127.0.0.1:5500-blue?style=for-the-badge&logo=googlechrome)](http://127.0.0.1:5500/)
[![Project Board](https://img.shields.io/badge/Project-Board-orange?style=for-the-badge&logo=trello)](https://github.com/batrivieredev/DJ_PRO_STUDIO/projects)
[![Discussions](https://img.shields.io/badge/GitHub-Discussions-blueviolet?style=for-the-badge&logo=github)](https://github.com/batrivieredev/DJ_PRO_STUDIO/discussions)
[![📜 Changelog](https://img.shields.io/badge/Changelog-View-blue?style=for-the-badge)](CHANGELOG.md)
[![🛠 Contributing](https://img.shields.io/badge/Contributing-Guide-orange?style=for-the-badge)](CONTRIBUTING.md)
[![📑 Security](https://img.shields.io/badge/Security-Policy-red?style=for-the-badge)](SECURITY.md)
[![🤝 Code of Conduct](https://img.shields.io/badge/Code%20of%20Conduct-Active-blueviolet?style=for-the-badge)](CODE_OF_CONDUCT.md)

[![🇬🇧 English Version](https://img.shields.io/badge/Docs-English-blue?style=for-the-badge&logo=readthedocs)](#english-version)
[![🇫🇷 Version Française](https://img.shields.io/badge/Docs-Français-red?style=for-the-badge&logo=readthedocs)](#version-française)

# English Version

# 🎵 DJ Pro Studio

## 📌 Table of Contents
1. [📌 Project Description](#-project-description)
2. [🏗️ Project Architecture](#-project-architecture)
3. [🚀 Key Features](#-key-features)
4. [🏗️ Installation & Configuration](#-installation--configuration)
5. [🔗 API Endpoints](#-api-endpoints)
6. [📡 Deployment](#-deployment)
7. [🚀 Roadmap & Future Improvements](#-roadmap--future-improvements)
8. [📜 License](#-license)
9. [👥 Authors](#-authors)

## 📌 Project Description

DJ Pro Studio is an innovative web application that allows users to mix music directly in their browser. The project includes a secure backend API with JWT authentication, user management system, and dynamic playlist handling.

## 🏗️ Project Architecture

The application follows a **Full-Stack** architecture:

- **Frontend**: Interactive web interface using HTML5, CSS3, and JavaScript with Web Audio API
- **Backend**: Python Flask REST API with JWT authentication
- **Database**: PostgreSQL for production, SQLite for development
- **Real-time Processing**: Web Audio API for audio manipulation

## 🚀 Key Features

- ✔️ **Browser-based mixing** with professional DJ controls
- ✔️ **Real-time audio processing** using Web Audio API
- ✔️ **User management** with secure authentication
- ✔️ **Playlist organization** and track management
- ✔️ **Responsive design** for all devices
- ✔️ **BPM detection** and beat synchronization
- ✔️ **Secure API** with JWT authentication

## 🏗️ Installation & Configuration

### Development Environment (SQLite)

1. **Prerequisites**
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
python -m pip install flask flask-sqlalchemy flask-jwt-extended python-dotenv
```

2. **Environment Configuration**
Create a `.env` file in the project root:
```env
FLASK_APP=app.py
FLASK_ENV=development
DATABASE_URL=sqlite:///dev.db
JWT_SECRET_KEY=your-secret-key
```

3. **Initialize SQLite Database**
```bash
# Create database and tables
flask db init
flask db migrate
flask db upgrade

# Seed initial data (if needed)
python scripts/seed_db.py
```

4. **Run Development Server**
```bash
flask run --port 5000
```

### Production Environment (PostgreSQL)

1. **Prerequisites**
```bash
# Install PostgreSQL dependencies
python -m pip install psycopg2-binary

# Install all requirements
python -m pip install -r requirements.txt
```

2. **PostgreSQL Setup**
```bash
# Create database
sudo -u postgres psql
postgres=# CREATE DATABASE djprostudio;
postgres=# CREATE USER djuser WITH PASSWORD 'yourpassword';
postgres=# GRANT ALL PRIVILEGES ON DATABASE djprostudio TO djuser;
```

3. **Environment Configuration**
Create a `.env.production` file:
```env
FLASK_APP=app.py
FLASK_ENV=production
DATABASE_URL=postgresql://djuser:yourpassword@localhost:5432/djprostudio
JWT_SECRET_KEY=your-production-secret-key
```

4. **Initialize PostgreSQL Database**
```bash
# Set production environment
export FLASK_ENV=production

# Run migrations
flask db init
flask db migrate
flask db upgrade
```

5. **Run Production Server**
```bash
# Using Gunicorn
gunicorn --bind 0.0.0.0:8000 wsgi:app
```

### Project Structure
```
djprostudio/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   └── services/
├── migrations/
├── tests/
├── .env
├── .env.production
├── config.py
├── requirements.txt
└── wsgi.py
```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User authentication |
| GET | `/api/tracks` | List available tracks |
| POST | `/api/playlists` | Create playlist |
| GET | `/api/mixer` | Access mixer interface |

## 🚀 Roadmap & Future Improvements

- ✔️ **Mobile application development**
- ✔️ **Advanced audio effects**
- ✔️ **Collaborative mixing features**
- ✔️ **Cloud synchronization**

## 📜 License
This project is under **MIT License** - See [LICENSE](LICENSE) for details.

## 👥 Authors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/batrivieredev">
        <img src="https://github.com/batrivieredev.png" width="100px;" alt=""/><br />
        <sub><b>Baptiste Rivière</b></sub>
      </a>
      <br />
      🚀 Creator & Lead Developer
      <br />
      <a href="mailto:baptiste.rivierefr@gmail.com">baptiste.rivierefr@gmail.com</a>
    </td>
  </tr>
</table>

# Version Française

# 🎵 DJ Pro Studio

## 📌 Table des Matières
1. [📌 Description du Projet](#-description-du-projet)
2. [🏗️ Architecture du Projet](#-architecture-du-projet)
3. [🚀 Fonctionnalités Principales](#-fonctionnalités-principales)
4. [🏗️ Installation & Configuration](#-installation--configuration)
5. [🔗 API Endpoints](#-api-endpoints)
6. [📡 Déploiement](#-déploiement)
7. [🚀 Perspectives d'Évolution](#-perspectives-dévolution)
7. [📜 Licence](#-licence)
8. [👥 Auteurs](#-auteurs)

## 📌 Description du Projet

DJ Pro Studio est une application web innovante permettant de mixer de la musique directement depuis le navigateur. Le projet inclut une API backend sécurisée avec authentification JWT, gestion des utilisateurs et gestion dynamique des playlists.

## 🏗️ Architecture du Projet

L'application suit une architecture **Full-Stack** :

- **Frontend** : Interface web interactive utilisant HTML5, CSS3 et JavaScript avec Web Audio API
- **Backend** : API REST Python Flask avec authentification JWT
- **Base de données** : PostgreSQL en production, SQLite en développement
- **Traitement temps réel** : Web Audio API pour la manipulation audio

## 🚀 Fonctionnalités Principales

- ✔️ **Mixage dans le navigateur** avec contrôles DJ professionnels
- ✔️ **Traitement audio temps réel** via Web Audio API
- ✔️ **Gestion des utilisateurs** avec authentification sécurisée
- ✔️ **Organisation des playlists** et gestion des pistes
- ✔️ **Design responsive** pour tous les appareils
- ✔️ **Détection BPM** et synchronisation des beats
- ✔️ **API sécurisée** avec authentification JWT

## 🏗️ Installation & Configuration

### Environnement de Développement (SQLite)

1. **Prérequis**
```bash
# Créer et activer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Installer les dépendances
python -m pip install flask flask-sqlalchemy flask-jwt-extended python-dotenv
```

2. **Configuration de l'Environnement**
Créer un fichier `.env` à la racine du projet :
```env
FLASK_APP=app.py
FLASK_ENV=development
DATABASE_URL=sqlite:///dev.db
JWT_SECRET_KEY=votre-clé-secrète
```

3. **Initialisation de la Base SQLite**
```bash
# Créer la base de données et les tables
flask db init
flask db migrate
flask db upgrade

# Ajouter les données initiales (si nécessaire)
python scripts/seed_db.py
```

4. **Lancer le Serveur de Développement**
```bash
flask run --port 5000
```

### Environnement de Production (PostgreSQL)

1. **Prérequis**
```bash
# Installer les dépendances PostgreSQL
python -m pip install psycopg2-binary

# Installer toutes les dépendances
python -m pip install -r requirements.txt
```

2. **Configuration PostgreSQL**
```bash
# Créer la base de données
sudo -u postgres psql
postgres=# CREATE DATABASE djprostudio;
postgres=# CREATE USER djuser WITH PASSWORD 'votremotdepasse';
postgres=# GRANT ALL PRIVILEGES ON DATABASE djprostudio TO djuser;
```

3. **Configuration de l'Environnement**
Créer un fichier `.env.production` :
```env
FLASK_APP=app.py
FLASK_ENV=production
DATABASE_URL=postgresql://djuser:votremotdepasse@localhost:5432/djprostudio
JWT_SECRET_KEY=votre-clé-secrète-production
```

4. **Initialisation de la Base PostgreSQL**
```bash
# Définir l'environnement de production
export FLASK_ENV=production

# Exécuter les migrations
flask db init
flask db migrate
flask db upgrade
```

5. **Lancer le Serveur de Production**
```bash
# Utiliser Gunicorn
gunicorn --bind 0.0.0.0:8000 wsgi:app
```

### Structure du Projet
```
djprostudio/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   └── services/
├── migrations/
├── tests/
├── .env
├── .env.production
├── config.py
├── requirements.txt
└── wsgi.py
```

## 🔗 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Authentification utilisateur |
| GET | `/api/tracks` | Liste des pistes disponibles |
| POST | `/api/playlists` | Création de playlist |
| GET | `/api/mixer` | Accès à l'interface de mixage |

## 📡 Déploiement

### Étapes de Déploiement en Production

1. **Configuration du Serveur**
```bash
# Installer les paquets nécessaires
sudo apt-get update
sudo apt-get install python3-pip python3-venv postgresql nginx
```

2. **Cloner et Configurer**
```bash
git clone https://github.com/votreutilisateur/djprostudio.git
cd djprostudio
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Configurer Nginx**
```nginx
server {
    listen 80;
    server_name votredomaine.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **Configurer le Service Systemd**
Créer `/etc/systemd/system/djprostudio.service` :
```ini
[Unit]
Description=DJ Pro Studio
After=network.target

[Service]
User=votreutilisateur
WorkingDirectory=/chemin/vers/djprostudio
Environment="PATH=/chemin/vers/djprostudio/venv/bin"
ExecStart=/chemin/vers/djprostudio/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:8000 wsgi:app

[Install]
WantedBy=multi-user.target
```

5. **Démarrer les Services**
```bash
sudo systemctl start postgresql
sudo systemctl start nginx
sudo systemctl start djprostudio
sudo systemctl enable djprostudio
```

Cette configuration assure un accès sécurisé et performant pour tous les utilisateurs.

## 🚀 Perspectives d'Évolution

- ✔️ **Développement application mobile**
- ✔️ **Effets audio avancés**
- ✔️ **Fonctionnalités de mixage collaboratif**
- ✔️ **Synchronisation cloud**

## 📜 Licence
Projet sous licence **MIT** - Voir [LICENSE](LICENSE) pour plus de détails.

## 👥 Auteurs

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/batrivieredev">
        <img src="https://github.com/batrivieredev.png" width="100px;" alt=""/><br />
        <sub><b>Baptiste Rivière</b></sub>
      </a>
      <br />
      🚀 Créateur & Développeur Principal
      <br />
      <a href="mailto:baptiste.rivierefr@gmail.com">baptiste.rivierefr@gmail.com</a>
    </td>
  </tr>
</table>

```mermaid
flowchart TD
    A[User] -->|Interacts| B[Frontend]
    B -->|Sends API Request| C[Backend]
    C -->|Validates Token| D[Authentication]
    D -->|Token Verified| C
    C -->|Processes Audio| E[Web Audio API]
    E -->|Returns Audio| C
    C -->|Stores Data| F[Database]
    F -->|Returns Data| C
    C -->|Sends Response| B
    B -->|Updates UI| A
