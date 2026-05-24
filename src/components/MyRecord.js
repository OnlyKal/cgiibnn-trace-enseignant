import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUser, FaFileAlt, FaEdit, FaPlusCircle, FaSync,
  FaSignOutAlt, FaExclamationTriangle,
} from 'react-icons/fa';
import { SERVER_URL } from '../config';
import ProfileSidebar from './ProfileSidebar';
import UserInfo from './UserInfo';
import '../styles/MyRecord.css';

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

const TYPE_MAP = {
  'Professeur':       'Professeur',
  'Assistant':        'Assistant',
  'Chef de Travaux':  'CT',
};

const ENDPOINT_MAP = {
  'Professeur':      (id) => `/api/enseignants/professeur/by-compte/${id}/`,
  'Assistant':       (id) => `/api/enseignants/assistant/by-compte/${id}/`,
  'Chef de Travaux': (id) => `/api/enseignants/chef-travaux/by-compte/${id}/`,
};

const MIGRATION_TARGET_MAP = {
  'Assistant': 'Chef de Travaux',
  'Chef de Travaux': 'Professeur',
};

const TITLE_MAP = {
  'Professeur':      "Registre d'Identification des Professeurs",
  'Assistant':       "Registre d'Identification des Assistants",
  'Chef de Travaux': "Registre d'Identification des Chefs de Travaux",
};

const SUBTITLE_MAP = {
  'Professeur':      'Corps académique du MINESURSI',
  'Assistant':       'Corps scientifique du MINESURSI',
  'Chef de Travaux': 'Corps scientifique du MINESURSI',
};

const isPrivateEtablissement = (value) => value === 'Privé' || value === 'Établissement Privé';

const formatGradeActuel = (grade) => {
  const gradeLabels = {
    PE: 'Professeur Émérite',
    PO: 'Professeur Ordinaire',
    P: 'Professeur',
    PA: 'Professeur Associé',
    DT: 'Docteur à thèse',
  };

  return gradeLabels[grade] || grade;
};

const normalizeAccountType = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes('assistant')) return 'Assistant';
  if (normalized === 'ct' || normalized.includes('chef')) return 'Chef de Travaux';
  if (normalized.includes('professeur')) return 'Professeur';
  return value;
};

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

const DataRow = ({ label, value }) => (
  <div className="mr-data-row">
    <span className="mr-data-label">{label}</span>
    <span className="mr-data-value">{value || <em className="mr-empty">Non renseigné</em>}</span>
  </div>
);

const FileLink = ({ path }) => {
  if (!path) return <em className="mr-empty">Non fourni</em>;
  const fileName = path.split('/').pop();
  const fullUrl = path.startsWith('http') ? path : `${SERVER_URL}${path}`;
  return (
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="mr-file-link" title={fileName}>
      📄 {fileName}
    </a>
  );
};

