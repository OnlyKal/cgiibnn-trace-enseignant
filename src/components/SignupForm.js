import React, { useState } from 'react';
import { SERVER_URL } from '../config';
import '../styles/SignupForm.css';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import LoadingModal from './LoadingModal';
import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';

const SignupForm = ({ onSignupSuccess, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    nom: '',
    postnom: '',
    email: '',
    telephone: '',
    etablissement_attache: '',
    grade_actuel: '',
    type_de_compte: '',
    mot_de_passe: '',
    mot_de_passe_confirm: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
    if (!formData.nom.trim()) {
      showPopup('Veuillez entrer votre nom', 'error');
      return;
    }

    if (!formData.postnom.trim()) {
      showPopup('Veuillez entrer votre postnom', 'error');
      return;
    }

    if (!formData.email.trim()) {
      showPopup('Veuillez entrer votre adresse email', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showPopup('Veuillez entrer une adresse email valide', 'error');
      return;
    }


    if (!formData.telephone.trim()) {
      showPopup('Veuillez entrer votre numéro de téléphone', 'error');
      return;
    }

    if (!formData.telephone.startsWith('+243')) {
      showPopup('Le numéro de téléphone doit commencer par +243', 'error');
      return;
    }

    if (!formData.type_de_compte) {
      showPopup('Veuillez sélectionner votre type de compte', 'error');
      return;
    }

    if (!formData.mot_de_passe.trim()) {
      showPopup('Veuillez entrer un mot de passe', 'error');
      return;
    }

    if (formData.mot_de_passe.length < 8) {
      showPopup('Le mot de passe doit contenir au moins 8 caractères', 'error');
      return;
    }

    if (formData.mot_de_passe !== formData.mot_de_passe_confirm) {
      showPopup('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/api/enseignants/comptes/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: formData.nom,
          postnom: formData.postnom,
          email: formData.email,
          telephone: formData.telephone,
          type_de_compte: formData.type_de_compte,
          mot_de_passe: formData.mot_de_passe,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Gérer le format { errors: { field: [msg, ...], ... } }
        if (errorData.errors && typeof errorData.errors === 'object') {
          const messages = Object.values(errorData.errors)
            .flat()
            .join('\n');
          throw new Error(messages);
        }

        throw new Error(errorData.detail || errorData.message || 'Erreur lors de la création du compte');
      }

      const data = await response.json();

      // Nouvelle structure : { message, compte: { ... }, tokens: { access, refresh } }
      const userData = data.compte;

      if (!userData) {
        throw new Error('Données utilisateur non reçues du serveur');
      }

      // Sauvegarder la session avec token JWT si disponible
      if (data.tokens && data.tokens.access) {
        AuthService.saveToken(data.tokens.access, userData);
      } else {
        AuthService.saveSession(userData);
      }

      showPopup('Compte créé avec succès !', 'success');
      setMessage('');

      // Vérifier si le compte nécessite une vérification d'email
      if (userData.statut_compte === 'inactif') {
        // Compte créé mais inactive - redirection vers vérification email
        setTimeout(() => {
          onSignupSuccess(userData, { requiresEmailVerification: true });
        }, 1000);
      } else {
        // Compte actif - continue normalement
        setTimeout(() => {
          onSignupSuccess(userData, { requiresEmailVerification: false });
        }, 1000);
      }
    } catch (error) {
      let errorMsg = 'Erreur lors de la création du compte';
      if (error.name === 'AbortError') {
        errorMsg = 'La requête a expiré. Veuillez vérifier votre connexion.';
      } else if (error.message === 'Failed to fetch') {
        errorMsg = 'Erreur de connexion réseau. Veuillez vérifier votre connexion.';
      } else {
        errorMsg = error.message;
      }
      showPopup(errorMsg, 'error');
      setMessage(errorMsg);
      setMessageType('error');
      console.error('Erreur complète:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <LoadingModal isOpen={loading} />

      {popupMessage && (
        <div className={`popup-message popup-${popupType}`} role="alert">
          {popupMessage}
        </div>
      )}

      {/* Logo au-dessus de la carte */}
      <div className="signup-page__logo">
        <img src="/app-logo.png" alt="Logo application" />
      </div>

      <div className="signup-card">

        {/* ── En-tête ── */}
        <div className="signup-card__header">
          <div className="signup-card__icon-badge">
            <FaUser />
          </div>
          <h1 className="signup-card__title">Créer un compte</h1>
          <p className="signup-card__subtitle">Registre d'Identification des Enseignants</p>
        </div>

        {/* ── Message d'état ── */}
        {message && (
          <div className={`signup-alert signup-alert--${messageType}`} role="alert">
            {message}
          </div>
        )}

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} className="signup-card__form" noValidate>

          <p className="signup-section-label">Informations personnelles</p>

          <div className="signup-row">
            <div className="signup-field">
              <label className="signup-field__label" htmlFor="nom">Nom *</label>
              <div className="signup-field__input-wrapper">
                <span className="signup-field__icon"><FaUser /></span>
                <input
                  className="signup-field__input"
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder="Votre nom"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="signup-field">
              <label className="signup-field__label" htmlFor="postnom">Postnom *</label>
              <div className="signup-field__input-wrapper">
                <span className="signup-field__icon"><FaUser /></span>
                <input
                  className="signup-field__input"
                  type="text"
                  id="postnom"
                  name="postnom"
                  value={formData.postnom}
                  onChange={handleInputChange}
                  placeholder="Votre postnom"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-field__label" htmlFor="email">Adresse e-mail *</label>
            <div className="signup-field__input-wrapper">
              <span className="signup-field__icon"><FaEnvelope /></span>
              <input
                className="signup-field__input"
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

          <div className="signup-field">
            <label className="signup-field__label" htmlFor="telephone">Numéro de téléphone *</label>
            <div className="signup-field__input-wrapper">
              <span className="signup-field__icon"><FaPhone /></span>
              <input
                className="signup-field__input"
                type="tel"
                id="telephone"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="+243123456789"
                pattern="[0-9+]*"
                inputMode="numeric"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-field__label" htmlFor="type_de_compte">Type de compte *</label>
            <div className="signup-field__select-wrapper">
              <select
                className="signup-field__select"
                id="type_de_compte"
                name="type_de_compte"
                value={formData.type_de_compte}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                <option value="">-- Sélectionnez votre type --</option>
                <option value="Assistant">Assistant</option>
                <option value="Chef de Travaux">Chef de Travaux</option>
                <option value="Professeur">Professeur</option>
              </select>
            </div>
          </div>

          <p className="signup-section-label">Identifiants de connexion</p>

          <div className="signup-field">
            <label className="signup-field__label" htmlFor="mot_de_passe">Mot de passe *</label>
            <div className="signup-field__input-wrapper">
              <span className="signup-field__icon"><FaLock /></span>
              <input
                className="signup-field__input"
                type={showPassword ? 'text' : 'password'}
                id="mot_de_passe"
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleInputChange}
                placeholder="Minimum 8 caractères"
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="signup-field__toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="signup-field">
            <label className="signup-field__label" htmlFor="mot_de_passe_confirm">Confirmer le mot de passe *</label>
            <div className="signup-field__input-wrapper">
              <span className="signup-field__icon"><FaLock /></span>
              <input
                className="signup-field__input"
                type={showPasswordConfirm ? 'text' : 'password'}
                id="mot_de_passe_confirm"
                name="mot_de_passe_confirm"
                value={formData.mot_de_passe_confirm}
                onChange={handleInputChange}
                placeholder="Confirmez votre mot de passe"
                autoComplete="new-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="signup-field__toggle"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                disabled={loading}
                aria-label={showPasswordConfirm ? 'Masquer' : 'Afficher'}
              >
                {showPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="signup-card__submit"
            disabled={loading}
          >
            {loading ? (
              <span className="signup-card__submit-loader">
                <span className="signup-spinner" aria-hidden="true" />
                Création en cours…
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        {/* ── Pied de page ── */}
        <div className="signup-card__footer">
          <p className="signup-card__footer-login">
            Déjà un compte ?{' '}
            <button
              type="button"
              className="signup-card__footer-link"
              onClick={onBackToLogin}
              disabled={loading}
            >
              <FaArrowLeft style={{ marginRight: '4px', fontSize: '0.75rem' }} />
              Se connecter
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default SignupForm;
