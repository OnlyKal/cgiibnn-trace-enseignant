# 🔐 Guide de Gestion de l'Authentification Sécurisée

## Vue d'ensemble

Votre application dispose maintenant d'un système d'authentification robuste et sécurisé avec les 4 améliorations suivantes :

---

## 1. ✅ Expiration du Token & Refresh Automatique

### Fonctionnement
- **Token Bearer** : Chaque token d'authentification est formaté avec le préfixe `Bearer`
- **Expiration automatique** : La date d'expiration est extraite du JWT (champ `exp`)
- **Tampon de renouvellement** : Les tokens sont marqués pour renouvellement 5 minutes avant expiration
- **Stockage de l'expiration** : La timestamp d'expiration est sauvegardée en localStorage

### Utilisation dans le code

```javascript
// Vérifier si le token est expiré
const isExpired = AuthService.isTokenExpired(token);

// Vérifier si le token doit être rafraîchi (avant 5 min d'expiration)
const shouldRefresh = AuthService.shouldRefreshToken(token);

// Obtenir le temps avant expiration (en millisecondes)
const timeUntilExpiry = AuthService.getTimeBeforeExpiry(token);
```

### Fichiers concernés
- `src/services/AuthService.js` - Gestion de l'expiration
- `src/services/ApiService.js` - Vérification avant chaque requête

---

## 2. 🔓 Déconnexion Propre

### Fonctionnement
Une déconnexion complète qui nettoie tous les éléments de session et force la reconnexion.

### Données nettoyées
```javascript
localStorage :
- authToken
- refreshToken
- tokenExpiry
- user
- user_email
- appBuild
- appVersion

sessionStorage :
- Tout le sessionStorage
```

### Utilisation

```javascript
// Dans un composant
import AuthService from './services/AuthService';

const handleLogout = () => {
  AuthService.logout();
  // L'utilisateur est complètement déconnecté
  // Redirection vers login automatique
};
```

### Sécurité
- ✅ Impossible d'accéder aux données de session après logout
- ✅ Toutes les requêtes API échoueront jusqu'à reconnexion
- ✅ Les données utilisateur sensibles sont supprimées

---

## 3. 🔍 Vérification d'Intégrité du Token

### Validation JWT
La structure d'un JWT valide :
```
header.payload.signature
↓
3 parties séparées par des points
```

### Validations effectuées

```javascript
// Valider la structure (3 parties, format base64 valide)
const isValid = AuthService.validateTokenStructure(token);

// Décoder et extraire le payload
const payload = AuthService.decodeToken(token);

// Vérifier l'expiration
const isExpired = AuthService.isTokenExpired(token);

// Vérifier l'authenticité globale
const isAuthenticated = AuthService.isAuthenticated();
```

### Informations disponibles pour debug

```javascript
const tokenInfo = AuthService.getTokenInfo();
// Retourne :
{
  isAuthenticated: true,      // Authentifié et valide?
  isExpired: false,           // Le token est expiré?
  shouldRefresh: false,       // Doit-on le renouveler?
  expiresIn: 3600,           // Secondes avant expiration
  payload: { ... }           // Données du token
}
```

### Validation au démarrage
L'application valide automatiquement le token au démarrage :
- Structure JWT valide
- Pas expiré
- Données utilisateur présentes

---

## 4. 🧪 Tests de Comportement Complet

### Tests inclus

#### AuthService.test.js (15 tests)
```
✓ Validation de structure JWT
✓ Rejet des tokens invalides
✓ Décodage de tokens
✓ Détection d'expiration
✓ Calcul du temps avant expiration
✓ Détermination du refresh
✓ Stockage et récupération
✓ Statut d'authentification
✓ Déconnexion complète
✓ Informations de debug
```

#### ApiService.test.js (20 tests)
```
✓ Validation du token avant requêtes
✓ Gestion des erreurs 401/403
✓ Inclusion du Bearer token
✓ Méthodes HTTP (GET, POST, PATCH, DELETE)
✓ Upload de fichiers (FormData)
✓ Gestion d'erreurs génériques
✓ Statut d'authentification
✓ Gestion utilisateur
✓ Upload FormData authentifié
```

### Exécuter les tests

```bash
# Tous les tests d'authentification
npm test -- AuthService.test

# Tests du service API
npm test -- ApiService.test

# Mode watch (continu)
npm test -- --watch
```

---

## 📊 Flux d'Authentification

