# Système de Gestion de Vérification d'Email

## Vue d'ensemble
Ce document décrit l'implémentation du système de vérification d'email après la création d'un compte utilisateur.

## Modifications apportées

### 1. Composant EmailVerificationScreen (`src/components/EmailVerificationScreen.js`)
**Nouveau fichier** - Page dédiée pour la vérification d'email

#### Fonctionnalités:
- Affiche l'adresse email de l'utilisateur
- Bouton "Vérifier maintenant" pour renvoyer l'email de vérification
- Loader pendant l'envoi de l'email
- Bouton temporairement désactivé après chaque envoi
- **Compte à rebours de 60 secondes** avant le prochain renvoi
- Messages de succès/erreur avec popups
- Bouton "Retour à la connexion" pour se déconnecter
- Design moderne avec gradient et animations

#### Props:
```javascript
{
  userEmail: string,           // Email de l'utilisateur
  userName: string,            // Nom complet (postnom + nom)
  onVerificationComplete: fn,  // Callback après vérification complète
  onLogout: fn                 // Callback pour la déconnexion
}
```

### 2. Styles EmailVerificationScreen (`src/styles/EmailVerificationScreen.css`)
**Nouveau fichier** - Styles pour la page de vérification

- Design responsive (mobile, tablet, desktop)
- Animations fluides (slideUp, slideDown, bounce, etc.)
- Gradient couleur cohérent avec l'application
- Support des alertes success/error
- Compte à rebours animé

### 3. SignupForm.js - Modification
**Détection du statut du compte**

```javascript
// Après la création du compte, vérifie le statut
if (userData.statut_compte === 'inactif') {
  // Appelle onSignupSuccess avec un flag de vérification
  onSignupSuccess(userData, { requiresEmailVerification: true });
} else {
  // Le compte est actif, continuer normalement
  onSignupSuccess(userData, { requiresEmailVerification: false });
}
```

### 4. App.js - Modifications principales

#### a) Import du composant
```javascript
import EmailVerificationScreen from './components/EmailVerificationScreen';
```

#### b) Nouveaux états
```javascript
// États pour la vérification d'email
const [showEmailVerification, setShowEmailVerification] = useState(false);
const [emailVerificationUser, setEmailVerificationUser] = useState(null);
```

#### c) Logique d'initialisation de l'app
- Vérifie le statut du compte au chargement
- Si `statut_compte === 'inactif'`, affiche l'écran de vérification
- Sinon, affiche l'application normalement

#### d) Callbacks modifiés

**onSignupSuccess:**
```javascript
if (options.requiresEmailVerification) {
  // Afficher l'écran de vérification
  setEmailVerificationUser(userData);
  setShowEmailVerification(true);
  setIsLoggedIn(false);
} else {
  // Connecter l'utilisateur normalement
  setCurrentUser(userData);
  setIsLoggedIn(true);
}
```

**onLoginSuccess:**
```javascript
if (userData.statut_compte === 'inactif') {
  // Compte inactif - afficher la vérification d'email
  setEmailVerificationUser(userData);
  setShowEmailVerification(true);
  setIsLoggedIn(false);
} else {
  // Compte actif - connecter normalement
  setCurrentUser(userData);
  setIsLoggedIn(true);
}
```

#### e) Logique d'affichage
```javascript
{isInitializing ? (
  <SplashScreen />
) : !isLoggedIn && !showEmailVerification ? (
  // Login/Signup
) : showEmailVerification && emailVerificationUser ? (
  // Écran de vérification d'email
  <EmailVerificationScreen {...} />
) : showCommitment ? (
  // Engagement screen
) : (
  // Application principale
)}
```

### 5. ApiService.js - Nouvelle méthode

**sendVerificationEmail(email):**
```javascript
async sendVerificationEmail(email) {
  // POST /api/enseignants/comptes/send-verification-email/
  // Payload: { email: "user@example.com" }
  // Response: { message: "...", email_sent: true, email: "..." }
}
```

## Flux d'utilisation

### Scénario 1: Création d'un compte avec statut "inactif"

```
1. Utilisateur remplit le formulaire de signup
2. Soumission du formulaire
3. API retourne:
   {
     "message": "Compte créé avec succès...",
     "email_verification_required": true,
     "email_sent": true,
     "compte": {
       "id": 1,
       "email": "jean.dupont@example.com",
       "statut_compte": "inactif",
       ...
     }
   }
4. SignupForm détecte statut_compte === "inactif"
5. Appelle onSignupSuccess avec requiresEmailVerification: true
6. App affiche EmailVerificationScreen
7. Utilisateur voit:
   - Titre: "Vérification de votre adresse email"
   - Message expliquant la sécurité
   - Bouton "Vérifier maintenant"
   - Information sur l'email envoyé
```

### Scénario 2: Renvoi d'email de vérification

```
1. Utilisateur clique "Vérifier maintenant"
2. EmailVerificationScreen appelle:
   POST /api/enseignants/comptes/send-verification-email/
   { "email": "jean.dupont@example.com" }
3. Loader affiché pendant la requête
4. Bouton désactivé
5. Réponse reçue:
   { "message": "Un email de vérification a été envoyé...", "email_sent": true }
6. Notification de succès affichée
7. Compte à rebours de 60 secondes activé
8. Après 60 secondes, bouton réactivé
```

### Scénario 3: Connexion avec compte inactif

```
1. Utilisateur se connecte avec identifiants
2. API retourne:
   { "compte": { "statut_compte": "inactif", ... } }
3. LoginForm/App détecte statut_compte === "inactif"
4. Au lieu de connecter, affiche EmailVerificationScreen
5. Utilisateur doit vérifier son email avant d'accéder à l'app
```

## Règles d'accès

- **Tant que** `statut_compte = "inactif"` → Pas d'accès à l'application
- **Après** vérification de l'email → Backend met à jour statut en "actif"
- **Prochain rechargement** → Utilisateur accède à l'application normale

## Messages affichés

### Succès
```
"Un nouvel email de vérification a été envoyé avec succès."
```

### Erreur (exemples)
```
"Erreur lors de l'envoi de l'email de vérification"
"Erreur de connexion réseau."
"La requête a expiré. Veuillez réessayer."
```

## Sécurité - Compte à rebours

- **Délai minimum:** 60 secondes entre deux renvois
- **But:** Prévenir les abus/spam
- **Affichage:** Compte à rebours visible avec icône d'horloge
- **Bouton:** Désactivé pendant le compte à rebours

## Expérience utilisateur

### Desktop
- Page centrée avec padding latéral
- Animations fluides sur tous les éléments
- Responsive jusqu'à 400px

### Mobile
- Texte bien lisible
- Boutons tactiles (taille appropriée)
- Pas de débordement horizontal
- Adaptation des spacings

## Prochaines étapes (côté backend)

1. **Créer l'endpoint:** `/api/enseignants/comptes/send-verification-email/`
2. **Implémenter:** Envoi d'email avec token de vérification
3. **Créer:** Page de confirmation (ou lien de vérification)
4. **Mettre à jour:** Statut du compte à "actif" après vérification

## Tests recommandés

- [ ] Création de compte → Redirection vers vérification
- [ ] Renvoi d'email → Compte à rebours activé
- [ ] Compte à rebours → Décompte correct
- [ ] Connexion compte inactif → Affiche vérification
- [ ] Déconnexion → Tous les états réinitialisés
- [ ] Rechargement page → État préservé
- [ ] Erreur réseau → Message clair affiché
