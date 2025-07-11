# Sécurité et Permissions

## Système de Permissions

### Rôles Utilisateur

1. **Administrateur**
   - Accès complet au système
   - Gestion des utilisateurs
   - Configuration système
   - Validation des nouveaux comptes

2. **Utilisateur Validé**
   - Accès aux fonctionnalités DJ
   - Upload de musiques
   - Création de playlists
   - Modification de ses données

3. **Utilisateur Non-Validé**
   - Accès en lecture seule
   - Pas d'upload possible
   - Pas de création de playlist
   - En attente de validation admin

### Processus de Validation

1. **Création de Compte**
   - L'utilisateur crée son compte
   - Statut initial: Non-validé
   - Accès restreint par défaut

2. **Validation Administrative**
   - Admin reçoit notification
   - Vérifie les informations
   - Peut approuver/refuser
   - Définit les permissions

3. **Activation**
   - Notification à l'utilisateur
   - Déblocage des fonctionnalités
   - Attribution du rôle validé

## Matrice des Permissions

| Action                    | Admin | Validé | Non-Validé |
|--------------------------|-------|---------|------------|
| Lecture musiques         | ✓     | ✓       | ✓          |
| Upload musiques          | ✓     | ✓       | ✗          |
| Créer playlists         | ✓     | ✓       | ✗          |
| Modifier playlists      | ✓     | ✓*      | ✗          |
| Supprimer playlists     | ✓     | ✓*      | ✗          |
| Valider utilisateurs    | ✓     | ✗       | ✗          |
| Gérer paramètres        | ✓     | ✗       | ✗          |
| Voir statistiques       | ✓     | ✗       | ✗          |

*Uniquement leurs propres playlists

## Sécurité Technique

### Authentification

1. **Hashage des Mots de Passe**
   - Utilisation de bcrypt
   - Salt unique par utilisateur
   - Itérations configurables

2. **Sessions**
   - Token JWT
   - Expiration configurable
   - Rotation des clés

3. **Protection Contre les Attaques**
   - Rate limiting
   - Protection CSRF
   - Headers sécurisés

### Validation des Données

1. **Entrées Utilisateur**
   - Sanitization stricte
   - Validation des formats
   - Protection XSS

2. **Fichiers Upload**
   - Vérification type MIME
   - Limite de taille
   - Scan antivirus

3. **API**
   - Validation schéma
   - Throttling
   - Authentification requise

## Audit et Monitoring

### Logs de Sécurité

1. **Actions Administratives**
   - Validation utilisateurs
   - Modifications système
   - Accès sensibles

2. **Activité Utilisateur**
   - Tentatives de connexion
   - Actions importantes
   - Modifications de données

3. **Système**
   - Erreurs applicatives
   - Problèmes de sécurité
   - Performance

### Alertes

1. **Sécurité**
   - Tentatives multiples échouées
   - Activité suspecte
   - Violations de sécurité

2. **Système**
   - Erreurs critiques
   - Problèmes de performance
   - Espace disque

## Recommandations

### Pour les Administrateurs

1. **Validation Utilisateur**
   - Vérifier identité
   - Définir permissions appropriées
   - Documenter décisions

2. **Monitoring**
   - Vérifier logs régulièrement
   - Suivre activité suspecte
   - Maintenir sécurité

### Pour les Utilisateurs

1. **Compte**
   - Mot de passe fort
   - Ne pas partager accès
   - Déconnexion après usage

2. **Upload**
   - Fichiers légitimes
   - Formats supportés
   - Taille raisonnable