const Section = ({ title, children }) => (
  <div className="mr-section">
    <div className="mr-section-header">
      <span>{title}</span>
    </div>
    <div className="mr-section-body">{children}</div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Data display per type
───────────────────────────────────────────────────────────── */

const ProfesseurData = ({ d }) => (
  <>
    <Section title="Informations Personnelles">
      <DataRow label="Nom" value={d.nom} />
      <DataRow label="Postnom" value={d.postnom} />
      <DataRow label="Prénom" value={d.prenom} />
      <DataRow label="Sexe" value={d.sexe === 'M' ? 'Masculin' : d.sexe === 'F' ? 'Féminin' : d.sexe} />
      <DataRow label="Date de naissance" value={d.date_naissance} />
      <DataRow label="Lieu de naissance" value={d.lieu_naissance} />
    </Section>

    <Section title="Informations Administratives">
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Matricule ESU" value={d.matricule_esu} />}
      <DataRow label="Type d'établissement" value={d.type_etablissement === 'Public' ? 'Établissement Public' : d.type_etablissement === 'Privé' ? 'Établissement Privé' : d.type_etablissement} />
      <DataRow label="Grade actuel" value={formatGradeActuel(d.grade_actuel)} />
      <DataRow label="Établissement d'attache" value={d.universite_attache_precisee || d.universite_attache || d.etablissement_attache} />
      <DataRow label="Date d'engagement" value={d.date_engagement} />
      {d.grade_actuel !== 'DT' && <DataRow label="Référence dernier arrêté" value={d.reference_dernier_arrete} />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Prime institutionnelle" value={d.prime_institutionnelle} />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Salaire de base" value={d.salaire_base} />}
      <DataRow label="Domaine de recherche" value={d.domaine_recherche} />
    </Section>

    <Section title="Soutenance & Diplôme">
      {d.type_diplome && <DataRow label="Type de diplôme de Doctorat" value={d.type_diplome} />}
      <DataRow label="Possède diplôme" value={d.possede_diplome} />
      <DataRow label="Numéro arrêté équivalence" value={d.numero_arrete_equivalence} />
      <DataRow label="Type diplôme D.E.A/D.E.S" value={d.type_diplome_dea_des} />
      <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={d.universite_master_dea_ds} />
      <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={d.pays_master_dea_ds} />
      <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={d.date_obtention_master_dea_ds} />
      <DataRow label="Sujet de thèse" value={d.sujet_these} />
      {d.universite_obtention_diplome_doctorat && <DataRow label="Université d'obtention de votre Doctorat" value={d.universite_obtention_diplome_doctorat} />}
      {d.pays_obtention_diplome_doctorat && <DataRow label="Pays d'obtention de votre Doctorat" value={d.pays_obtention_diplome_doctorat} />}
      {d.date_obtention_diplome_doctorat && <DataRow label="Date d'obtention de votre Doctorat" value={d.date_obtention_diplome_doctorat} />}
    </Section>

    <Section title="Commentaires & Confirmation">
      <DataRow label="Commentaire" value={d.commentaire_confirmation || d.commentaires} />
    </Section>

    <Section title="Documents">
      <DataRow label="Photo identité" value={<FileLink path={d.photo_identite} />} />
      {/* <DataRow label="Copie diplôme" value={<FileLink path={d.copie_diplome} />} /> */}
      {/* <DataRow label="Copie arrêté équivalence" value={<FileLink path={d.copie_arrete_equivalence} />} /> */}
      {!d.copie_diplome && <DataRow label="Documents équivalents" value={<FileLink path={d.documents_equivalents} />} />}
      <DataRow label="Charge horaire" value={<FileLink path={d.charge_horaire} />} />
      <DataRow label="Diplôme d'État" value={<FileLink path={d.diplome_etat} />} />
      <DataRow label="Diplôme de Graduat" value={<FileLink path={d.diplome_graduat} />} />
      <DataRow label="Diplôme de Licence" value={<FileLink path={d.diplome_licence} />} />
      <DataRow label="Diplôme Master/D.E.A/D.E.S" value={<FileLink path={d.diplome_master_dea_ds} />} />
      <DataRow label="Diplôme de Doctorat" value={<FileLink path={d.copie_diplome} />} />
    </Section>

    <Section title="Contact">
      <DataRow label="Email" value={d.email} />
      <DataRow label="Téléphone" value={d.telephone} />
    </Section>
  </>
);

const AssistantData = ({ d }) => (
  <>
    <Section title="Informations Personnelles">
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Matricule" value={d.matricule} />}
      <DataRow label="Nom" value={d.nom} />
      <DataRow label="Postnom" value={d.postnom} />
      <DataRow label="Prénom" value={d.prenom} />
      <DataRow label="Sexe" value={d.sexe === 'M' ? 'Masculin' : d.sexe === 'F' ? 'Féminin' : d.sexe} />
      <DataRow label="Date de naissance" value={d.date_naissance} />
      <DataRow label="Lieu de naissance" value={d.lieu_naissance} />
    </Section>

    <Section title="Informations Administratives">
      <DataRow label="Date d'engagement" value={d.date_engagement} />
      <DataRow label="Établissement d'attache" value={d.etablissement_attache} />
      {d.type_etablissement && <DataRow label="Type d'établissement" value={d.type_etablissement === 'Public' ? 'Établissement Public' : d.type_etablissement === 'Privé' ? 'Établissement Privé' : d.type_etablissement} />}
      <DataRow label="Domaine de recherche" value={d.domaine_recherche} />
      <DataRow label="Mandat Assistant" value={d.mandat_assistant} />
      <DataRow label="Type de diplôme Master / D.E.A / D.E.S" value={d.type_diplome} />
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Salaire de base" value={d.salaire_base} />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Prime institutionnelle" value={d.prime_institutionnelle} />}
    </Section>

    <Section title="Inscriptions & Statut">
      <DataRow label="Statut d'apprenant" value={d.statut_apprenant} />
      {d.etablissement_inscription_3cycle && <DataRow label="Établissement inscription 3e cycle" value={d.etablissement_inscription_3cycle} />}
      {d.date_inscription && <DataRow label="Date d'inscription" value={d.date_inscription} />}
    </Section>

    <Section title="Diplômes par niveau">
      <DataRow label="Diplôme d'État" value={<FileLink path={d.diplome_etat} />} />
      <DataRow label="Diplôme de Graduat" value={<FileLink path={d.diplome_graduat} />} />
      <DataRow label="Diplôme de Licence" value={<FileLink path={d.diplome_licence} />} />
      <DataRow label="Diplôme Master/D.E.A/D.E.S" value={<FileLink path={d.diplome_master_dea_ds} />} />
      {d.diplome_master_dea_ds && <>
        {d.universite_master_dea_ds && <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={d.universite_master_dea_ds} />}
        {d.pays_master_dea_ds && <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={d.pays_master_dea_ds} />}
        {d.date_obtention_master_dea_ds && <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={d.date_obtention_master_dea_ds} />}
      </>}
    </Section>

    <Section title="Documents">
      <DataRow label="Photo passeport" value={<FileLink path={d.photo_passeport} />} />
      <DataRow label="Décision de nomination" value={<FileLink path={d.decision_nomination} />} />
      <DataRow label="Décision d'inscription" value={<FileLink path={d.decision_inscription} />} />
      <DataRow label="Charge horaire" value={<FileLink path={d.charge_horaire} />} />
    </Section>

    <Section title="Contact">
      <DataRow label="Email" value={d.email} />
      <DataRow label="Téléphone" value={d.telephone} />
    </Section>
 
    {d.commentaires && (
      <Section title="Commentaires">
        <DataRow label="Commentaires" value={d.commentaires} />
      </Section>
    )}
  </>
);

