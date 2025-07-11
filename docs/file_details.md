# Détails des Fichiers du Projet

## Fichiers Principaux

### Scripts Python Racine

- `run.py` - Script principal pour démarrer l'application
  - Initialise l'application Flask
  - Configure le serveur de développement
  - Point d'entrée du projet

- `initialization.py` - Script d'initialisation du système
  - Crée la base de données initiale
  - Configure les paramètres par défaut
  - Importe les fichiers audio existants
  - Met à jour l'index de recherche

- `config.py` - Configuration globale
  - Variables d'environnement
  - Paramètres de sécurité
  - Configuration de la base de données
  - Chemins des fichiers

### Application (`app/`)

#### Fichiers Python Core

- `__init__.py`
  - Initialisation de l'application Flask
  - Configuration des extensions
  - Enregistrement des blueprints
  - Setup de la base de données

- `models.py`
  - Définition des modèles SQLAlchemy
  - Tables: Users, Tracks, Playlists, etc.
  - Relations entre les tables
  - Méthodes de modèle

- `routes.py`
  - Définition des routes API
  - Gestion des requêtes HTTP
  - Logique métier
  - Endpoints CRUD

#### JavaScript (`app/static/js/`)

- `mixer.js`
  - Interface du mixer DJ
  - Gestion des platines
  - Contrôles de lecture
  - Interface utilisateur interactive

- `audio-engine.js`
  - Moteur audio principal
  - Gestion du Web Audio API
  - Processing des effets
  - Manipulation du signal audio

- `deck-controller.js`
  - Contrôle individuel des platines
  - Gestion du pitch/tempo
  - EQ et effets par platine
  - Crossfader

- `effect-chain.js`
  - Chaîne d'effets audio
  - Routing des effets
  - Paramètres d'effets
  - Presets

- `track-library.js`
  - Gestion de la bibliothèque
  - Organisation des playlists
  - Recherche de morceaux
  - Métadonnées

- `main.js`
  - Point d'entrée JavaScript
  - Initialisation des composants
  - Gestion des événements globaux
  - État de l'application

#### CSS (`app/static/css/`)

- `mixer.css`
  - Styles du mixer DJ
  - Layout des platines
  - Visualisations
  - Responsive design

- `style.css`
  - Styles globaux
  - Thème de l'application
  - Composants UI
  - Media queries

#### Templates (`app/templates/`)

- `base.html`
  - Template de base
  - Structure HTML commune
  - Navigation
  - Scripts/styles communs

- `mixer.html`
  - Interface principale du mixer
  - Layout des platines
  - Contrôles DJ
  - Bibliothèque de morceaux

- `login.html`
  - Page de connexion
  - Formulaire d'authentification
  - Messages d'erreur
  - Redirection

- `choose_mode.html`
  - Sélection du mode
  - Options de configuration
  - Préférences utilisateur

- `converter.html`
  - Interface de conversion audio
  - Upload de fichiers
  - Options de conversion
  - Statut de conversion

#### Admin Templates (`app/templates/admin/`)

- `base.html`
  - Layout admin
  - Navigation admin
  - Fonctions communes

- `dashboard.html`
  - Tableau de bord admin
  - Statistiques système
  - Actions rapides
  - Logs système

- `users.html`
  - Gestion des utilisateurs
  - Liste des utilisateurs
  - Permissions
  - Actions utilisateur

## Documentation (`docs/`)

- `README.md`
  - Vue d'ensemble du projet
  - Table des matières
  - Guide rapide

- `installation.md`
  - Guide d'installation
  - Prérequis
  - Configuration

- `architecture.md`
  - Architecture technique
  - Structure du projet
  - Composants

## Tests (`tests/`)

- `README.md`
  - Documentation des tests
  - Structure des tests
  - Comment exécuter

- `audio/README.md`
  - Tests audio spécifiques
  - Fichiers de test
  - Cas de test audio
