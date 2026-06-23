import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FaUser, FaFileAlt, FaEdit, FaPlusCircle, FaSync,
  FaSignOutAlt, FaExclamationTriangle, FaComments, FaUserShield,
  FaSearch, FaPaperclip, FaPaperPlane, FaTimes, FaDownload,
  FaEye, FaCheck, FaCheckDouble,
} from 'react-icons/fa';
import { SERVER_URL } from '../config';
import ProfileSidebar from './ProfileSidebar';
import UserInfo from './UserInfo';
import { getTimeoutSignal } from '../utils/timeoutSignal';
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
  'Assistant': ['Chef de Travaux', 'Professeur'],
  'Chef de Travaux': ['Professeur'],
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
const MIGRATED_MATRICULE_KEY = 'migrated-matricule';

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

const formatCategorieAssistant = (category) => {
  const categoryLabels = {
    Academique: 'Assistant Académique',
    Recherche: 'Assistant de Recherche',
  };

  return categoryLabels[category] || category;
};

const isAssistantRecherche = (category = '') => {
  const normalized = String(category).trim().toLowerCase();
  return normalized === 'recherche' || normalized === 'assistant de recherche';
};

const shouldShowThirdCycleInfo = (d = {}) => (
  !d.diplome_master_dea_ds &&
  Boolean(d.etablissement_inscription_3cycle || d.decision_inscription || d.date_inscription || d.statut_apprenant)
);

const normalizeAccountType = (value = '') => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes('assistant')) return 'Assistant';
  if (normalized === 'ct' || normalized.includes('chef')) return 'Chef de Travaux';
  if (normalized.includes('professeur')) return 'Professeur';
  return value;
};

const MESSAGING_ALLOWED_TYPES = ['Assistant', 'Chef de Travaux', 'Professeur'];
const MAX_MESSAGE_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MESSAGE_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'txt'];

const asArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getEntityId = (item) => {
  const source = item || {};
  return source.id || source.admin_id || source.compte_id || source.pk || source.utilisateur_id;
};

const getFullName = (item) => {
  const source = item || {};
  const directName = source.full_name || source.nom_complet || source.name || source.username;
  if (directName) return directName;
  return [source.nom, source.postnom, source.prenom].filter(Boolean).join(' ') || source.email || 'Administrateur';
};

const getAccountType = (item) => {
  const source = item || {};
  return source.type_de_compte || source.type_compte || source.account_type || source.role || 'Administrateur';
};

const getConversationId = (conversation) => {
  const source = conversation || {};
  return (
    source.id ||
    source.conversation_id ||
    source.id_conversation ||
    source.conversationId ||
    source.pk ||
    source.conversation?.id ||
    source.conversation?.conversation_id ||
    source.data?.id ||
    source.data?.conversation_id
  );
};

const normalizeConversationPayload = (payload) => (
  payload?.conversation ||
  payload?.data?.conversation ||
  payload?.data ||
  payload?.result ||
  payload
);

const getUnreadConversationCount = (conversation, currentCompteId) => {
  const source = conversation || {};
  const numericCount = (
    source.unread_count ??
    source.unread_messages_count ??
    source.messages_non_lus ??
    source.non_lus ??
    source.nombre_non_lus ??
    source.nouveaux_messages ??
    source.nb_nouveaux_messages ??
    source.unread
  );

  if (Number(numericCount) > 0) return Number(numericCount);

  if (
    source.has_unread ||
    source.a_des_messages_non_lus ||
    source.nouveau_message ||
    source.has_new_message
  ) {
    return 1;
  }

  const lastMessage = source.dernier_message || source.last_message || source.latest_message;
  const lastMessageStatus = String(lastMessage?.statut || lastMessage?.status || lastMessage?.etat || '').toLowerCase();
  const lastMessageRead = (
    lastMessage?.lu ||
    lastMessage?.is_read ||
    lastMessage?.read ||
    lastMessageStatus.includes('lu') ||
    lastMessageStatus.includes('read')
  );

  if (lastMessage && !isOwnMessage(lastMessage, currentCompteId) && !lastMessageRead) {
    return 1;
  }

  return 0;
};

const getMessageId = (message) => {
  const source = message || {};
  return source.id || source.message_id || source.pk;
};

const getMessageText = (message) => {
  const source = message || {};
  return source.contenu || source.content || source.message || source.texte || '';
};

const getMessageDate = (message) => {
  const source = message || {};
  return source.created_at || source.date_envoi || source.envoye_le || source.timestamp || source.updated_at;
};

const formatMessageTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const getMessageStatus = (message) => {
  const source = message || {};
  const rawStatus = String(source.statut || source.status || source.etat || '').toLowerCase();
  if (source.lu || rawStatus.includes('lu') || rawStatus.includes('read')) return 'lu';
  if (source.recu || rawStatus.includes('reçu') || rawStatus.includes('recu') || rawStatus.includes('delivered')) return 'reçu';
  return rawStatus || 'envoyé';
};

