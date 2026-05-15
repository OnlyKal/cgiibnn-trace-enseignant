/**
 * Tests pour ApiService
 * Valide :
 * - Validation du token avant requêtes
 * - Gestion d'erreurs 401/403
 * - Headers authentifiés
 * - Interaction avec AuthService
 */

import ApiService from '../services/ApiService';
import AuthService from '../services/AuthService';
import { SERVER_URL } from '../config';

// Mock AuthService
jest.mock('../services/AuthService');

describe('ApiService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    global.fetch = jest.fn();
    // AbortSignal.timeout is not available in JSDOM — provide a stub
    global.AbortSignal = {
      ...global.AbortSignal,
      timeout: jest.fn().mockReturnValue(undefined),
    };
  });

  describe('Token Validation', () => {
    test('should validate token before GET request', async () => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'success' }),
      });

      await ApiService.get('/test-endpoint');

      expect(AuthService.isAuthenticated).toHaveBeenCalled();
    });

    test('should throw error if token not authenticated', async () => {
      AuthService.isAuthenticated.mockReturnValue(false);

      await expect(ApiService.get('/test-endpoint')).rejects.toThrow();
    });
  });

  describe('Auth Headers', () => {
    test('should include Bearer token in headers', () => {
      AuthService.getToken.mockReturnValue('Bearer myToken123');

      const headers = ApiService.getAuthHeaders();

      expect(headers['Authorization']).toBe('Bearer myToken123');
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('should handle token without Bearer prefix', () => {
      AuthService.getToken.mockReturnValue('myToken123');

      const headers = ApiService.getAuthHeaders();

      expect(headers['Authorization']).toBe('Bearer myToken123');
    });

    test('should work without token', () => {
      AuthService.getToken.mockReturnValue(null);

      const headers = ApiService.getAuthHeaders();

      expect(headers['Authorization']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should make GET request with auth headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: 'data' }),
      });

      const result = await ApiService.get('/api/users');

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/users`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer validToken',
          }),
        })
      );
      expect(result).toEqual({ result: 'data' });
    });

    test('should make POST request with auth headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ created: true }),
      });

      const data = { name: 'test' };
      const result = await ApiService.post('/api/users', data);

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/users`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer validToken',
          }),
          body: JSON.stringify(data),
        })
      );
      expect(result).toEqual({ created: true });
    });

    test('should make PATCH request with auth headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updated: true }),
      });

      const data = { name: 'updated' };
      const result = await ApiService.patch('/api/users/1', data);

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/users/1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(data),
        })
      );
      expect(result).toEqual({ updated: true });
    });

    test('should make DELETE request with auth headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted: true }),
      });

      const result = await ApiService.delete('/api/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/users/1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should handle 401 Unauthorized', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

      // Mock window.location.href
      delete window.location;
      window.location = { href: jest.fn() };

      await expect(ApiService.get('/api/protected')).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    test('should handle 403 Forbidden', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      });

      delete window.location;
      window.location = { href: jest.fn() };

      await expect(ApiService.get('/api/protected')).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    test('should handle generic error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(ApiService.get('/api/test')).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('Authentication Status', () => {
    test('isAuthenticated should delegate to AuthService', () => {
      AuthService.isAuthenticated.mockReturnValue(true);
      expect(ApiService.isAuthenticated()).toBe(true);

      AuthService.isAuthenticated.mockReturnValue(false);
      expect(ApiService.isAuthenticated()).toBe(false);
    });
  });

  describe('User Management', () => {
    test('getCurrentUser should delegate to AuthService', () => {
      const mockUser = { email: 'test@example.com', id: '123' };
      AuthService.getUser.mockReturnValue(mockUser);

      expect(ApiService.getCurrentUser()).toEqual(mockUser);
    });

    test('clearSession should delegate to AuthService logout', () => {
      ApiService.clearSession();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  describe('FormData Upload', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should upload FormData with auth headers', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uploaded: true }),
      });

      const formData = new FormData();
      formData.append('file', new File(['content'], 'test.txt'));

      const result = await ApiService.postFormData('/api/upload', formData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/upload`,
        expect.objectContaining({
          method: 'POST',
          body: formData,
        })
      );
      expect(result).toEqual({ uploaded: true });
    });
  });

  describe('addAssistant', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should POST to /api/enseignants/assistant/add/ with FormData and auth header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Assistant enregistré', matricule: 'ASSIS03937' }),
      });

      const data = {
        nom: 'Dupont',
        postnom: 'Jean',
        sexe: 'M',
        date_naissance: '1990-01-15',
        lieu_naissance: 'Kinshasa',
        telephone: '+243812345678',
        date_engagement: '2024-09-01',
        domaine_recherche: 'Informatique',
        etablissement_attache: 'UNIKIN',
        mandat_assistant: 'Premier',
        etablissement_inscription_3cycle: 'UNIKIN',
        statut_apprenant: 'DEA/D.E.S',
        date_inscription: '2024-10-01',
        prime_institutionnelle: 'Oui',
        email: 'jean.dupont@unikin.ac.cd',
        commentaires: 'RAS',
        informations_vraies: true,
        dernier_diplome: new File(['diploma'], 'diploma.pdf', { type: 'application/pdf' }),
        photo_passeport: new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }),
        decision_nomination: new File(['decision'], 'decision.pdf', { type: 'application/pdf' }),
        decision_inscription: new File(['inscription'], 'inscription.pdf', { type: 'application/pdf' }),
      };

      const result = await ApiService.addAssistant(data);

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/enseignants/assistant/add/`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer validToken',
          }),
        })
      );
      expect(result).toEqual({ message: 'Assistant enregistré', matricule: 'ASSIS03937' });
    });

    test('should append all text fields to FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      const data = {
        matricule: 'ASSIS03937',
        nom: 'Mwamba',
        postnom: 'Élise',
        sexe: 'F',
        date_naissance: '1995-05-20',
        lieu_naissance: 'Lubumbashi',
        telephone: '+243897654321',
        date_engagement: '2025-01-01',
        domaine_recherche: 'Chimie',
        etablissement_attache: 'UNILU',
        mandat_assistant: 'Deuxième',
        etablissement_inscription_3cycle: 'UNILU',
        statut_apprenant: 'Doctorat',
        date_inscription: '2025-02-01',
        prime_institutionnelle: 'Non',
        email: 'elise.mwamba@unilu.ac.cd',
        commentaires: 'Premier cycle terminé',
        informations_vraies: true,
      };

      await ApiService.addAssistant(data);

      const [, fetchOptions] = global.fetch.mock.calls[0];
      const body = fetchOptions.body;

      expect(body.get('matricule')).toBe('ASSIS03937');
      expect(body.get('nom')).toBe('Mwamba');
      expect(body.get('sexe')).toBe('F');
      expect(body.get('mandat_assistant')).toBe('Deuxième');
      expect(body.get('statut_apprenant')).toBe('Doctorat');
      expect(body.get('prime_institutionnelle')).toBe('Non');
      expect(body.get('informations_vraies')).toBe('true');
    });

    test('should append file fields to FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      const diplome = new File(['diploma'], 'diploma.pdf', { type: 'application/pdf' });
      const photo = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
      const nomination = new File(['nomination'], 'nomination.pdf', { type: 'application/pdf' });
      const inscription = new File(['inscription'], 'inscription.pdf', { type: 'application/pdf' });

      await ApiService.addAssistant({
        nom: 'Test',
        dernier_diplome: diplome,
        photo_passeport: photo,
        decision_nomination: nomination,
        decision_inscription: inscription,
      });

      const [, fetchOptions] = global.fetch.mock.calls[0];
      const body = fetchOptions.body;

      expect(body.get('dernier_diplome')).toBe(diplome);
      expect(body.get('photo_passeport')).toBe(photo);
      expect(body.get('decision_nomination')).toBe(nomination);
      expect(body.get('decision_inscription')).toBe(inscription);
    });

    test('should skip null and undefined fields', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      await ApiService.addAssistant({
        nom: 'Test',
        commentaires: null,
        date_engagement: undefined,
        decision_nomination: undefined,
        dernier_diplome: null,
      });

      const [, fetchOptions] = global.fetch.mock.calls[0];
      const body = fetchOptions.body;

      expect(body.get('nom')).toBe('Test');
      expect(body.get('commentaires')).toBeNull();
      expect(body.get('date_engagement')).toBeNull();
      expect(body.get('decision_nomination')).toBeNull();
      expect(body.get('dernier_diplome')).toBeNull();
    });

    test('should handle 401 Unauthorized and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

      delete window.location;
      window.location = { href: jest.fn() };

      await expect(ApiService.addAssistant({ nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    test('should handle 403 Forbidden and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      });

      delete window.location;
      window.location = { href: jest.fn() };

      await expect(ApiService.addAssistant({ nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  describe('addChefTravaux', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should POST to /api/enseignants/chef-travaux/add/ with FormData and auth header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Chef de Travaux enregistré', matricule: 'CT093833' }),
      });

      const data = {
        nom: 'Kabila',
        postnom: 'Pierre',
        prenom: 'Marc',
        sexe: 'M',
        date_naissance: '1985-03-10',
        lieu_naissance: 'Goma',
        telephone: '+243823456789',
        date_engagement: '2023-09-01',
        domaine_recherche: 'Mathématiques',
        etablissement_attache: 'ULPGL',
        type_etablissement: 'Public',
        etablissement_inscription_3cycle: 'ULPGL',
        statut_apprenant: 'DEA/DES',
        date_inscription: '2023-10-01',
        prime_institutionnelle: 'Oui',
        email: 'pierre.kabila@ulpgl.ac.cd',
        arrete_nomination: new File(['arrete'], 'arrete.pdf', { type: 'application/pdf' }),
        dernier_diplome: new File(['diploma'], 'diploma.pdf', { type: 'application/pdf' }),
        photo_passeport: new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }),
        decision_inscription: new File(['decision'], 'decision.pdf', { type: 'application/pdf' }),
      };

      const result = await ApiService.addChefTravaux(data);

      expect(global.fetch).toHaveBeenCalledWith(
        `${SERVER_URL}/api/enseignants/chef-travaux/add/`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer validToken',
          }),
        })
      );
      expect(result).toEqual({ message: 'Chef de Travaux enregistré', matricule: 'CT093833' });
    });

    test('should append all text fields to FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      const data = {
        matricule: 'CT093833',
        email: 'p.kabila@ulpgl.ac.cd',
        nom: 'Kabila',
        postnom: 'Pierre',
        prenom: 'Marc',
        sexe: 'M',
        date_naissance: '1985-03-10',
        lieu_naissance: 'Goma',
        telephone: '+243823456789',
        date_engagement: '2023-09-01',
        domaine_recherche: 'Mathématiques',
        etablissement_attache: 'ULPGL',
        type_etablissement: 'Public',
        etablissement_inscription_3cycle: 'ULPGL',
        statut_apprenant: 'Doctorat',
        date_inscription: '2023-10-01',
        prime_institutionnelle: 'Oui',
        commentaires: 'Aucun',
        informations_vraies: true,
      };

      await ApiService.addChefTravaux(data);

      const [, fetchOptions] = global.fetch.mock.calls[0];
      const body = fetchOptions.body;

      expect(body.get('matricule')).toBe('CT093833');
      expect(body.get('nom')).toBe('Kabila');
      expect(body.get('prenom')).toBe('Marc');
      expect(body.get('sexe')).toBe('M');
      expect(body.get('type_etablissement')).toBe('Public');
      expect(body.get('statut_apprenant')).toBe('Doctorat');
      expect(body.get('prime_institutionnelle')).toBe('Oui');
      expect(body.get('commentaires')).toBe('Aucun');
      expect(body.get('informations_vraies')).toBe('true');
    });

    test('should append file fields to FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      const arrete = new File(['arrete'], 'arrete.pdf', { type: 'application/pdf' });
      const diplome = new File(['diploma'], 'diploma.pdf', { type: 'application/pdf' });
      const photo = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
      const inscription = new File(['decision'], 'decision.pdf', { type: 'application/pdf' });

      await ApiService.addChefTravaux({
        nom: 'Test',
        arrete_nomination: arrete,
        dernier_diplome: diplome,
        photo_passeport: photo,
        decision_inscription: inscription,
      });

      const [, fetchOptions] = global.fetch.mock.calls[0];
      const body = fetchOptions.body;

      expect(body.get('arrete_nomination')).toBe(arrete);
      expect(body.get('dernier_diplome')).toBe(diplome);
      expect(body.get('photo_passeport')).toBe(photo);
      expect(body.get('decision_inscription')).toBe(inscription);
    });

    test('should omit optional fields when null or undefined', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      await ApiService.addChefTravaux({
        nom: 'Test',
        commentaires: null,
        informations_vraies: undefined,
        arrete_nomination: null,
        decision_inscription: undefined,
      });

      const [, fetchOptions] = global.fetch.mock.calls[0];
      const body = fetchOptions.body;

      expect(body.get('nom')).toBe('Test');
      expect(body.get('commentaires')).toBeNull();
      expect(body.get('informations_vraies')).toBeNull();
      expect(body.get('arrete_nomination')).toBeNull();
      expect(body.get('decision_inscription')).toBeNull();
    });

    test('should handle 401 Unauthorized and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });

      delete window.location;
      window.location = { href: jest.fn() };

      await expect(ApiService.addChefTravaux({ nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    test('should handle 403 Forbidden and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      });

      delete window.location;
      window.location = { href: jest.fn() };

      await expect(ApiService.addChefTravaux({ nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE — Assistant
  // ─────────────────────────────────────────────────────────────────────────────
  describe('updateAssistant', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should PATCH /api/enseignants/assistant/edit/{id}/ with auth header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Assistant modifié' }),
      });

      const result = await ApiService.updateAssistant(42, { nom: 'Dupont' });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/enseignants/assistant/edit/42/`);
      expect(options.method).toBe('PATCH');
      expect(options.headers['Authorization']).toBe('Bearer validToken');
      expect(result).toEqual({ message: 'Assistant modifié' });
    });

    test('should append changed text fields to FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      await ApiService.updateAssistant(42, {
        nom: 'Mwamba',
        telephone: '+243897654321',
        prime_institutionnelle: 'Non',
        informations_vraies: true,
      });

      const [, options] = global.fetch.mock.calls[0];
      const body = options.body;
      expect(body.get('nom')).toBe('Mwamba');
      expect(body.get('telephone')).toBe('+243897654321');
      expect(body.get('prime_institutionnelle')).toBe('Non');
      expect(body.get('informations_vraies')).toBe('true');
    });

    test('should append file fields only when File instance', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      const newPhoto = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

      await ApiService.updateAssistant(42, {
        nom: 'Test',
        photo_passeport: newPhoto,
        dernier_diplome: null, // not a File — should be skipped
      });

      const [, options] = global.fetch.mock.calls[0];
      const body = options.body;
      expect(body.get('photo_passeport')).toBe(newPhoto);
      expect(body.get('dernier_diplome')).toBeNull();
    });

    test('should handle 401 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });
      delete window.location;
      window.location = { href: jest.fn() };
      await expect(ApiService.updateAssistant(42, { nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    test('should handle 403 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      });
      delete window.location;
      window.location = { href: jest.fn() };
      await expect(ApiService.updateAssistant(42, { nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE — Chef de Travaux
  // ─────────────────────────────────────────────────────────────────────────────
  describe('updateChefTravaux', () => {
    beforeEach(() => {
      AuthService.isAuthenticated.mockReturnValue(true);
      AuthService.getToken.mockReturnValue('Bearer validToken');
    });

    test('should PATCH /api/enseignants/chef-travaux/edit/{id}/ with auth header', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Chef de Travaux modifié' }),
      });

      const result = await ApiService.updateChefTravaux(7, { nom: 'Kabila' });

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toBe(`${SERVER_URL}/api/enseignants/chef-travaux/edit/7/`);
      expect(options.method).toBe('PATCH');
      expect(options.headers['Authorization']).toBe('Bearer validToken');
      expect(result).toEqual({ message: 'Chef de Travaux modifié' });
    });

    test('should append changed text fields to FormData', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      await ApiService.updateChefTravaux(7, {
        nom: 'Kabila',
        type_etablissement: 'Privé',
        prime_institutionnelle: 'Oui',
        commentaires: 'Modification test',
        informations_vraies: false,
      });

      const [, options] = global.fetch.mock.calls[0];
      const body = options.body;
      expect(body.get('nom')).toBe('Kabila');
      expect(body.get('type_etablissement')).toBe('Privé');
      expect(body.get('prime_institutionnelle')).toBe('Oui');
      expect(body.get('commentaires')).toBe('Modification test');
      expect(body.get('informations_vraies')).toBe('false');
    });

    test('should append file fields only when File instance', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OK' }),
      });

      const newArrete = new File(['arrete'], 'arrete.pdf', { type: 'application/pdf' });

      await ApiService.updateChefTravaux(7, {
        nom: 'Test',
        arrete_nomination: newArrete,
        dernier_diplome: undefined, // should be skipped
      });

      const [, options] = global.fetch.mock.calls[0];
      const body = options.body;
      expect(body.get('arrete_nomination')).toBe(newArrete);
      expect(body.get('dernier_diplome')).toBeNull();
    });

    test('should handle 401 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Unauthorized' }),
      });
      delete window.location;
      window.location = { href: jest.fn() };
      await expect(ApiService.updateChefTravaux(7, { nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });

    test('should handle 403 and logout', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ detail: 'Forbidden' }),
      });
      delete window.location;
      window.location = { href: jest.fn() };
      await expect(ApiService.updateChefTravaux(7, { nom: 'Test' })).rejects.toThrow();
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });
});
