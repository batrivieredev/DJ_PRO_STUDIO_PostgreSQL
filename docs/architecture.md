# Architecture du Projet

## Structure des dossiers

```
project_root/
│
├── app/                    # Application principale
│   ├── static/            # Fichiers statiques
│   │   ├── css/          # Styles CSS
│   │   ├── js/           # Scripts JavaScript
│   │   └── img/          # Images
│   │
│   ├── templates/         # Templates HTML
│   │   ├── admin/        # Pages d'administration
│   │   └── ...
│   │
│   ├── __init__.py       # Initialisation de l'app
│   ├── models.py         # Modèles de données
│   ├── routes.py         # Routes et vues
│   └── config.py         # Configuration
│
├── docs/                  # Documentation
├── tests/                # Tests unitaires et d'intégration
├── venv/                 # Environnement virtuel Python
├── initialization.py     # Script d'initialisation
├── run.py               # Script de démarrage
└── requirements.txt     # Dépendances Python
```

## Composants principaux

### Backend (Python/Flask)

1. **app/__init__.py**
   - Initialisation de l'application Flask
   - Configuration de la base de données
   - Enregistrement des blueprints

2. **app/models.py**
   - Modèles SQLAlchemy
   - Relations entre les tables
   - Méthodes des modèles

3. **app/routes.py**
   - Routes de l'API
   - Gestion des requêtes
   - Logique métier

4. **app/config.py**
   - Configuration de l'application
   - Variables d'environnement
   - Paramètres de sécurité

### Frontend (JavaScript)

1. **app/static/js/mixer.js**
   - Interface du mixer DJ
   - Contrôle audio
   - Gestion des platines

2. **app/static/js/audio-engine.js**
   - Moteur audio Web Audio API
   - Gestion des effets
   - Traitement du son

3. **app/static/js/track-library.js**
   - Gestion de la bibliothèque
   - Listes de lecture
   - Métadonnées des morceaux

### Templates (HTML)

1. **app/templates/mixer.html**
   - Interface principale du mixer
   - Contrôles DJ
   - Visualisations

2. **app/templates/admin/**
   - Interface d'administration
   - Gestion des utilisateurs
   - Configuration système

## Flux de données

1. **Upload de fichier**
```
Client -> POST /api/tracks -> Sauvegarde -> Analyse BPM -> Base de données
```

2. **Conversion audio**
```
Client -> POST /api/convert -> ffmpeg -> Fichier converti -> Client
```

3. **Lecture audio**
```
Client -> GET /api/tracks/<id> -> Fichier -> Web Audio API -> Sortie audio
```

## Technologies utilisées

- **Backend**
  - Flask (framework web)
  - SQLAlchemy (ORM)
  - FFmpeg (conversion audio)
  - Librosa (analyse BPM)

- **Frontend**
  - Web Audio API
  - JavaScript ES6+
  - HTML5/CSS3
  - WebSocket (temps réel)

- **Base de données**
  - SQLite (développement)
  - PostgreSQL (production)

- **Outils**
  - Git (versioning)
  - pytest (tests)
  - Flask-Login (authentification)