const ChefTravauxData = ({ d }) => (
  <>
    <Section title="Informations Personnelles">
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Matricule" value={d.matricule} />}
      <DataRow label="Nom" value={d.nom} />
      <DataRow label="Postnom" value={d.postnom} />
      <DataRow label="Prénom" value={d.prenom} />
      <DataRow label="Sexe" value={d.sexe === 'M' ? 'Masculin' : d.sexe === 'F' ? 'Féminin' : d.sexe} />
      <DataRow label="Date de naissance" value={d.date_naissance} />
      <DataRow label="Lieu de naissance" value={d.lieu_naissance} />
    </Section>

    <Section title="Informations Administratives">
      <DataRow label="Date d'engagement" value={d.date_engagement} />
      <DataRow label="Établissement d'attache" value={d.etablissement_attache} />
      <DataRow label="Type d'établissement" value={d.type_etablissement === 'Public' ? 'Établissement Public' : d.type_etablissement === 'Privé' ? 'Établissement Privé' : d.type_etablissement} />
      <DataRow label="Domaine de recherche" value={d.domaine_recherche} />
      <DataRow label="Type de diplôme Master / D.E.A / D.E.S" value={d.type_diplome} />
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Salaire de base" value={d.salaire_base} />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Prime institutionnelle" value={d.prime_institutionnelle} />}
    </Section>

    <Section title="Inscriptions & Statut">
      <DataRow label="Statut d'apprenant" value={d.statut_apprenant} />
      <DataRow label="Date d'inscription" value={d.date_inscription} />
      {d.etablissement_inscription_3cycle && <DataRow label="Établissement inscription 3e cycle" value={d.etablissement_inscription_3cycle} />}
    </Section>

    <Section title="Diplômes par niveau">
      <DataRow label="Diplôme d'État" value={<FileLink path={d.diplome_etat} />} />
      <DataRow label="Diplôme de Graduat" value={<FileLink path={d.diplome_graduat} />} />
      <DataRow label="Diplôme de Licence" value={<FileLink path={d.diplome_licence} />} />
      <DataRow label="Diplôme Master/D.E.A/D.E.S" value={<FileLink path={d.diplome_master_dea_ds} />} />
      {d.diplome_master_dea_ds && <>
        {d.universite_master_dea_ds && <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={d.universite_master_dea_ds} />}
        {d.pays_master_dea_ds && <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={d.pays_master_dea_ds} />}
        {d.date_obtention_master_dea_ds && <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={d.date_obtention_master_dea_ds} />}
      </>}
    </Section>

    <Section title="Documents">
      <DataRow label="Arrêté de nomination" value={<FileLink path={d.arrete_nomination} />} />
      <DataRow label="Photo passeport" value={<FileLink path={d.photo_passeport} />} />
      <DataRow label="Décision d'inscription" value={<FileLink path={d.decision_inscription} />} />
      <DataRow label="Charge horaire" value={<FileLink path={d.charge_horaire} />} />
    </Section>

    <Section title="Contact">
      <DataRow label="Email" value={d.email} />
      <DataRow label="Téléphone" value={d.telephone} />
    </Section>

    {d.commentaires && (
      <Section title="Commentaires">
        <DataRow label="Commentaires" value={d.commentaires} />
      </Section>
    )}
  </>
);

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

