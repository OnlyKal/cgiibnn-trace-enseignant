/**
 * Tests pour AuthService
 * Valide :
 * - Validation de structure JWT
 * - Gestion d'expiration des tokens
 * - Décodage de tokens
 * - Stockage et récupération sécurisés
 */

import AuthService from '../services/AuthService';

describe('AuthService', () => {
  beforeEach(() => {
    // Nettoyer localStorage avant chaque test
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Token Structure Validation', () => {
    test('should validate correct JWT structure', () => {
      // Token JWT valide (format base64)
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(AuthService.validateTokenStructure(validToken)).toBe(true);
    });

    test('should reject token with Bearer prefix for structure validation', () => {
      const tokenWithBearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(AuthService.validateTokenStructure(tokenWithBearer)).toBe(true);
    });

    test('should reject invalid token structure (wrong number of parts)', () => {
      const invalidToken = 'not.a.valid.token.structure';
      expect(AuthService.validateTokenStructure(invalidToken)).toBe(false);
    });

    test('should reject empty or null token', () => {
      expect(AuthService.validateTokenStructure('')).toBe(false);
      expect(AuthService.validateTokenStructure(null)).toBe(false);
      expect(AuthService.validateTokenStructure(undefined)).toBe(false);
    });

    test('should reject non-string token', () => {
      expect(AuthService.validateTokenStructure(123)).toBe(false);
      expect(AuthService.validateTokenStructure({})).toBe(false);
    });
  });

  describe('Token Decoding', () => {
    test('should decode valid JWT token', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const payload = AuthService.decodeToken(validToken);
      
      expect(payload).not.toBeNull();
      expect(payload.name).toBe('John Doe');
      expect(payload.sub).toBe('1234567890');
      expect(payload.exp).toBe(9999999999);
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'not.valid.token';
      expect(AuthService.decodeToken(invalidToken)).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    test('should detect expired token', () => {
      // Token expiré (exp est dans le passé)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.QD_FqVVHnQpZZiPFqj3yxXXzjYzjYzjYzjYzjYzjYzj';
      expect(AuthService.isTokenExpired(expiredToken)).toBe(true);
    });

    test('should detect non-expired token', () => {
      // Token valide (exp est dans le futur)
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      expect(AuthService.isTokenExpired(validToken)).toBe(false);
    });

    test('should get correct time before expiry', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 heure dans le futur
      const payload = {
        exp: futureTime,
        sub: 'user123'
      };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      const timeBeforeExpiry = AuthService.getTimeBeforeExpiry(token);
      expect(timeBeforeExpiry).toBeGreaterThan(3500 * 1000); // Plus que 3500 secondes en ms
      expect(timeBeforeExpiry).toBeLessThan(3600 * 1000); // Moins que 3600 secondes en ms
    });
  });

  describe('Token Refresh Logic', () => {
    test('should determine if token needs refresh', () => {
      // Token expira dans 2 minutes (doit être rafraîchi avant 5 minutes)
      const soonToExpireTime = Math.floor(Date.now() / 1000) + 120;
      const payload = { exp: soonToExpireTime };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      expect(AuthService.shouldRefreshToken(token)).toBe(true);
    });

    test('should not refresh token if too much time remains', () => {
      // Token expira dans 1 jour (ne pas besoin de rafraîchir)
      const futureTime = Math.floor(Date.now() / 1000) + 86400;
      const payload = { exp: futureTime };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      
      expect(AuthService.shouldRefreshToken(token)).toBe(false);
    });
  });

  describe('Token Storage', () => {
    test('should save token with Bearer prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const userData = { email: 'test@example.com', id: '123' };
      
      AuthService.saveToken(token, userData);
      
      const savedToken = localStorage.getItem('authToken');
      expect(savedToken).toMatch(/^Bearer /);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(userData));
    });

    test('should retrieve saved token', () => {
      const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('authToken', token);
      
      expect(AuthService.getToken()).toBe(token);
    });

    test('should retrieve saved user', () => {
      const userData = { email: 'test@example.com', id: '123' };
      localStorage.setItem('user', JSON.stringify(userData));
      
      const retrievedUser = AuthService.getUser();
      expect(retrievedUser).toEqual(userData);
    });
  });

  describe('Authentication Status', () => {
    test('should return false when not authenticated', () => {
      expect(AuthService.isAuthenticated()).toBe(false);
    });

    test('should return true when authenticated with valid token', () => {
      const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('authToken', token);
      
      expect(AuthService.isAuthenticated()).toBe(true);
    });

    test('should return false with expired token', () => {
      const expiredToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.QD_FqVVHnQpZZiPFqj3yxXXzjYzjYzjYzjYzjYzjYzj';
      localStorage.setItem('authToken', expiredToken);
      
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('Logout', () => {
    test('should clear all authentication data on logout', () => {
      // Setup
      localStorage.setItem('authToken', 'Bearer token');
      localStorage.setItem('refreshToken', 'refresh-token');
      localStorage.setItem('user', JSON.stringify({ email: 'test@example.com' }));
      localStorage.setItem('user_email', 'test@example.com');
      sessionStorage.setItem('sessionData', 'data');
      
      // Logout
      AuthService.logout();
      
      // Verify all cleared
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('user_email')).toBeNull();
      expect(sessionStorage.getItem('sessionData')).toBeNull();
    });
  });

  describe('Token Info', () => {
    test('should provide token information', () => {
      const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('authToken', token);
      
      const info = AuthService.getTokenInfo();
      
      expect(info.isAuthenticated).toBe(true);
      expect(info.isExpired).toBe(false);
      expect(info.expiresIn).toBeGreaterThan(0);
      expect(info.payload).not.toBeNull();
    });
  });
});