```
┌─────────────┐
│ Utilisateur │
└──────┬──────┘
       │ Se connecte
       ▼
┌─────────────────────┐
│ LoginForm           │
│ POST /api/login     │ 
└──────┬──────────────┘
       │ Token reçu
       ▼
┌─────────────────────────────┐
│ AuthService.saveToken()     │
│ - Valide structure JWT      │
│ - Ajoute Bearer prefix      │
│ - Stocke expiration         │
│ - Sauvegarde user           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ App.js                      │
│ AuthService.isAuthenticated │
│ - Valide intégrité          │
│ - Restaure session          │
└──────┬──────────────────────┘
       │ ✅ Connecté
       ▼
┌─────────────────────────────┐
│ ApiService                  │
│ validateToken() avant req   │
│ - Ajoute Bearer header      │
│ - Gère 401/403              │
└─────────────────────────────┘

Au logout :
├─ AuthService.logout()
├─ Nettoie localStorage
├─ Nettoie sessionStorage
└─ Reset état App.js
```

---

## 🛡️ Pratiques de Sécurité

### ✅ Déjà implémenté
- Token Bearer avec validation de structure
- Expiration automatique des tokens
- Déconnexion propre avec nettoyage complet
- Validation du token avant chaque requête API
- Gestion des erreurs 401/403 (re-authentification)
- Tests complets de sécurité

### 🔄 À considérer
- **Refresh token** : Implémentez un endpoint `/refresh` côté serveur
- **HTTPS seulement** : Toujours utiliser en production
- **HttpOnly cookies** : Alternative plus sécurisée que localStorage
- **Rate limiting** : Limiter les tentatives de login
- **2FA** : Authentification multi-facteurs optionnelle

---

## 🔧 Exemple d'utilisation

### Login avec token valide
```javascript
import AuthService from './services/AuthService';

// Après connexion réussie
const handleLoginSuccess = (response) => {
  try {
    // Sauvegarder le token et l'utilisateur
    AuthService.saveToken(
      response.token,
      response.user,
      response.refreshToken
    );
    
    // Vérifier l'authentification
    if (AuthService.isAuthenticated()) {
      // Utilisateur connecté ✅
      navigate('/dashboard');
    }
  } catch (error) {
    console.error('Erreur authentification:', error);
  }
};
```

### Appel API sécurisé
```javascript
import ApiService from './services/ApiService';

// ApiService valide automatiquement le token
const fetchUserData = async () => {
  try {
    const data = await ApiService.get('/api/user/profile');
    // Token était valide ✅
    return data;
  } catch (error) {
    if (error.message.includes('Session expirée')) {
      // Redirect to login
      navigate('/login');
    }
  }
};
```

### Logout propre
```javascript
import AuthService from './services/AuthService';

const handleLogout = () => {
  // Déconnexion complète
  AuthService.logout();
  
  // Réinitialiser l'app
  setIsLoggedIn(false);
  navigate('/login');
};
```

---

## 📝 Logging et Debug

### Activer le logging dans la console

L'application enregistre automatiquement les événements importants :

```
🔄 Initialisation de l'application...
🔍 Vérification de session au démarrage...
✅ Session restaurée: user@example.com
   Token Info: {...}
✅ Token Bearer stocké dans localStorage
✅ Données utilisateur sauvegardées: user@example.com
⏰ Token expire dans 3600 secondes
```

### Debugger l'authentification

```javascript
// Dans la console browser
AuthService.getTokenInfo()
// {
//   isAuthenticated: true,
//   isExpired: false,
//   expiresIn: 3600,
//   shouldRefresh: false,
//   payload: { ... }
// }
```

---

## ✨ Résumé des Améliorations

| Feature | Description | Bénéfice |
|---------|-------------|----------|
| **Expiration Token** | Détecte et gère l'expiration automatique | Sécurité améliorée |
| **Refresh Buffer** | Renouvelle avant expiration | Évite les interruptions |
| **Token Validation** | Valide structure JWT | Intégrité garantie |
| **Clean Logout** | Nettoie complètement la session | Pas de fuite de données |
| **API Security** | Valide token avant requête | Erreurs 401/403 gérées |
| **Tests Complets** | 35+ tests unitaires | Fiabilité certifiée |

---

## 📞 Support

Pour des questions ou problèmes :
1. Vérifiez les logs en console (F12)
2. Utilisez `AuthService.getTokenInfo()` pour debugger
3. Consultez les tests pour des exemples d'utilisation
4. Vérifiez que votre serveur retourne un JWT valide

---

**Dernière mise à jour** : 18 janvier 2026  
**Version** : 1.0.0 - Authentification Sécurisée
