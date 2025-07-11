# Guide d'installation

## Prérequis système

- Python 3.9 ou supérieur
- ffmpeg
- SQLite 3
- Navigateur web moderne

## Installation des dépendances

1. Installer ffmpeg :
```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# Télécharger depuis https://ffmpeg.org/download.html
```

2. Cloner le projet :
```bash
git clone [url-du-projet]
cd [nom-du-projet]
```

3. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

4. Installer les dépendances Python :
```bash
pip install -r requirements.txt
```

## Configuration

1. Créer le fichier de configuration :
```bash
cp config.example.py config.py
```

2. Modifier les paramètres dans `config.py`:
- `SECRET_KEY`: Clé secrète pour la sécurité
- `UPLOAD_FOLDER`: Dossier pour les fichiers uploadés
- Autres paramètres selon vos besoins

## Initialisation

1. Initialiser la base de données :
```bash
python initialization.py
```

2. Créer un compte administrateur :
- Par défaut: admin/admin
- Changer le mot de passe après la première connexion

## Démarrage

1. Lancer l'application :
```bash
python run.py
```

2. Accéder à l'interface web :
- Ouvrir http://localhost:5000
- Se connecter avec les identifiants admin

## Test de l'installation

1. Vérifier le fonctionnement :
- Uploader quelques fichiers MP3
- Tester le convertisseur
- Créer une playlist
- Vérifier l'analyse BPM
