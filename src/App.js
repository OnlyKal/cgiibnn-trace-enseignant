import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/AccountTypeSelection.css';
import { FaChalkboardUser, FaToolbox, FaGraduationCap } from 'react-icons/fa6';
import SplashScreen from './components/SplashScreen';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import CommitmentScreen, { isCommitmentAccepted, clearCommitmentAccepted } from './components/CommitmentScreen';
import ProfessorRegistrationForm from './components/ProfessorRegistrationForm';
import MyRecord from './components/MyRecord';
import AuthService from './services/AuthService';

/**
 * Application principale - Plateforme web React d'identification et de gestion des enseignants (Professeurs, Chefs des travaux, Assistants)
 * 
 * Sécurité des routes :
 * - Une fois connecté, impossible d'accéder au login/signup
 * - Seule la déconnexion manuelle permet de revenir au login
 * - La session persiste au rechargement de page (F5)
 * - Le token Bearer est automatiquement inclus dans les requêtes API
 * - Validation d'intégrité du token au démarrage
 * - Gestion automatique de l'expiration du token
 */
function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [showCommitment, setShowCommitment] = useState(false);

  // 'record' = vue "Mon dossier" (défaut après login)
  // 'form'   = formulaire création / édition
  const [appView, setAppView] = useState('record');
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [recordToEdit, setRecordToEdit] = useState(null); // données à pré-remplir en mode edit
  const [editRecordType, setEditRecordType] = useState(''); // 'Professeur' | 'Assistant' | 'CT'

  // Vérifier s'il y a une session active au démarrage
  useEffect(() => {
    const initializeApp = () => {
      
      // Vérifier directement localStorage d'abord
      const rawToken = localStorage.getItem('authToken');
      const rawUser = localStorage.getItem('user');

      // Si un token est présent, considérer la session comme active
      if (rawToken) {
        if (rawUser) {
          try {
            const parsedUser = JSON.parse(rawUser);
            setCurrentUser(parsedUser);
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }

        // Marquer comme connecté (token présent suffit pour rester sur le formulaire)
        setIsLoggedIn(true);
      } else {
        // Pas de token en localStorage — fallback sur AuthService
        if (AuthService.isAuthenticated()) {
          const user = AuthService.getUser();
          setCurrentUser(user);
          setIsLoggedIn(true);
        } else {
          AuthService.logout();
        }
      }
      
      setIsSessionRestored(true);
      setIsInitializing(false);
    };

    // Lancer l'initialisation après un petit délai pour s'assurer que localStorage est prêt
    const timeout = setTimeout(initializeApp, 100);
    
    // Lancer la vérification de version
    checkForUpdates();
    
    return () => clearTimeout(timeout);
  }, []);

  const checkForUpdates = async () => {
    try {
      // Vérifier si on est déjà en cours de rechargement pour éviter les boucles infinies
      if (sessionStorage.getItem('isReloading')) {
        sessionStorage.removeItem('isReloading');
        return;
      }

      // Ajouter un timestamp à la requête pour éviter le cache
      const response = await fetch('/version.json?t=' + Date.now(), {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        return;
      }
      
      const newVersion = await response.json();
      
      // Récupérer la version et build stockés localement
      const storedBuild = localStorage.getItem('appBuild');
      const currentBuild = newVersion.build?.toString();
      
      if (!currentBuild) {
        return;
      }
      
      // Si pas de build stocké, c'est la première visite - on sauvegarde et on continue
      if (!storedBuild) {
        localStorage.setItem('appVersion', newVersion.version);
        localStorage.setItem('appBuild', currentBuild);
        return;
      }
      
      // Si le build a changé, faire un nettoyage et recharger
      if (storedBuild !== currentBuild) {
        
        // Marquer qu'on est en cours de rechargement
        sessionStorage.setItem('isReloading', 'true');
        
        // Sauvegarder la nouvelle version
        localStorage.setItem('appVersion', newVersion.version);
        localStorage.setItem('appBuild', currentBuild);
        
        // Nettoyer les caches Service Worker
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
            }
          } catch (e) {
          }
        }
        
        // Attendre un peu avant de recharger
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      // Continuer normalement même si la vérification échoue
    }
  };

  const handleLogout = () => {
    // Déconnexion complète via AuthService
    AuthService.logout();
    clearCommitmentAccepted();
    
    // Réinitialiser l'état de l'application
    setIsLoggedIn(false);
    setShowSignup(false);
    setCurrentUser(null);
    setSelectedAccountType('');
    setAppView('record');
    setFormMode('create');
    setRecordToEdit(null);
  };

  // Protection contre l'accès au login/signup si déjà connecté
  useEffect(() => {
    if (isSessionRestored && isLoggedIn && !isInitializing) {
      // L'utilisateur connecté ne peut pas accéder au formulaire de signup
      if (showSignup) {
        setShowSignup(false);
      }
    }
  }, [isLoggedIn, showSignup, isSessionRestored, isInitializing]);

  return (
    <div className="App">
      {isInitializing ? (
        <SplashScreen onFinish={() => {}} />
      ) : !isLoggedIn ? (
        showSignup ? (
          <SignupForm 
            onSignupSuccess={(userData) => {
              setCurrentUser(userData);
              setShowSignup(false);
              setIsLoggedIn(true);
              if (!isCommitmentAccepted()) setShowCommitment(true);
            }}
            onBackToLogin={() => setShowSignup(false)}
          />
        ) : (
          <LoginForm 
            onLoginSuccess={(userData) => {
              setCurrentUser(userData);
              setIsLoggedIn(true);
              if (!isCommitmentAccepted()) setShowCommitment(true);
            }}
            onSignupClick={() => setShowSignup(true)}
          />
        )
      ) : showCommitment ? (
        <CommitmentScreen onContinue={() => setShowCommitment(false)} />
      ) : (
        appView === 'record' ? (
          <MyRecord
            currentUser={currentUser}
            onCreateRecord={(type) => {
              setFormMode('create');
              setRecordToEdit(null);
              setEditRecordType(type || '');
              setAppView('form');
            }}
            onEditRecord={(record, type) => {
              setFormMode('edit');
              setRecordToEdit(record);
              setEditRecordType(type);
              setAppView('form');
            }}
            onLogout={handleLogout}
          />
        ) : (
          <ProfessorRegistrationForm
            onLogout={handleLogout}
            currentUser={currentUser}
            preselectedType={
              editRecordType ||
              selectedAccountType ||
              (currentUser && currentUser.type_de_compte === 'Chef de Travaux' ? 'CT' : currentUser && currentUser.type_de_compte) ||
              ''
            }
            formMode={formMode}
            preloadedRecord={recordToEdit}
            onRequestAccountTypeReset={() => setSelectedAccountType('')}
            onBackToRecord={() => {
              setAppView('record');
              setFormMode('create');
              setRecordToEdit(null);
              setEditRecordType('');
            }}
          />
        )
      )}
    </div>
  );
}

export default App;