const hasAttachment = (message) => {
  const source = message || {};
  return Boolean(source.piece_jointe || source.attachment || source.fichier || source.file || source.nom_fichier || source.file_name);
};

const getAttachmentName = (message) => {
  const source = message || {};
  const path = source.piece_jointe || source.attachment || source.fichier || source.file || '';
  return source.nom_fichier || source.file_name || source.filename || String(path).split('/').pop() || 'Pièce jointe';
};

const isOwnMessage = (message, compteId) => {
  const source = message || {};
  if (source.is_mine !== undefined) return Boolean(source.is_mine);
  if (source.est_moi !== undefined) return Boolean(source.est_moi);

  const possibleSenderId = (
    source.expediteur_id || source.sender_id || source.auteur_id ||
    source.compte_id || source.current_compte_id || source.expediteur?.id ||
    source.sender?.id || source.auteur?.id
  );

  if (possibleSenderId && compteId) {
    return String(possibleSenderId) === String(compteId);
  }

  const senderType = String(
    source.expediteur_type || source.sender_type || source.auteur_type ||
    source.expediteur?.type_de_compte || ''
  ).toLowerCase();

  return senderType && !senderType.includes('admin');
};

const StatusIcon = ({ status }) => {
  if (status === 'lu') return <FaCheckDouble className="mr-message-status-icon mr-message-status-icon--read" />;
  if (status === 'reçu') return <FaCheckDouble className="mr-message-status-icon" />;
  return <FaCheck className="mr-message-status-icon" />;
};

/* ─────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────── */

const isEmptyDisplayValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;

  const normalized = value.trim().toLowerCase();
  return (
    normalized === '' ||
    normalized === 'non renseigné' ||
    normalized === 'non renseigne' ||
    normalized === 'non fourni' ||
    normalized === 'aucun commentaire' ||
    normalized === 'null' ||
    normalized === 'undefined' ||
    normalized === 'n/a' ||
    normalized === 'na'
  );
};

const DataRow = ({ label, value, hideEmpty = true }) => {
  if (hideEmpty && isEmptyDisplayValue(value)) return null;

  return (
    <div className="mr-data-row">
      <span className="mr-data-label">{label}</span>
      <span className="mr-data-value">{value}</span>
    </div>
  );
};

const FileLink = ({ path }) => {
  if (isEmptyDisplayValue(path)) return null;
  const fileName = path.split('/').pop();
  const fullUrl = path.startsWith('http') ? path : `${SERVER_URL}${path}`;
  return (
    <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="mr-file-link" title={fileName}>
      📄 {fileName}
    </a>
  );
};

const FileRow = ({ label, path }) => {
  if (isEmptyDisplayValue(path)) return null;
  return <DataRow label={label} value={<FileLink path={path} />} />;
};

const Section = ({ title, children }) => (
  <div className="mr-section">
    <div className="mr-section-header">
      <span>{title}</span>
    </div>
    <div className="mr-section-body">{children}</div>
  </div>
);

