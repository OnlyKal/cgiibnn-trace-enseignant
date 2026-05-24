import React, { useState } from 'react';
import { SERVER_URL } from '../config';
import '../styles/LoginForm.css';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserShield } from 'react-icons/fa';
import LoadingModal from './LoadingModal';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';

const LoginForm = ({ onLoginSuccess, onSignupClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('');

  const showPopup = (msg, type) => {
    setPopupMessage(msg);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage('');
      setPopupType('');
    }, 4000);
  };

  const getServerErrorMessage = (errorData) => {
    if (!errorData || typeof errorData !== 'object') {
      return 'Identifiants invalides';
    }

    if (errorData.errors && typeof errorData.errors === 'object') {
      return Object.values(errorData.errors)
        .flat()
        .join('\n');
    }

    return errorData.message || errorData.detail || errorData.error || 'Identifiants invalides';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear message when user types
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    // Validation
    const email = formData.email.trim().toLowerCase();
    const motDePasse = formData.mot_de_passe;

    if (!email) {
      showPopup('Veuillez entrer votre adresse email', 'error');
      return;
    }

    if (!motDePasse.trim()) {
      showPopup('Veuillez entrer votre mot de passe', 'error');
      return;
    }

    if (motDePasse.length < 8) {
      showPopup('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showPopup('Veuillez entrer une adresse email valide', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Tentative de connexion pour:', email);
      
      const data = await fetch(`${SERVER_URL}/api/enseignants/comptes/signin/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          mot_de_passe: motDePasse,
        }),
        signal: AbortSignal.timeout(30000), // 30 seconds timeout
      }).then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(getServerErrorMessage(errData));
        }
        return res.json();
      });

      console.log('📦 Réponse du serveur reçue:', data);


      // Nouvelle structure : { message, compte: { ... }, tokens: { access, refresh } }
      const userData = data.compte;

      if (!userData) {
        console.error('Objet compte absent de la reponse');
        throw new Error('Donnees utilisateur non recues du serveur');
      }

      console.log('Compte utilisateur:', userData);

      // Sauvegarder la session avec token JWT si disponible
      if (data.tokens && data.tokens.access) {
        AuthService.saveToken(data.tokens.access, userData);
      } else {
        AuthService.saveSession(userData);
      }

      if (!AuthService.isAuthenticated()) {
        throw new Error('Echec de la sauvegarde de la session');
      }

      showPopup('Connexion réussie!', 'success');
      setMessage('');
      
      // Redirection après connexion
      setTimeout(() => {
        onLoginSuccess(userData);
      }, 500);
    } catch (error) {
      let errorMsg = 'Erreur de connexion';
      if (error.name === 'AbortError') {
        errorMsg = 'La requête a expirée. Veuillez vérifier votre connexion.';
      } else if (error.message === 'Failed to fetch') {
        errorMsg = 'Erreur de connexion réseau. Veuillez vérifier votre connexion.';
      } else {
        errorMsg = error.message;
      }
      showPopup(errorMsg, 'error');
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <LoadingModal isOpen={loading} />

      {popupMessage && (
        <div className={`popup-message popup-${popupType}`} role="alert">
          {popupMessage}
        </div>
      )}

      <div className="login-page__logo">
        <img src="/app-logo.png" alt="Logo application" />
      </div>

      <div className="login-card">

        {/* ── En-tête ── */}
        <div className="login-card__header">
          <div className="login-card__icon-badge">
            <FaUserShield />
          </div>
          <h1 className="login-card__title">Connexion</h1>
          <p className="login-card__subtitle">
            Registre d'Identification des Enseignants
          </p>
        </div>

        {/* ── Message d'état ── */}
        {message && (
          <div className={`login-alert login-alert--${messageType}`} role="alert">
            {message}
          </div>
        )}

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} className="login-card__form" noValidate>

          <div className="login-field">
            <label className="login-field__label" htmlFor="email">
              Adresse e-mail
            </label>
            <div className="login-field__input-wrapper">
              <span className="login-field__icon" aria-hidden="true">
                <FaEnvelope />
              </span>
              <input
                className="login-field__input"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="exemple@institution.cd"
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-field__label" htmlFor="mot_de_passe">
              Mot de passe
            </label>
            <div className="login-field__input-wrapper">
              <span className="login-field__icon" aria-hidden="true">
                <FaLock />
              </span>
              <input
                className="login-field__input"
                type={showPassword ? 'text' : 'password'}
                id="mot_de_passe"
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleInputChange}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-card__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-card__submit-loader">
                <span className="login-spinner" aria-hidden="true" />
                Connexion en cours…
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* ── Pied de page ── */}
        <div className="login-card__footer">
          <p className="login-card__footer-note">
            Accès réservé aux personnes disposant d'identifiants valides.
          </p>
          <p className="login-card__footer-signup">
            Pas encore de compte ?{' '}
            <button
              type="button"
              className="login-card__footer-link"
              onClick={onSignupClick}
              disabled={loading}
            >
              Créer un compte
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
