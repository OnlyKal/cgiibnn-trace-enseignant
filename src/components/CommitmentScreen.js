import React, { useState } from 'react';
import '../styles/CommitmentScreen.css';

const COMMITMENT_SESSION_KEY = 'commitmentAccepted';

export const isCommitmentAccepted = () =>
  sessionStorage.getItem(COMMITMENT_SESSION_KEY) === 'true';

export const clearCommitmentAccepted = () =>
  sessionStorage.removeItem(COMMITMENT_SESSION_KEY);

const CommitmentScreen = ({ onContinue }) => {
  const [accepted, setAccepted] = useState(false);

  const handleContinue = () => {
    sessionStorage.setItem(COMMITMENT_SESSION_KEY, 'true');
    onContinue();
  };

  return (
    <div className="commitment-page">
      <div className="commitment-logo">
        <img src="/app-logo.png" alt="Logo MINESURSI" />
      </div>

      <div className="commitment-card">
        <div className="commitment-card__header">
          <h1 className="commitment-card__title">Acte d'engagement</h1>
          <p className="commitment-card__subtitle">
            Plateforme d'enregistrement des enseignants du MINESURSI
          </p>
        </div>

        <div className="commitment-card__body">
          <p className="commitment-intro">
            Lisez attentivement ce qui suit avant de remplir le formulaire
            d'enregistrement des enseignants du MINESURSI&nbsp;:
          </p>

          <ol className="commitment-list">
            <li>
              Assurez-vous d'avoir pris connaissance du{' '}
              <a
                href="/guide.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="commitment-link"
              >
                guide d'utilisation
              </a>{' '}
              de la plateforme&nbsp;;
            </li>
            <li>
              Assurez-vous d'avoir, aux formats indiqués dans la plateforme, les
              copies certifiées conformes aux originaux des pièces requises&nbsp;;
            </li>
            <li>
              Tout dossier incomplet ou composé de pièces non certifiées conformes
              aux originales sera rejeté&nbsp;;
            </li>
            <li>
              Les déclarations erronées, mensongères ou frauduleuses donneront lieu
              à des sanctions administratives et, le cas échéant, à des poursuites
              judiciaires&nbsp;;
            </li>
            <li>
              Lors d'un éventuel contrôle physique, vous serez contacté en vue de
              présenter la version papier de votre dossier&nbsp;: les originaux de
              différents diplômes et attestations, ainsi que les copies certifiées
              conformes aux originaux des autres pièces du dossier.
            </li>
          </ol>

          <label className="commitment-checkbox-label">
            <input
              type="checkbox"
              className="commitment-checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              Je reconnais avoir pris connaissance des directives ci-dessus et
              m'engage à les observer scrupuleusement.
            </span>
          </label>
        </div>

        <div className="commitment-card__footer">
          <button
            type="button"
            className={`commitment-btn${!accepted ? ' commitment-btn--disabled' : ''}`}
            onClick={handleContinue}
            disabled={!accepted}
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommitmentScreen;
