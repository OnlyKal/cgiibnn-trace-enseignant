import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';






// Vider tous les caches au chargement pour éviter les données sensibles
const clearAllCaches = async () => {
  // Vider localStorage (en gardant le brouillon du formulaire, la version de l'app
  // et les informations d'authentification afin de ne pas déconnecter l'utilisateur)
  if (typeof localStorage !== 'undefined') {
    try {
      const keysToPreserve = [
        'localstorageDraft',
        'appVersion',
        'appBuild',
        'authToken',
        'user',
        'user_email',
        'migrated-matricule',
      ];

      const backup = {};
      for (const k of keysToPreserve) {
        backup[k] = localStorage.getItem(k);
      }

      localStorage.clear();

      for (const k of keysToPreserve) {
        if (backup[k] !== null && backup[k] !== undefined) {
          localStorage.setItem(k, backup[k]);
        }
      }

      console.log('✅ localStorage cleared (brouillon, version et auth préservés)');
    } catch (e) {
      console.error('Erreur lors du nettoyage localStorage:', e);
    }
  }

  // Vider sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.clear();
      console.log('✅ sessionStorage cleared');
    } catch (e) {
      console.error('Erreur lors du nettoyage sessionStorage:', e);
    }
  }

  // Vider le cache du navigateur (Service Worker)
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`✅ Cache '${cacheName}' cleared`);
      }
    } catch (e) {
      console.error('Erreur lors du nettoyage des caches:', e);
    }
  }

  // Désenregistrer les Service Workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Service Worker unregistered');
      }
    } catch (e) {
      console.error('Erreur lors de la désinscription Service Worker:', e);
    }
  }
};

// Exécuter le nettoyage des caches au démarrage
clearAllCaches();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
