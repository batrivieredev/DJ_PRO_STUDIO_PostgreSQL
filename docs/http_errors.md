# Codes d'Erreur HTTP

## 2xx - Succès

- `200 OK`
  - Requête traitée avec succès
  - Retourne les données demandées

- `201 Created`
  - Ressource créée avec succès
  - Utilisé après upload de fichier ou création d'utilisateur

- `204 No Content`
  - Action réussie, pas de contenu à retourner
  - Ex: Suppression d'une playlist

## 3xx - Redirection

- `301 Moved Permanently`
  - La ressource a été déplacée définitivement
  - Suivre la nouvelle URL fournie

- `304 Not Modified`
  - La ressource n'a pas été modifiée
  - Utilisé pour le cache des fichiers audio

## 4xx - Erreurs Client

- `400 Bad Request`
  - Requête mal formée
  - Paramètres manquants ou invalides
  - Format de données incorrect

- `401 Unauthorized`
  - Authentification requise
  - Token manquant ou invalide
  - Session expirée

- `403 Forbidden`
  - Accès refusé
  - Permissions insuffisantes
  - Compte non validé par admin

- `404 Not Found`
  - Ressource introuvable
  - Fichier audio absent
  - Playlist supprimée

- `409 Conflict`
  - Conflit avec l'état actuel
  - Nom de playlist déjà utilisé
  - Version de fichier conflictuelle

- `413 Payload Too Large`
  - Fichier uploadé trop volumineux
  - Dépassement limite de taille

- `415 Unsupported Media Type`
  - Format de fichier non supporté
  - Extension audio non reconnue

- `429 Too Many Requests`
  - Trop de requêtes
  - Rate limiting atteint

## 5xx - Erreurs Serveur

- `500 Internal Server Error`
  - Erreur serveur générique
  - Exception non gérée
  - Bug applicatif

- `502 Bad Gateway`
  - Erreur de communication
  - Service externe indisponible

- `503 Service Unavailable`
  - Service temporairement indisponible
  - Maintenance en cours
  - Surcharge serveur

- `504 Gateway Timeout`
  - Timeout d'une opération
  - Analyse BPM trop longue
  - Conversion audio timeout

## Gestion des Erreurs

### Format de Réponse

```json
{
  "error": {
    "code": 400,
    "message": "Description de l'erreur",
    "details": {
      "field": "Description spécifique",
      "reason": "Raison technique"
    }
  }
}
```

### Bonnes Pratiques

1. **Messages Clairs**
   - Description compréhensible
   - Instructions de correction
   - Pas de détails techniques sensibles

2. **Logging**
   - Toutes les erreurs sont loggées
   - Stack traces en développement
   - Identifiant unique d'erreur

3. **Récupération**
   - Suggestions de solutions
   - Actions alternatives
   - État cohérent maintenu

4. **Sécurité**
   - Pas d'information sensible
   - Validation des entrées
   - Rate limiting
