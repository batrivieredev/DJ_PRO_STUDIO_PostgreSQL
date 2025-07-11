# Documentation du Système DJ

## Table des matières

1. [Installation et Configuration](installation.md)
   - Prérequis système
   - Installation des dépendances
   - Configuration de l'environnement

2. [Architecture du Projet](architecture.md)
   - Structure des dossiers
   - Description des composants
   - Diagramme d'architecture

3. [Détails des Fichiers](file_details.md)
   - Description détaillée de chaque fichier
   - Rôle et responsabilités
   - Interactions entre fichiers

4. [Base de données](database.md)
   - Modèles de données
   - Relations entre les tables
   - Schéma de la base de données

5. [Sécurité et Permissions](security.md)
   - Rôles utilisateur
   - Système de permissions
   - Validation des comptes
   - Protection du système

6. [Codes d'Erreur HTTP](http_errors.md)
   - Description des codes d'erreur
   - Gestion des erreurs
   - Bonnes pratiques
   - Format des réponses

7. [Fonctionnalités](features.md)
   - Mixer DJ
   - Convertisseur audio
   - Gestion des playlists
   - Analyse BPM

## Guides Rapides

### Démarrage

```bash
# Installation des dépendances
pip install -r requirements.txt

# Initialisation de la base de données
python initialization.py

# Lancement du serveur
python run.py
```

### Administration

- Accès interface admin: `/admin`
- Validation utilisateurs: `/admin/users`
- Configuration système: `/admin/settings`

### Développement

- Tests: `pytest tests/`
- Logs: `logs/app.log`
- Build frontend: `npm run build`

## Ressources

- [Guide Développeur](developer.md)
- [API Reference](api.md)
- [FAQ](faq.md)

## Contribution

1. Fork du projet
2. Création branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Pull Request

## Support

- Issue Tracker: https://github.com/votre-repo/issues
- Email: support@example.com
- Discord: https://discord.gg/votre-serveur

## License

Ce projet est sous licence MIT - voir le fichier [LICENSE.md](LICENSE.md) pour plus de détails.
