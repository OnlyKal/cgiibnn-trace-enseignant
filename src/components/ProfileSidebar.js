import React, { useState, useEffect } from 'react';
import {
  FaTimes, FaUser, FaLock, FaEnvelope, FaIdCard,
  FaEye, FaEyeSlash, FaSignOutAlt, FaChevronRight, FaFileAlt,
} from 'react-icons/fa';
import { SERVER_URL } from '../config';
import AuthService from '../services/AuthService';
import { getTimeoutSignal } from '../utils/timeoutSignal';
import '../styles/ProfileSidebar.css';

const TYPE_LABELS = {
  'Professeur': 'Professeur',
  'Chef de Travaux': 'Chef de Travaux',
  'Assistant': 'Assistant',
};

const ProfileSidebar = ({ isOpen, onClose, user, onViewMyRecord, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [pwForm, setPwForm] = useState({ ancien: '', nouveau: '', confirm: '' });
  const [showPw, setShowPw] = useState({ ancien: false, nouveau: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('profile');
      setPwForm({ ancien: '', nouveau: '', confirm: '' });
      setPwMessage({ text: '', type: '' });
      setShowPw({ ancien: false, nouveau: false, confirm: false });
    }
  }, [isOpen]);

  if (!user) return null;

  const initials = [user.nom, user.postnom]
    .filter(Boolean)
    .map(s => s[0].toUpperCase())
    .join('');

  const fullName = [user.nom, user.postnom, user.prenom].filter(Boolean).join(' ');
  const typeLabel = TYPE_LABELS[user.type_de_compte] || user.type_de_compte || '—';

  const togglePw = (field) => setShowPw(s => ({ ...s, [field]: !s[field] }));

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.nouveau !== pwForm.confirm) {
      setPwMessage({ text: 'Les deux nouveaux mots de passe ne correspondent pas.', type: 'error' });
      return;
    }
    if (pwForm.nouveau.length < 6) {
      setPwMessage({ text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.', type: 'error' });
      return;
    }
    setPwLoading(true);
    setPwMessage({ text: '', type: '' });
    try {
      const compteId = user.id || user.compte_id;
      if (!compteId) {
        setPwMessage({ text: 'Identifiant de compte introuvable. Reconnectez-vous.', type: 'error' });
        setPwLoading(false);
        return;
      }

      const headers = { 'Content-Type': 'application/json' };

      const res = await fetch(`${SERVER_URL}/api/enseignants/comptes/${compteId}/update-password/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ancien_mot_de_passe: pwForm.ancien,
          nouveau_mot_de_passe: pwForm.nouveau,
        }),
        signal: getTimeoutSignal(15000),
      });

      if (res.ok) {
        setPwMessage({ text: 'Mot de passe modifié avec succès.', type: 'success' });
        setPwForm({ ancien: '', nouveau: '', confirm: '' });
      } else {
        const err = await res.json().catch(() => ({}));
        const msg =
          (err.errors && Object.values(err.errors).flat().join(' ')) ||
          err.message || err.detail ||
          'Erreur lors du changement de mot de passe.';
        setPwMessage({ text: msg, type: 'error' });
      }
    } catch {
      setPwMessage({ text: 'Impossible de contacter le serveur. Réessayez plus tard.', type: 'error' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
      <div
        className={`profile-sidebar-overlay${isOpen ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`profile-sidebar${isOpen ? ' open' : ''}`} aria-label="Panneau profil">
        {/* ── Header ── */}
        <div className="profile-sidebar-header">
          <span className="profile-sidebar-title">Mon Profil</span>
          <button className="profile-sidebar-close" onClick={onClose} title="Fermer">
            <FaTimes />
          </button>
        </div>

        {/* ── Avatar + nom ── */}
        <div className="profile-sidebar-hero">
          <div className="profile-avatar-lg">
            {user.photo_profil
              ? <img src={user.photo_profil} alt="Photo de profil" className="profile-avatar-img" />
              : <span className="profile-avatar-initials">{initials || <FaUser />}</span>
            }
          </div>
          <div className="profile-hero-name">{fullName || '—'}</div>
          <span className="profile-hero-badge">{typeLabel}</span>
        </div>

        {/* ── Tabs ── */}
        <div className="profile-sidebar-tabs">
          <button
            className={`profile-tab${activeTab === 'profile' ? ' active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Informations
          </button>
          <button
            className={`profile-tab${activeTab === 'security' ? ' active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaLock /> Sécurité
          </button>
        </div>

        {/* ── Tab Informations ── */}
        {activeTab === 'profile' && (
          <div className="profile-sidebar-body">
            <div className="profile-info-row">
              <FaIdCard className="profile-info-icon" />
              <div>
                <div className="profile-info-label">Nom complet</div>
                <div className="profile-info-value">{fullName || '—'}</div>
              </div>
            </div>

            <div className="profile-info-row">
              <FaEnvelope className="profile-info-icon" />
              <div>
                <div className="profile-info-label">Adresse email</div>
                <div className="profile-info-value">{user.email || '—'}</div>
              </div>
            </div>

            <div className="profile-info-row">
              <FaUser className="profile-info-icon" />
              <div>
                <div className="profile-info-label">Type de compte</div>
                <div className="profile-info-value">{typeLabel}</div>
              </div>
            </div>

            {user.matricule && (
              <div className="profile-info-row">
                <FaFileAlt className="profile-info-icon" />
                <div>
                  <div className="profile-info-label">Matricule</div>
                  <div className="profile-info-value">{user.matricule}</div>
                </div>
              </div>
            )}

            {onViewMyRecord && (
              <button
                className="profile-view-record-btn"
                onClick={() => { onViewMyRecord(); onClose(); }}
              >
                <FaFileAlt /> Voir mes fiches enregistrées
                <FaChevronRight className="profile-chevron" />
              </button>
            )}

            <div className="profile-sidebar-divider" />

            <button className="profile-logout-btn" onClick={onLogout}>
              <FaSignOutAlt /> Se déconnecter
            </button>
          </div>
        )}

        {/* ── Tab Sécurité ── */}
        {activeTab === 'security' && (
          <div className="profile-sidebar-body">
            <form className="profile-pw-form" onSubmit={handlePasswordSubmit} noValidate>
              <h3 className="profile-pw-title">Changer le mot de passe</h3>

              {pwMessage.text && (
                <div className={`profile-pw-message ${pwMessage.type}`}>
                  {pwMessage.text}
                </div>
              )}

              {[
                { field: 'ancien', label: 'Mot de passe actuel', autocomplete: 'current-password' },
                { field: 'nouveau', label: 'Nouveau mot de passe', autocomplete: 'new-password' },
                { field: 'confirm', label: 'Confirmer le nouveau mot de passe', autocomplete: 'new-password' },
              ].map(({ field, label, autocomplete }) => (
                <div className="profile-pw-group" key={field}>
                  <label htmlFor={`pw-${field}`}>{label}</label>
                  <div className="profile-pw-input-wrap">
                    <input
                      id={`pw-${field}`}
                      type={showPw[field] ? 'text' : 'password'}
                      value={pwForm[field]}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      required
                      autoComplete={autocomplete}
                      minLength={field !== 'ancien' ? 6 : undefined}
                    />
                    <button
                      type="button"
                      className="profile-pw-eye"
                      onClick={() => togglePw(field)}
                      tabIndex={-1}
                      aria-label={showPw[field] ? 'Masquer' : 'Afficher'}
                    >
                      {showPw[field] ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              ))}

              <button type="submit" className="profile-pw-submit" disabled={pwLoading}>
                {pwLoading ? 'Modification en cours...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
};

export default ProfileSidebar;