const MessagingPanel = ({ compteId, resolvedType, onBack, onUnreadChange }) => {
  const [admins, setAdmins] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messagingError, setMessagingError] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef([]);

  const canUseMessaging = MESSAGING_ALLOWED_TYPES.includes(resolvedType);

  const requestJson = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      signal: getTimeoutSignal(options.timeout || 30000),
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || payload.message || payload.error || `Erreur serveur (${response.status})`);
    }
    return payload;
  }, []);

  const fetchAdmins = useCallback(async () => {
    if (!canUseMessaging) return;
    setLoadingAdmins(true);
    setMessagingError('');
    try {
      const data = await requestJson('/api/enseignants/messagerie/admins/');
      setAdmins(asArray(data, ['admins', 'administrateurs']));
    } catch (error) {
      setMessagingError(error.message || 'Impossible de charger les administrateurs.');
    } finally {
      setLoadingAdmins(false);
    }
  }, [canUseMessaging, requestJson]);

  const fetchConversations = useCallback(async () => {
    if (!canUseMessaging || !compteId) return;
    setLoadingConversations(true);
    try {
      const data = await requestJson(`/api/enseignants/messagerie/conversations/?current_compte_id=${encodeURIComponent(compteId)}`);
      const nextConversations = asArray(data, ['conversations']);
      setConversations(nextConversations);
      if (typeof onUnreadChange === 'function') {
        onUnreadChange(nextConversations.reduce((total, conversation) => total + getUnreadConversationCount(conversation, compteId), 0));
      }
    } catch (error) {
      setMessagingError(error.message || 'Impossible de charger vos conversations.');
    } finally {
      setLoadingConversations(false);
    }
  }, [canUseMessaging, compteId, onUnreadChange, requestJson]);

  const markConversationRead = useCallback(async (conversationId) => {
    if (!conversationId || !compteId) return;
    try {
      await requestJson(`/api/enseignants/messagerie/conversations/${conversationId}/mark-read/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_compte_id: compteId }),
      });
    } catch (error) {
      console.warn('[Messaging] mark-read failed:', error);
    }
  }, [compteId, requestJson]);

  const loadMessages = useCallback(async (conversation) => {
    const conversationId = getConversationId(conversation);
    if (!conversationId || !compteId) return;

    setLoadingMessages(true);
    setMessagingError('');
    try {
      const data = await requestJson(`/api/enseignants/messagerie/conversations/${conversationId}/messages/?current_compte_id=${encodeURIComponent(compteId)}`);
      const nextMessages = asArray(data, ['messages']);
      setMessages(nextMessages);
      await markConversationRead(conversationId);
    } catch (error) {
      setMessagingError(error.message || 'Impossible de charger les messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [compteId, markConversationRead, requestJson]);

  const fetchNewMessages = useCallback(async () => {
    const conversationId = getConversationId(selectedConversation);
    if (!conversationId || !compteId) return;

    const currentMessages = messagesRef.current;
    const lastMessageId = currentMessages.length ? getMessageId(currentMessages[currentMessages.length - 1]) : null;
    if (!lastMessageId) return;

    try {
      const data = await requestJson(`/api/enseignants/messagerie/conversations/${conversationId}/messages/?current_compte_id=${encodeURIComponent(compteId)}&after_id=${encodeURIComponent(lastMessageId)}`);
      const freshMessages = asArray(data, ['messages']);
      if (freshMessages.length) {
        setMessages((previousMessages) => {
          const knownIds = new Set(previousMessages.map((message) => String(getMessageId(message))));
          return [
            ...previousMessages,
            ...freshMessages.filter((message) => !knownIds.has(String(getMessageId(message)))),
          ];
        });
        await markConversationRead(conversationId);
      }
    } catch (error) {
      console.warn('[Messaging] refresh failed:', error);
    }
  }, [compteId, markConversationRead, requestJson, selectedConversation]);

  useEffect(() => {
    messagesRef.current = messages;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    fetchAdmins();
    fetchConversations();
  }, [fetchAdmins, fetchConversations]);

  useEffect(() => {
    if (!selectedConversation) return undefined;
    const interval = setInterval(fetchNewMessages, 6000);
    return () => clearInterval(interval);
  }, [fetchNewMessages, selectedConversation]);

  const filteredAdmins = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return admins;
    return admins.filter((admin) => {
      const haystack = [
        getFullName(admin),
        getAccountType(admin),
        admin.email,
        admin.telephone,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [admins, searchTerm]);

  const selectedAdminInfo = selectedAdmin || selectedConversation?.admin || selectedConversation?.administrateur || {};

  const createOrGetConversation = useCallback(async (admin) => {
    if (!compteId) {
      throw new Error('Compte connecté introuvable. Veuillez vous reconnecter.');
    }

    const adminId = getEntityId(admin);
    if (!adminId) {
      throw new Error('Administrateur introuvable. Veuillez choisir un administrateur valide.');
    }

    const data = await requestJson('/api/enseignants/messagerie/conversations/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_compte_id: compteId,
        admin_id: adminId,
      }),
    });
    const conversation = normalizeConversationPayload(data);

    if (!getConversationId(conversation)) {
      throw new Error('Conversation introuvable après sélection de l’administrateur.');
    }

    return conversation;
  }, [compteId, requestJson]);

  const handleOpenConversation = async (admin) => {
    if (!compteId) {
      setMessagingError('Compte connecté introuvable. Veuillez vous reconnecter.');
      return;
    }

    setSelectedAdmin(admin);
    setSelectedConversation(null);
    setMessages([]);
    setLoadingMessages(true);
    setMessagingError('');

    try {
      const conversation = await createOrGetConversation(admin);
      setSelectedConversation(conversation);
      await loadMessages(conversation);
      fetchConversations();
    } catch (error) {
      setMessagingError(error.message || 'Impossible d’ouvrir cette conversation.');
      setLoadingMessages(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_MESSAGE_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setFileError('Format non accepté. Fichiers autorisés : pdf, doc, docx, xls, xlsx, png, jpg, jpeg, gif, txt.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_MESSAGE_FILE_SIZE) {
      setSelectedFile(null);
      setFileError('La pièce jointe ne doit pas dépasser 20 MB.');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleComposerSubmit = (event) => {
    event.preventDefault();
  };

  const handleSendMessage = async () => {
    let activeConversation = selectedConversation;
    let conversationId = getConversationId(activeConversation);
    const trimmedText = messageText.trim();

    if (!selectedAdmin && !conversationId) {
      setMessagingError('Sélectionnez un administrateur dans la liste avant d’envoyer un message.');
      return;
    }

    if (!trimmedText && !selectedFile) {
      setFileError('Écrivez un message ou joignez un fichier avant l’envoi.');
      return;
    }

    setSendingMessage(true);
    setMessagingError('');
    setFileError('');

    try {
      if (!conversationId && selectedAdmin) {
        activeConversation = await createOrGetConversation(selectedAdmin);
        conversationId = getConversationId(activeConversation);
        setSelectedConversation(activeConversation);
      }

      if (!conversationId || !compteId) {
        throw new Error('Conversation indisponible. Ouvrez l’administrateur puis réessayez.');
      }

      let data;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('current_compte_id', compteId);
        formData.append('contenu', trimmedText);
        formData.append('piece_jointe', selectedFile);
        data = await requestJson(`/api/enseignants/messagerie/conversations/${conversationId}/messages/`, {
          method: 'POST',
          body: formData,
          timeout: 240000,
        });
      } else {
        data = await requestJson(`/api/enseignants/messagerie/conversations/${conversationId}/messages/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_compte_id: compteId,
            contenu: trimmedText,
          }),
        });
      }

      const sentMessage = data.message || data;
      setMessages((previousMessages) => [...previousMessages, sentMessage]);
      setMessageText('');
      removeSelectedFile();
    } catch (error) {
      setMessagingError(error.message || 'Impossible d’envoyer le message.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!canUseMessaging) {
    return (
      <section className="mr-messaging mr-messaging--locked">
        <div className="mr-messaging-locked-card">
          <FaComments />
          <div>
            <h2>Messagerie indisponible</h2>
            <p>Cette messagerie est réservée aux comptes Assistant, Chef de Travaux et Professeur.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mr-messaging" aria-label="Messagerie administrateur">
      <div className="mr-messaging-sidebar">
        <div className="mr-messaging-sidebar-header">
          <div>
            <span className="mr-kicker">Messagerie</span>
            <h2>Administrateurs</h2>
            <p>{conversations.length} conversation{conversations.length > 1 ? 's' : ''}</p>
          </div>
          <div className="mr-messaging-sidebar-actions">
            {(loadingAdmins || loadingConversations) && <span className="mr-mini-loader" aria-label="Chargement" />}
            <button type="button" className="mr-chat-back-btn" onClick={onBack}>
              Retour
            </button>
          </div>
        </div>

        <label className="mr-admin-search">
          <FaSearch />
          <input
            type="search"
            placeholder="Rechercher un administrateur"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </label>

        {messagingError && <div className="mr-chat-error">{messagingError}</div>}

        <div className="mr-admin-list">
          {loadingAdmins && !admins.length ? (
            <div className="mr-chat-placeholder">Chargement des administrateurs...</div>
          ) : filteredAdmins.length ? (
            filteredAdmins.map((admin) => {
              const adminId = getEntityId(admin);
              const isActive = adminId && getEntityId(selectedAdmin) === adminId;
              return (
                <button
                  key={adminId || getFullName(admin)}
                  type="button"
                  className={`mr-admin-card ${isActive ? 'mr-admin-card--active' : ''}`}
                  onClick={() => handleOpenConversation(admin)}
                >
                  <span className="mr-admin-avatar"><FaUserShield /></span>
                  <span className="mr-admin-main">
                    <strong>{getFullName(admin)}</strong>
                    <small>{getAccountType(admin)}</small>
                  </span>
                  <span className="mr-admin-action">Ouvrir</span>
                </button>
              );
            })
          ) : (
            <div className="mr-chat-placeholder">Aucun administrateur trouvé.</div>
          )}
        </div>
      </div>

      <div className="mr-chat-panel">
        {selectedAdminInfo && getFullName(selectedAdminInfo) !== 'Administrateur' ? (
          <>
            <div className="mr-chat-header">
              <div className="mr-chat-header-main">
                <span className="mr-chat-avatar"><FaUserShield /></span>
                <div>
                  <h2>{getFullName(selectedAdminInfo)}</h2>
                  <p>{selectedAdminInfo.email || 'Email non renseigné'}</p>
                </div>
              </div>
              <div className="mr-chat-header-meta">
                <span>{selectedAdminInfo.telephone || selectedAdminInfo.phone || 'Téléphone non renseigné'}</span>
                <strong>{selectedAdminInfo.statut_compte || selectedAdminInfo.status || 'Statut non renseigné'}</strong>
              </div>
            </div>

            <div className="mr-message-list">
              {loadingMessages ? (
                <div className="mr-chat-loading">
                  <span className="mr-spinner" />
                  <p>Chargement des messages...</p>
                </div>
              ) : messages.length ? (
                messages.map((message) => {
                  const own = isOwnMessage(message, compteId);
                  const status = getMessageStatus(message);
                  const attachmentUrl = `${SERVER_URL}/api/enseignants/messagerie/messages/${getMessageId(message)}/piece-jointe/?current_compte_id=${encodeURIComponent(compteId)}`;
                  return (
                    <div key={getMessageId(message)} className={`mr-message-row ${own ? 'mr-message-row--own' : 'mr-message-row--received'}`}>
                      <div className="mr-message-bubble">
                        {getMessageText(message) && <p>{getMessageText(message)}</p>}
                        {hasAttachment(message) && (
                          <div className="mr-attachment">
                            <FaFileAlt />
                            <span>{getAttachmentName(message)}</span>
                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" title="Afficher">
                              <FaEye />
                            </a>
                            <a href={attachmentUrl} download title="Télécharger">
                              <FaDownload />
                            </a>
                          </div>
                        )}
                        <span className="mr-message-meta">
                          {formatMessageTime(getMessageDate(message))}
                          {own && (
                            <>
                              <StatusIcon status={status} />
                              {status}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="mr-chat-empty">
                  <FaComments />
                  <p>Commencez la conversation avec l’administrateur sélectionné.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="mr-message-composer" onSubmit={handleComposerSubmit}>
              {selectedFile && (
                <div className="mr-file-preview">
                  <FaFileAlt />
                  <span>{selectedFile.name}</span>
                  <small>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</small>
                  <button type="button" onClick={removeSelectedFile} title="Retirer le fichier">
                    <FaTimes />
                  </button>
                </div>
              )}
              {fileError && <div className="mr-chat-error">{fileError}</div>}
              <div className="mr-composer-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="mr-file-input"
                  accept={ALLOWED_MESSAGE_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="mr-icon-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                >
                  <FaPaperclip />
                </button>
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Écrire un message..."
                  rows={1}
                />
                <button
                  type="button"
                  className="mr-send-btn"
                  onClick={handleSendMessage}
                  disabled={sendingMessage || (!messageText.trim() && !selectedFile)}
                  title="Envoyer"
                >
                  {sendingMessage ? <span className="mr-mini-loader mr-mini-loader--light" /> : <FaPaperPlane />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="mr-chat-welcome">
            <FaComments />
            <h2>Choisissez un administrateur</h2>
            <p>Sélectionnez un administrateur à gauche pour démarrer ou reprendre une conversation.</p>
          </div>
        )}
      </div>
    </section>
  );
};

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
      <DataRow label="Qualité ou Grade Académique" value={formatGradeActuel(d.grade_actuel)} />
      <DataRow label="Établissement d'attache" value={d.universite_attache_precisee || d.universite_attache || d.etablissement_attache} />
      <DataRow label="Date d'engagement" value={d.date_engagement} />
      {d.grade_actuel !== 'DT' && <DataRow label="Référence dernier arrêté" value={d.reference_dernier_arrete} />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Prime institutionnelle" value={d.prime_institutionnelle} />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Salaire de base" value={d.salaire_base} />}
      <DataRow label="Domaine de recherche" value={d.domaine_recherche} />
    </Section>

    <Section title="Soutenance & Diplôme">
      <DataRow label="Type de diplôme de Doctorat" value={d.type_diplome} />
      <DataRow label="Numéro arrêté équivalence" value={d.numero_arrete_equivalence} />
      <DataRow label="Type de diplôme Master / D.E.A / D.E.S" value={d.type_diplome_dea_des} hideEmpty />
      <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={d.universite_master_dea_ds} />
      <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={d.pays_master_dea_ds} />
      <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={d.date_obtention_master_dea_ds} />
      <DataRow label="Sujet de thèse" value={d.sujet_these} />
      {d.universite_obtention_diplome_doctorat && <DataRow label="Université d'obtention de votre Doctorat" value={d.universite_obtention_diplome_doctorat} />}
      {d.pays_obtention_diplome_doctorat && <DataRow label="Pays d'obtention de votre Doctorat" value={d.pays_obtention_diplome_doctorat} />}
      {d.date_obtention_diplome_doctorat && <DataRow label="Date d'obtention de votre Doctorat" value={d.date_obtention_diplome_doctorat} />}
    </Section>

    {!isEmptyDisplayValue(d.commentaire_confirmation || d.commentaires) && (
      <Section title="Commentaires & Confirmation">
        <DataRow label="Commentaire" value={d.commentaire_confirmation || d.commentaires} />
      </Section>
    )}

    <Section title="Documents">
      <FileRow label="Photo Passeport" path={d.photo_identite} />
      {/* <DataRow label="Copie diplôme" value={<FileLink path={d.copie_diplome} />} /> */}
      {/* <DataRow label="Copie arrêté équivalence" value={<FileLink path={d.copie_arrete_equivalence} />} /> */}
      {isEmptyDisplayValue(d.copie_diplome) && <FileRow label="Documents équivalents" path={d.documents_equivalents} />}
      <FileRow label="Charge horaire" path={d.charge_horaire} />
      <FileRow label="Diplôme d'État" path={d.diplome_etat} />
      <FileRow label="Diplôme de Graduat" path={d.diplome_graduat} />
      <FileRow label="Diplôme de Licence" path={d.diplome_licence} />
      <FileRow label="Diplôme Master/D.E.A/D.E.S" path={d.diplome_master_dea_ds} />
      <FileRow label="Diplôme de Doctorat" path={d.copie_diplome} />
    </Section>

  </>
);

const AssistantData = ({ d }) => (
  <>
    <Section title="Informations Personnelles">
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Matricule" value={d.matricule} hideEmpty />}
      <DataRow label="Nom" value={d.nom} hideEmpty />
      <DataRow label="Postnom" value={d.postnom} hideEmpty />
      <DataRow label="Prénom" value={d.prenom} hideEmpty />
      <DataRow label="Sexe" value={d.sexe === 'M' ? 'Masculin' : d.sexe === 'F' ? 'Féminin' : d.sexe} hideEmpty />
      <DataRow label="Date de naissance" value={d.date_naissance} hideEmpty />
      <DataRow label="Lieu de naissance" value={d.lieu_naissance} hideEmpty />
    </Section>

    <Section title="Informations Administratives">
      <DataRow label="Date d'engagement" value={d.date_engagement} hideEmpty />
      <DataRow label="Établissement d'attache" value={d.etablissement_attache} hideEmpty />
      {d.type_etablissement && <DataRow label="Type d'établissement" value={d.type_etablissement === 'Public' ? 'Établissement Public' : d.type_etablissement === 'Privé' ? 'Établissement Privé' : d.type_etablissement} hideEmpty />}
      <DataRow label="Domaine de recherche" value={d.domaine_recherche} hideEmpty />
      <DataRow label="Mandat Assistant" value={d.mandat_assistant} hideEmpty />
      <DataRow label="Catégorie d'Assistant" value={formatCategorieAssistant(d.categorie_assistant)} hideEmpty />
      {isAssistantRecherche(d.categorie_assistant) && (
        <DataRow label="Centre de recherche" value={d.centre_laboratoire_recherche} hideEmpty />
      )}
      <DataRow label="Type de diplôme Master / D.E.A / D.E.S" value={d.type_diplome} hideEmpty />
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Salaire de base" value={d.salaire_base} hideEmpty />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Prime institutionnelle" value={d.prime_institutionnelle} hideEmpty />}
    </Section>

    {shouldShowThirdCycleInfo(d) && (
      <Section title="Inscriptions & Statut">
        <DataRow label="Établissement inscription 3e cycle" value={d.etablissement_inscription_3cycle} hideEmpty />
        <DataRow label="Date d'inscription" value={d.date_inscription} hideEmpty />
        <DataRow label="Statut d'apprenant" value={d.statut_apprenant} hideEmpty />
      </Section>
    )}

    <Section title="Diplômes par niveau">
      <FileRow label="Diplôme d'État" path={d.diplome_etat} />
      <FileRow label="Diplôme de Graduat" path={d.diplome_graduat} />
      <FileRow label="Diplôme de Licence" path={d.diplome_licence} />
      <FileRow label="Diplôme Master/D.E.A/D.E.S" path={d.diplome_master_dea_ds} />
      {d.diplome_master_dea_ds && <>
        <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={d.universite_master_dea_ds} hideEmpty />
        <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={d.pays_master_dea_ds} hideEmpty />
        <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={d.date_obtention_master_dea_ds} hideEmpty />
      </>}
    </Section>

    <Section title="Documents">
      <FileRow label="Photo passeport" path={d.photo_passeport} />
      <FileRow label="Décision de nomination" path={d.decision_nomination} />
      {shouldShowThirdCycleInfo(d) && (
        <FileRow label="Décision d'inscription" path={d.decision_inscription} />
      )}
      {!isAssistantRecherche(d.categorie_assistant) && (
        <FileRow label="Charge horaire" path={d.charge_horaire} />
      )}
    </Section>

    {!isEmptyDisplayValue(d.commentaires) && (
      <Section title="Commentaires">
        <DataRow label="Commentaires" value={d.commentaires} hideEmpty />
      </Section>
    )}
  </>
);

const ChefTravauxData = ({ d }) => (
  <>
    <Section title="Informations Personnelles">
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Matricule" value={d.matricule} hideEmpty />}
      <DataRow label="Nom" value={d.nom} hideEmpty />
      <DataRow label="Postnom" value={d.postnom} hideEmpty />
      <DataRow label="Prénom" value={d.prenom} hideEmpty />
      <DataRow label="Sexe" value={d.sexe === 'M' ? 'Masculin' : d.sexe === 'F' ? 'Féminin' : d.sexe} hideEmpty />
      <DataRow label="Date de naissance" value={d.date_naissance} hideEmpty />
      <DataRow label="Lieu de naissance" value={d.lieu_naissance} hideEmpty />
    </Section>

    <Section title="Informations Administratives">
      <DataRow label="Date d'engagement" value={d.date_engagement} hideEmpty />
      <DataRow label="Établissement d'attache" value={d.etablissement_attache} hideEmpty />
      <DataRow label="Type d'établissement" value={d.type_etablissement === 'Public' ? 'Établissement Public' : d.type_etablissement === 'Privé' ? 'Établissement Privé' : d.type_etablissement} hideEmpty />
      <DataRow label="Domaine de recherche" value={d.domaine_recherche} hideEmpty />
      <DataRow label="Type de diplôme Master / D.E.A / D.E.S" value={d.type_diplome} hideEmpty />
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Salaire de base" value={d.salaire_base} hideEmpty />}
      {!isPrivateEtablissement(d.type_etablissement) && <DataRow label="Prime institutionnelle" value={d.prime_institutionnelle} hideEmpty />}
    </Section>

    {shouldShowThirdCycleInfo(d) && (
      <Section title="Inscriptions & Statut">
        <DataRow label="Établissement inscription 3e cycle" value={d.etablissement_inscription_3cycle} hideEmpty />
        <DataRow label="Date d'inscription" value={d.date_inscription} hideEmpty />
        <DataRow label="Statut d'apprenant" value={d.statut_apprenant} hideEmpty />
      </Section>
    )}

    <Section title="Diplômes par niveau">
      <FileRow label="Diplôme d'État" path={d.diplome_etat} />
      <FileRow label="Diplôme de Graduat" path={d.diplome_graduat} />
      <FileRow label="Diplôme de Licence" path={d.diplome_licence} />
      <FileRow label="Diplôme Master/D.E.A/D.E.S" path={d.diplome_master_dea_ds} />
      {d.diplome_master_dea_ds && <>
        <DataRow label="Université d'obtention de votre master/D.E.A/D.E.S" value={d.universite_master_dea_ds} hideEmpty />
        <DataRow label="Pays d'obtention de votre Master/D.E.A/D.E.S" value={d.pays_master_dea_ds} hideEmpty />
        <DataRow label="Date d'obtention de votre Master/D.E.A/D.E.S" value={d.date_obtention_master_dea_ds} hideEmpty />
      </>}
    </Section>

    <Section title="Documents">
      <FileRow label="Arrêté de nomination" path={d.arrete_nomination} />
      <FileRow label="Photo passeport" path={d.photo_passeport} />
      {shouldShowThirdCycleInfo(d) && (
        <FileRow label="Décision d'inscription" path={d.decision_inscription} />
      )}
      <FileRow label="Charge horaire" path={d.charge_horaire} />
    </Section>

    {!isEmptyDisplayValue(d.commentaires) && (
      <Section title="Commentaires">
        <DataRow label="Commentaires" value={d.commentaires} hideEmpty />
      </Section>
    )}
  </>
);

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

const MyRecord = ({ currentUser, onCreateRecord, onEditRecord, onLogout, onUserUpdated, openMessagingOnRecord = false, onMessagingOpened }) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'no_record' | 'has_record' | 'error'
  const [record, setRecord] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [migrationError, setMigrationError] = useState('');
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [selectedMigrationTarget, setSelectedMigrationTarget] = useState('');
  const [celebration, setCelebration] = useState(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [messagingUnreadCount, setMessagingUnreadCount] = useState(0);

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
  const migrationTargets = MIGRATION_TARGET_MAP[resolvedType] || [];
  const migrationTarget = selectedMigrationTarget;
  const migrationTargetLabel = migrationTarget === 'Professeur' ? 'Professeur' : 'Chef de Travaux';
  const confettiPieces = Array.from({ length: 34 }, (_, index) => index);
  const canUseMessaging = MESSAGING_ALLOWED_TYPES.includes(resolvedType);

  const refreshMessagingBadge = useCallback(async () => {
    if (!canUseMessaging || !compteId) {
      setMessagingUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/enseignants/messagerie/conversations/?current_compte_id=${encodeURIComponent(compteId)}`, {
        signal: getTimeoutSignal(15000),
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));
      const nextConversations = asArray(data, ['conversations']);
      setMessagingUnreadCount(nextConversations.reduce((total, conversation) => total + getUnreadConversationCount(conversation, compteId), 0));
    } catch (error) {
      console.warn('[Messaging] badge refresh failed:', error);
    }
  }, [canUseMessaging, compteId]);

  useEffect(() => {
    if (!celebration) return undefined;

    const timer = setTimeout(() => {
      setCelebration(null);
    }, 4200);

    return () => clearTimeout(timer);
  }, [celebration]);

  useEffect(() => {
    refreshMessagingBadge();
    if (showMessaging) return undefined;

    const timer = setInterval(refreshMessagingBadge, 12000);
    return () => clearInterval(timer);
  }, [refreshMessagingBadge, showMessaging]);

  useEffect(() => {
    if (!openMessagingOnRecord || !canUseMessaging) return;
    setShowMessaging(true);
    if (typeof onMessagingOpened === 'function') onMessagingOpened();
  }, [canUseMessaging, onMessagingOpened, openMessagingOnRecord]);

  const handleMigration = async () => {
    if (!compteId || !migrationTarget || !migrationTargets.includes(migrationTarget)) return;
    if (status !== 'has_record') {
      setMigrationError('La migration est possible uniquement si vous avez déjà un dossier.');
      setShowMigrationModal(false);
      return;
    }

    setMigrationLoading(true);
    setMigrationMessage('');
    setMigrationError('');

    try {
      const migratedMatricule = (record?.matricule || record?.matricule_esu || '').trim();
      if (migratedMatricule) {
        localStorage.setItem(MIGRATED_MATRICULE_KEY, migratedMatricule);
      }

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
      setSelectedMigrationTarget('');
    } catch (error) {
      localStorage.removeItem(MIGRATED_MATRICULE_KEY);
      setMigrationError(error.message || 'Impossible de migrer ce compte.');
    } finally {
      setMigrationLoading(false);
    }
  };

  const openMigrationModal = (target) => {
    if (status !== 'has_record') {
      setMigrationMessage('');
      setMigrationError('La migration est possible uniquement si vous avez déjà un dossier.');
      return;
    }
    if (!target || !migrationTargets.includes(target)) return;

    const migratedMatricule = (record?.matricule || record?.matricule_esu || '').trim();
    if (migratedMatricule) {
      localStorage.setItem(MIGRATED_MATRICULE_KEY, migratedMatricule);
    }

    setSelectedMigrationTarget(target);
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
          {canUseMessaging && (
            <button
              type="button"
              className={`mr-message-nav-btn ${showMessaging ? 'mr-message-nav-btn--active' : ''}`}
              onClick={() => setShowMessaging(true)}
              title="Ouvrir la messagerie"
            >
              <FaComments />
              Messagerie
              {messagingUnreadCount > 0 && (
                <span className="mr-message-badge" aria-label={`${messagingUnreadCount} nouveau message`}>
                  {messagingUnreadCount > 99 ? '99+' : messagingUnreadCount}
                </span>
              )}
            </button>
          )}
          <button type="button" className="mr-logout-btn" onClick={onLogout} title="Se déconnecter">
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="mr-main">
        {showMessaging ? (
          <MessagingPanel
            compteId={compteId}
            resolvedType={resolvedType}
            onBack={() => {
              setShowMessaging(false);
              refreshMessagingBadge();
            }}
            onUnreadChange={setMessagingUnreadCount}
          />
        ) : (
          <>

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
                {canUseMessaging && (
                  <button
                    type="button"
                    className="mr-btn mr-btn-message"
                    onClick={() => setShowMessaging(true)}
                    title="Ouvrir la messagerie"
                  >
                    <span className="mr-btn-message-icon">
                      <FaComments />
                      {messagingUnreadCount > 0 && (
                        <span className="mr-message-badge mr-message-badge--inline" aria-label={`${messagingUnreadCount} nouveau message`}>
                          {messagingUnreadCount > 99 ? '99+' : messagingUnreadCount}
                        </span>
                      )}
                    </span>
                    Messagerie
                  </button>
                )}
                {migrationTargets.map((target) => (
                  <button
                    key={target}
                    type="button"
                    className="mr-btn mr-btn-migrate"
                    onClick={() => openMigrationModal(target)}
                    disabled={migrationLoading || !compteId}
                  >
                    {migrationLoading && selectedMigrationTarget === target ? 'Migration...' : `Migrer vers ${target}`}
                  </button>
                ))}
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

        {status !== 'loading' && !canUseMessaging && (
          <MessagingPanel
            compteId={compteId}
            resolvedType={resolvedType}
            onBack={() => setShowMessaging(false)}
            onUnreadChange={setMessagingUnreadCount}
          />
        )}
          </>
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
        <div className="mr-modal-overlay" role="presentation" onClick={() => {
          if (!migrationLoading) {
            setShowMigrationModal(false);
            setSelectedMigrationTarget('');
          }
        }}>
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
                onClick={() => {
                  setShowMigrationModal(false);
                  setSelectedMigrationTarget('');
                }}
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