const MyRecord = ({ currentUser, onCreateRecord, onEditRecord, onLogout, onUserUpdated }) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'no_record' | 'has_record' | 'error'
  const [record, setRecord] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);

  const accountType = currentUser?.type_de_compte || '';
  const compteId = currentUser?.id || currentUser?.compte_id;
  const normalizedAccountType = normalizeAccountType(accountType);

  // Normaliser le type si le serveur renvoie une casse différente
  const resolvedType = Object.keys(ENDPOINT_MAP).find(
    (k) => k.toLowerCase() === normalizedAccountType.toLowerCase()
  ) || normalizedAccountType;

  // Debug — affiché dans la console du navigateur
  useEffect(() => {
    console.log('[MyRecord] currentUser =', currentUser);
    console.log('[MyRecord] accountType =', accountType, '→ resolvedType =', resolvedType);
    console.log('[MyRecord] compteId =', compteId);
  }, [currentUser, accountType, resolvedType, compteId]);

  const fetchRecord = useCallback(async () => {
    console.log('[MyRecord] fetchRecord — type:', resolvedType, 'id:', compteId);
    if (!compteId) {
      setStatus('no_record'); // pas d'ID → montrer le bouton quand même
      return;
    }

    const endpointFn = ENDPOINT_MAP[resolvedType];
    if (!endpointFn) {
      // Type inconnu → afficher directement le bouton de création sans bloquer
      console.warn('[MyRecord] Type non reconnu, passage direct no_record');
      setStatus('no_record');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    // AbortController compatible avec tous les navigateurs
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    try {
      console.log('[MyRecord] GET', `${SERVER_URL}${endpointFn(compteId)}`);
      const res = await fetch(`${SERVER_URL}${endpointFn(compteId)}`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      console.log('[MyRecord] réponse status:', res.status);

      if (res.status === 404) {
        setRecord(null);
        setStatus('no_record');
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.detail || `Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      setRecord(data);
      setStatus('has_record');
    } catch (e) {
      clearTimeout(timer);
      console.error('[MyRecord] erreur fetch:', e);
      if (e.name === 'AbortError') {
        setErrorMsg('La requête a expiré. Vérifiez votre connexion.');
      } else {
        setErrorMsg(e.message || 'Erreur inattendue.');
      }
      setStatus('error');
    }
  }, [compteId, resolvedType]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const title = TITLE_MAP[resolvedType] || 'Mon Dossier';
  const subtitle = SUBTITLE_MAP[resolvedType] || 'MINESURSI';
  const migrationTarget = MIGRATION_TARGET_MAP[resolvedType];
  const migrationTargetLabel = migrationTarget === 'Professeur' ? 'Professeur' : 'Chef de Travaux';
  const confettiPieces = Array.from({ length: 34 }, (_, index) => index);

  useEffect(() => {
    if (!celebration) return undefined;

    const timer = setTimeout(() => {
      setCelebration(null);
    }, 4200);

    return () => clearTimeout(timer);
  }, [celebration]);

  const handleMigration = async () => {
    if (!compteId || !migrationTarget) return;

    setMigrationLoading(true);
    setMigrationMessage('');
    setMigrationError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      const response = await fetch(`${SERVER_URL}/api/enseignants/comptes/${compteId}/migrer/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type_de_compte: migrationTarget }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Migration refusée : votre session a expiré ou le token est absent. Veuillez vous reconnecter puis réessayer.');
        }
        const apiError = data.errors?.type_de_compte || data.message || `Migration refusée (${response.status}).`;
        throw new Error(apiError);
      }

      const updatedUser = {
        ...currentUser,
        ...(data.compte || {}),
        type_de_compte: data.compte?.type_de_compte || migrationTarget,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('user_email', updatedUser.email || '');
      if (typeof onUserUpdated === 'function') onUserUpdated(updatedUser);

      setRecord(null);
      setStatus('no_record');
      setMigrationMessage(data.message || `Compte migré avec succès vers ${migrationTarget}.`);
      setCelebration({
        grade: migrationTargetLabel,
        message: `Félicitations ! Votre migration vers le grade de ${migrationTargetLabel} a été validée avec succès.`,
      });
      setShowMigrationModal(false);
    } catch (error) {
      setMigrationError(error.message || 'Impossible de migrer ce compte.');
    } finally {
      setMigrationLoading(false);
    }
  };

  const openMigrationModal = () => {
    setMigrationMessage('');
    setMigrationError('');
    setShowMigrationModal(true);
  };

  const renderData = () => {
    if (!record) return null;
    if (resolvedType === 'Professeur')      return <ProfesseurData d={record} />;
    if (resolvedType === 'Assistant')       return <AssistantData d={record} />;
    if (resolvedType === 'Chef de Travaux') return <ChefTravauxData d={record} />;
    return null;
  };

  return (
    <div className="my-record-page">
      {/* ── Header ── */}
      <header className="mr-header">
        <div className="mr-header-left">
          <img src="/app-logo.png" alt="Logo MINESURSI" className="mr-logo" />
          <div className="mr-header-titles">
            <h1 className="mr-title">{title}</h1>
            <p className="mr-subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="mr-header-right">
          {currentUser && (
            <button
              type="button"
              className="mr-user-btn"
              onClick={() => setShowProfileSidebar(true)}
              title="Mon profil"
            >
              <UserInfo user={currentUser} />
            </button>
          )}
          <a
            href="/guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-guide-btn"
            title="Consulter le guide d'utilisation"
          >
            Guide
          </a>
          <button type="button" className="mr-logout-btn" onClick={onLogout} title="Se déconnecter">
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mr-main">

        {/* Loading */}
        {status === 'loading' && (
          <div className="mr-state-card mr-loading">
            <div className="mr-spinner" />
            <p>Chargement de votre dossier…</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="mr-state-card mr-error">
            <FaFileAlt className="mr-state-icon" />
            <h2>Une erreur est survenue</h2>
            <p className="mr-error-msg">{errorMsg}</p>
            <div className="mr-state-actions">
              <button type="button" className="mr-btn mr-btn-secondary" onClick={fetchRecord}>
                <FaSync /> Réessayer
              </button>
            </div>
          </div>
        )}

        {/* No record */}
        {status === 'no_record' && (
          <div className="mr-state-card mr-no-record">
            <FaFileAlt className="mr-state-icon mr-state-icon--empty" />
            <h2>Aucun dossier trouvé</h2>
            <p>
              Vous n'avez pas encore de dossier enregistré en tant que{' '}
              <strong>{resolvedType || accountType}</strong>.
            </p>
            <div className="mr-state-actions">
              {migrationTarget && compteId && (
                <button
                  type="button"
                  className="mr-btn mr-btn-migrate"
                  onClick={openMigrationModal}
                  disabled={migrationLoading}
                >
                  {migrationLoading ? 'Migration...' : `Migrer vers ${migrationTarget}`}
                </button>
              )}
              <button
                type="button"
                className="mr-btn mr-btn-primary mr-btn-create"
                onClick={() => onCreateRecord(TYPE_MAP[resolvedType] || resolvedType || accountType)}
              >
                <FaPlusCircle /> Créer mon dossier
              </button>
            </div>
            {migrationMessage && <div className="mr-alert mr-alert-success">{migrationMessage}</div>}
            {migrationError && <div className="mr-alert mr-alert-error">{migrationError}</div>}
          </div>
        )}

        {/* Has record */}
        {status === 'has_record' && record && (
          <div className="mr-record-wrapper">
            <div className="mr-record-topbar">
              <div className="mr-record-topbar-info">
                <FaUser className="mr-record-type-icon" />
                <span className="mr-record-type-label">{resolvedType || accountType}</span>
                {!isPrivateEtablissement(record.type_etablissement) && (record.matricule || record.matricule_esu) && (
                  <span className="mr-record-matricule">
                    Matricule : <strong>{record.matricule || record.matricule_esu}</strong>
                  </span>
                )}
              </div>
              <div className="mr-record-topbar-actions">
                {migrationTarget && (
                  <button
                    type="button"
                    className="mr-btn mr-btn-migrate"
                    onClick={openMigrationModal}
                    disabled={migrationLoading}
                  >
                    {migrationLoading ? 'Migration...' : `Migrer vers ${migrationTarget}`}
                  </button>
                )}
                <button
                  type="button"
                  className="mr-btn mr-btn-secondary"
                  onClick={fetchRecord}
                  title="Actualiser"
                >
                  <FaSync />
                </button>
                <button
                  type="button"
                  className="mr-btn mr-btn-primary"
                  onClick={() => onEditRecord(record, TYPE_MAP[resolvedType] || resolvedType)}
                >
                  <FaEdit /> Modifier mon dossier
                </button>
              </div>
            </div>

            {migrationMessage && <div className="mr-alert mr-alert-success">{migrationMessage}</div>}
            {migrationError && <div className="mr-alert mr-alert-error">{migrationError}</div>}

            <div className="mr-record-content">
              {renderData()}
            </div>

            {record.created_at && (
              <p className="mr-record-meta">
                Dossier créé le {new Date(record.created_at).toLocaleDateString('fr-FR')}
                {record.updated_at && ` · Mis à jour le ${new Date(record.updated_at).toLocaleDateString('fr-FR')}`}
              </p>
            )}
          </div>
        )}
      </main>

      {/* Profile Sidebar */}
      <ProfileSidebar
        isOpen={showProfileSidebar}
        onClose={() => setShowProfileSidebar(false)}
        user={currentUser}
        onViewMyRecord={null}
        onLogout={onLogout}
      />

      {showMigrationModal && migrationTarget && (
        <div className="mr-modal-overlay" role="presentation" onClick={() => !migrationLoading && setShowMigrationModal(false)}>
          <div className="mr-modal mr-migration-modal" role="dialog" aria-modal="true" aria-labelledby="migration-modal-title" onClick={(e) => e.stopPropagation()}>
            <div className="mr-modal-header">
              <span className="mr-modal-warning-icon" aria-hidden="true">
                <FaExclamationTriangle />
              </span>
              <div>
                <h2 id="migration-modal-title">Attention</h2>
                <p>Migration vers le grade de {migrationTargetLabel}</p>
              </div>
            </div>
            <div className="mr-modal-body">
              <p>
                En validant cette migration vers le grade de <strong>{migrationTargetLabel}</strong>, vous confirmez officiellement votre changement de statut académique.
              </p>
              <p>
                Vous serez désormais tenu de compléter et de fournir toutes les informations ainsi que les pièces requises en qualité de {migrationTargetLabel}, sans aucune erreur administrative.
              </p>
              <p>
                Cette action est définitive et ne pourra pas être annulée. Vous n'aurez plus la possibilité de revenir au statut précédent.
              </p>
              {migrationError && <div className="mr-alert mr-alert-error">{migrationError}</div>}
            </div>
            <div className="mr-modal-footer">
              <button
                type="button"
                className="mr-btn mr-btn-secondary"
                onClick={() => setShowMigrationModal(false)}
                disabled={migrationLoading}
              >
                Annuler
              </button>
              <button
                type="button"
                className="mr-btn mr-btn-migrate"
                onClick={handleMigration}
                disabled={migrationLoading}
              >
                {migrationLoading ? 'Migration...' : `Valider la migration`}
              </button>
            </div>
          </div>
        </div>
      )}

      {celebration && (
        <div className="mr-celebration" aria-live="polite">
          <div className="mr-confetti-field" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span
                key={piece}
                className="mr-confetti-piece"
                style={{
                  '--x': `${(piece * 29) % 100}vw`,
                  '--delay': `${(piece % 9) * 0.08}s`,
                  '--duration': `${2.4 + (piece % 5) * 0.18}s`,
                  '--rotate': `${(piece * 47) % 360}deg`,
                  '--color-index': piece % 5,
                }}
              />
            ))}
          </div>
          <div className="mr-celebration-card">
            <span className="mr-celebration-mark" aria-hidden="true">✓</span>
            <p>{celebration.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRecord;
