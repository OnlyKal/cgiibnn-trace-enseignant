import React, { useState, useEffect } from 'react';
import '../styles/EmailVerificationScreen.css';
import { FaEnvelope, FaClock } from 'react-icons/fa';
import LoadingModal from './LoadingModal';
import ApiService from '../services/ApiService';

const EmailVerificationScreen = ({ userEmail, onVerificationComplete, userName, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error'
  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
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

  // Polling périodique pour vérifier si le compte a été activé
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const userData = await ApiService.checkAccountStatus();
        
        // Si le compte est maintenant actif, rediriger automatiquement
        if (userData.statut_compte === 'actif' || userData.statut_compte === 'Actif') {
          showPopup('✓ Votre compte a été activé avec succès!', 'success');
          setMessage('Redirection en cours...');
          setMessageType('success');
          
          // Attendre un peu avant de rediriger
          setTimeout(() => {
            if (onVerificationComplete) {
              onVerificationComplete(userData);
            }
          }, 1500);
        }
      } catch (error) {
        // Silencieux - continue le polling
        console.log('Vérification du statut en cours...');
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(interval);
  }, [onVerificationComplete]);

  // Au montage, activer le compte à rebours 60 secondes pour éviter un double envoi
  useEffect(() => {
    setCountdown(60);
    setIsResendDisabled(true);
  }, []);

  // Gérer le compte à rebours
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isResendDisabled) {
      setIsResendDisabled(false);
    }
  }, [countdown, isResendDisabled]);

  const handleResendEmail = async () => {
    if (isResendDisabled || !userEmail) return;

    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const data = await ApiService.sendVerificationEmail(userEmail);

      // Succès
      showPopup('Un nouvel email de vérification a été envoyé avec succès.', 'success');
      setMessage('Un nouvel email de vérification a été envoyé à votre adresse.');
      setMessageType('success');
      
      // Activer le compte à rebours
      setCountdown(60);
      setIsResendDisabled(true);
    } catch (error) {
      let errorMsg = 'Erreur lors de l\'envoi de l\'email';
      if (error.name === 'AbortError') {
        errorMsg = 'La requête a expiré. Veuillez réessayer.';
      } else if (error.message === 'Failed to fetch') {
        errorMsg = 'Erreur de connexion réseau.';
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

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="email-verification-page">
      <LoadingModal isOpen={loading} />

      {popupMessage && (
        <div className={`popup-message popup-${popupType}`} role="alert">
          {popupMessage}
        </div>
      )}

      {/* Logo */}
      <div className="email-verification-page__logo">
        <img src="/app-logo.png" alt="Logo application" />
      </div>

      <div className="email-verification-card">
        {/* En-tête avec icône */}
        <div className="email-verification-card__header">
          <div className="email-verification-card__icon-badge">
            <FaEnvelope />
          </div>
          <h1 className="email-verification-card__title">
            Vérification d'email
          </h1>
          <p className="email-verification-card__subtitle">
            Confirmez votre adresse email
          </p>
        </div>

        {/* Corps du formulaire */}
        <div className="email-verification-card__form">
          {/* Message informatif */}
          <div className="email-verification-card__info">
            <p className="email-verification-card__message">
              Par mesure de sécurité, veuillez vérifier votre adresse email avant d'accéder à votre compte.
            </p>
            <p className="email-verification-card__email">
              <strong>{userEmail}</strong>
            </p>
            <p className="email-verification-card__hint">
              Un email de confirmation a été envoyé.
            </p>
          </div>

          {/* État du message */}
          {message && (
            <div className={`email-verification-alert email-verification-alert--${messageType}`} role="alert">
              {message}
            </div>
          )}

          {/* Bouton principal */}
          <button
            className="email-verification-button email-verification-button--primary"
            onClick={handleResendEmail}
            disabled={loading || isResendDisabled}
            type="button"
          >
            {loading ? 'Envoi en cours...' : 'Renvoyer l\'email'}
          </button>

          {/* Compte à rebours */}
          {isResendDisabled && countdown > 0 && (
            <div className="email-verification-card__countdown">
              <FaClock /> Nouveau renvoi dans {countdown}s
            </div>
          )}

          {/* Bouton de déconnexion */}
          <button
            className="email-verification-button email-verification-button--secondary"
            onClick={handleLogout}
            type="button"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationScreen;
