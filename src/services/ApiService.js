import { SERVER_URL } from '../config';
import AuthService from './AuthService';

/**
 * Service d'API pour gérer les requêtes authentifiées
 * Version simplifiée
 */
class ApiService {
  /**
   * Vérifier et valider le token avant une requête
   */
  validateToken() {
    if (!AuthService.isAuthenticated()) {
      console.warn('⚠️ Pas d\'authentification');
      throw new Error('Token non valide - Session expirée');
    }
  }

  /**
   * Obtenir les headers par défaut avec le token d'authentification
   */
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Gérer les erreurs d'authentification (401/403)
   */
  async handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
      console.warn('🔐 Erreur d\'authentification (401/403)');
      
      // Nettoyer la session et forcer la reconnexion
      AuthService.logout();
      
      // Rediriger vers la page de login
      window.location.href = '/';
      
      throw new Error('Session expirée - Veuillez vous reconnecter');
    }

    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || error.message || 'Erreur lors de la requête');
  }

  /**
   * Effectuer une requête GET authentifiée
   */
  async get(endpoint, options = {}) {
    this.validateToken();

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      signal: AbortSignal.timeout(options.timeout || 30000),
      ...options,
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Effectuer une requête POST authentifiée
   */
  async post(endpoint, data, options = {}) {
    this.validateToken();

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(options.timeout || 30000),
      ...options,
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Effectuer une requête PATCH authentifiée
   */
  async patch(endpoint, data, options = {}) {
    this.validateToken();

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(options.timeout || 30000),
      ...options,
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Effectuer une requête DELETE authentifiée
   */
  async delete(endpoint, options = {}) {
    this.validateToken();

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      signal: AbortSignal.timeout(options.timeout || 30000),
      ...options,
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Effectuer une requête FormData authentifiée (pour les fichiers)
   */
  async postFormData(endpoint, formData, options = {}) {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(options.timeout || 240000),
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Enregistrer un assistant enseignant
   * POST /api/enseignants/assistant/add/ — multipart/form-data
   *
   * Champs texte : matricule, nom, postnom, sexe, date_naissance, lieu_naissance,
   *   telephone, date_engagement, domaine_recherche, etablissement_attache,
   *   mandat_assistant, etablissement_inscription_3cycle, statut_apprenant,
   *   date_inscription, email, commentaires, informations_vraies
   *   Fichiers     : diplome_master_dea_ds, photo_passeport, decision_nomination,
   *   decision_inscription
   **/
  async addAssistant(data) {
    const TEXT_FIELDS = [
      'matricule', 'nom', 'postnom', 'sexe', 'date_naissance', 'lieu_naissance',
      'telephone', 'date_engagement', 'domaine_recherche', 'etablissement_attache',
      'mandat_assistant', 'etablissement_inscription_3cycle', 'statut_apprenant',
      'date_inscription', 'prime_institutionnelle', 'email', 'commentaires', 'informations_vraies',
      'type_diplome',
    ];

    const FILE_FIELDS = [
      'arrete_nomination', 'photo_passeport', 'decision_inscription', 'charge_horaire',
      'diplome_etat', 'diplome_graduat', 'diplome_licence', 'diplome_master_dea_ds',
    ];

    const formData = new FormData();

    TEXT_FIELDS.forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    FILE_FIELDS.forEach((key) => {
      if (data[key]) {
        formData.append(key, data[key]);
      }
    });

    return this.postFormData('/api/enseignants/assistant/add/', formData);
  }

  /**
   * Enregistrer un Chef de Travaux
   * POST /api/enseignants/chef-travaux/add/ — multipart/form-data
   * Champs texte : matricule, email, nom, postnom, prenom, sexe, date_naissance,
   *   lieu_naissance, telephone, date_engagement, domaine_recherche,
   *   etablissement_attache, type_etablissement, etablissement_inscription_3cycle,
   *   statut_apprenant, date_inscription
   * Optionnels   : commentaires, informations_vraies
   * Fichiers     : arrete_nomination, diplome_master_dea_ds, photo_passeport,
   *   decision_inscription
   */
  async addChefTravaux(data) {
    const TEXT_FIELDS = [
      'matricule', 'email', 'nom', 'postnom', 'prenom', 'sexe',
      'date_naissance', 'lieu_naissance', 'telephone', 'date_engagement',
      'domaine_recherche', 'etablissement_attache', 'type_etablissement',
      'etablissement_inscription_3cycle', 'statut_apprenant', 'date_inscription',
      'prime_institutionnelle', 'commentaires', 'informations_vraies',
      'type_diplome',
    ];

    const FILE_FIELDS = [
      'arrete_nomination', 'photo_passeport', 'decision_inscription', 'charge_horaire',
      'diplome_etat', 'diplome_graduat', 'diplome_licence', 'diplome_master_dea_ds',
    ];

    const formData = new FormData();

    TEXT_FIELDS.forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    FILE_FIELDS.forEach((key) => {
      if (data[key]) {
        formData.append(key, data[key]);
      }
    });

    return this.postFormData('/api/enseignants/chef-travaux/add/', formData);
  }

  /**
   * Modifier partiellement un Professeur (PATCH)
   * PATCH /api/enseignants/professeur/edit/{matricule}/
   */
  async updateProfesseur(matricule, data) {
    const TEXT_FIELDS = [
      'nom', 'postnom', 'prenom', 'sexe', 'type_etablissement', 'matricule_esu',
      'lieu_naissance', 'date_naissance', 'grade_actuel', 'pays_soutenance',
      'universite_soutenance', 'numero_arrete_equivalence', 'date_soutenance',
      'date_engagement',
      'type_diplome', 'universite_attache', 'email', 'telephone',
      'reference_dernier_arrete', 'prime_institutionnelle', 'salaire_base',
      'possede_diplome', 'domaine_recherche', 'sujet_these',
      'universite_obtention_diplome_doctorat', 'pays_obtention_diplome_doctorat', 'date_obtention_diplome_doctorat',
      'commentaire_confirmation', 'informations_vraies',
      'universite_master_dea_ds', 'pays_master_dea_ds',
      'date_obtention_master_dea_ds', 'type_diplome_dea_des',
    ];

    const FILE_FIELDS = [
      'photo_identite', 'copie_diplome', // 'copie_arrete_equivalence',
      'documents_equivalents', 'charge_horaire', 'diplome_etat',
      'diplome_graduat', 'diplome_licence', 'diplome_master_dea_ds',
    ];

    const formData = new FormData();

    TEXT_FIELDS.forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    FILE_FIELDS.forEach((key) => {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      }
    });

    const response = await fetch(`${SERVER_URL}/api/enseignants/professeur/edit/${matricule}/`, {
      method: 'PATCH',
      body: formData,
      signal: AbortSignal.timeout(240000),
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Modifier partiellement un assistant (PATCH)
   * PATCH /api/enseignants/assistant/edit/{id}/
   */
  async updateAssistant(id, data) {
    const TEXT_FIELDS = [
      'matricule', 'nom', 'postnom', 'sexe', 'date_naissance', 'lieu_naissance',
      'telephone', 'date_engagement', 'domaine_recherche', 'etablissement_attache',
      'mandat_assistant', 'etablissement_inscription_3cycle', 'statut_apprenant',
      'date_inscription', 'prime_institutionnelle', 'email', 'commentaires', 'informations_vraies',
      'type_diplome',
    ];

    const FILE_FIELDS = [
      'photo_passeport', 'decision_nomination', 'decision_inscription', 'charge_horaire',
      'diplome_etat', 'diplome_graduat', 'diplome_licence', 'diplome_master_dea_ds',
    ];

    const formData = new FormData();

    TEXT_FIELDS.forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    FILE_FIELDS.forEach((key) => {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      }
    });

    const response = await fetch(`${SERVER_URL}/api/enseignants/assistant/edit/${id}/`, {
      method: 'PATCH',
      body: formData,
      signal: AbortSignal.timeout(240000),
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Modifier partiellement un Chef de Travaux (PATCH)
   * PATCH /api/enseignants/chef-travaux/edit/{id}/
   */
  async updateChefTravaux(id, data) {
    const TEXT_FIELDS = [
      'matricule', 'email', 'nom', 'postnom', 'prenom', 'sexe',
      'date_naissance', 'lieu_naissance', 'telephone', 'date_engagement',
      'domaine_recherche', 'etablissement_attache', 'type_etablissement',
      'etablissement_inscription_3cycle', 'statut_apprenant', 'date_inscription',
      'prime_institutionnelle', 'commentaires', 'informations_vraies',
      'type_diplome',
    ];

    const FILE_FIELDS = [
      'arrete_nomination', 'photo_passeport', 'decision_inscription', 'charge_horaire',
      'diplome_etat', 'diplome_graduat', 'diplome_licence', 'diplome_master_dea_ds',
    ];

    const formData = new FormData();

    TEXT_FIELDS.forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    FILE_FIELDS.forEach((key) => {
      if (data[key] instanceof File) {
        formData.append(key, data[key]);
      }
    });

    const response = await fetch(`${SERVER_URL}/api/enseignants/chef-travaux/edit/${id}/`, {
      method: 'PATCH',
      body: formData,
      signal: AbortSignal.timeout(240000),
    });

    if (!response.ok) {
      return this.handleAuthError(response);
    }

    return response.json();
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  /**
   * Effectuer une requête GET simple (sans authentification requise)
   */
  async getPublic(endpoint, options = {}) {
    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(options.timeout || 30000),
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur lors de la requête' }));
      throw new Error(error.error || error.message || `Erreur ${response.status}`);
    }

    return response.json();
  }

  isAuthenticated() {
    return AuthService.isAuthenticated();
  }

  /**
   * Obtenir le token
   */
  getToken() {
    return AuthService.getToken();
  }

  /**
   * Obtenir les données utilisateur
   */
  getCurrentUser() {
    return AuthService.getUser();
  }

  /**
   * Nettoyer la session complètement
   */
  clearSession() {
    AuthService.logout();
  }

}


export default new ApiService();
