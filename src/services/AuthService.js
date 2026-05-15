/**
 * Service d'authentification - ULTRA-DEBUG VERSION
 */

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'authToken';
    this.USER_KEY = 'user';
    this.USER_EMAIL_KEY = 'user_email';
    this.SESSION_KEY = 'hasSession';
  }

  /**
   * Sauvegarder une session sans token (API session-based)
   */
  saveSession(userData) {
    if (!userData) throw new Error('userData requis pour saveSession');
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    localStorage.setItem(this.USER_EMAIL_KEY, userData.email || '');
    localStorage.setItem(this.SESSION_KEY, 'true');
    console.log('✅ Session sauvegardée pour:', userData.email);
  }

  /**
   * Sauvegarder le token et l'utilisateur - AVEC LOGS ULTRA-DÉTAILLÉS
   */
  saveToken(token, userData) {
    console.log('\n' + '█'.repeat(70));
    console.log('💾 SAVETOKEN() DÉBUT');
    console.log('█'.repeat(70));
    
    // Étape 1: Vérifier le token
    console.log('\n1️⃣ Vérification du token reçu:');
    console.log('   Type:', typeof token);
    console.log('   Length:', token?.length);
    console.log('   Valeur:', token?.substring(0, 50) || 'NULL');
    
    if (!token) {
      console.error('   ❌ TOKEN VIDE!');
      throw new Error('Token vide');
    }

    // Étape 2: Formater le token
    console.log('\n2️⃣ Formatage du token:');
    const fullToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    console.log('   Avec Bearer:', fullToken.substring(0, 50) + '...');
    console.log('   Length:', fullToken.length);

    // Étape 3: Sauvegarder dans localStorage
    console.log('\n3️⃣ Sauvegarde dans localStorage:');
    try {
      localStorage.setItem(this.TOKEN_KEY, fullToken);
      console.log('   ✅ localStorage.setItem() exécuté');
    } catch (e) {
      console.error('   ❌ Erreur setItem:', e.message);
      throw e;
    }

    // Étape 4: Vérifier immédiatement
    console.log('\n4️⃣ Vérification immédiate:');
    const verify = localStorage.getItem(this.TOKEN_KEY);
    console.log('   localStorage.getItem() retourne:', verify?.substring?.(0, 50) || 'NULL');
    console.log('   Existe?', !!verify ? '✅ OUI' : '❌ NON');
    
    if (!verify) {
      console.error('   ❌ CRITIQUE: Token n\'a PAS été sauvegardé!');
      console.error('   localStorage disponible?', typeof localStorage !== 'undefined');
      throw new Error('Token not saved in localStorage');
    }
    console.log('   ✅ Token confirmé en localStorage');

    // Étape 5: Sauvegarder l'utilisateur
    console.log('\n5️⃣ Sauvegarde de l\'utilisateur:');
    if (userData) {
      console.log('   Données reçues:', userData);
      const userJson = JSON.stringify(userData);
      console.log('   JSON stringifié:', userJson.substring(0, 50) + '...');
      
      localStorage.setItem(this.USER_KEY, userJson);
      console.log('   ✅ User sauvegardé');
      
      localStorage.setItem(this.USER_EMAIL_KEY, userData.email || '');
      console.log('   ✅ Email sauvegardé:', userData.email);
    } else {
      console.warn('   ⚠️ Pas de userData');
    }

    // Étape 6: Vérification finale
    console.log('\n6️⃣ Vérification finale complète:');
    const finalToken = localStorage.getItem(this.TOKEN_KEY);
    const finalUser = localStorage.getItem(this.USER_KEY);
    console.log('   Token en localStorage:', finalToken ? '✅ OUI' : '❌ NON');
    console.log('   User en localStorage:', finalUser ? '✅ OUI' : '❌ NON');

    // Étape 7: Test d'authentification
    console.log('\n7️⃣ Test isAuthenticated() immédiat:');
    const testAuth = this.isAuthenticated();
    console.log('   Résultat:', testAuth ? '✅ AUTHENTIFIÉ' : '❌ NON AUTHENTIFIÉ');

    console.log('\n' + '█'.repeat(70));
    console.log('💾 SAVETOKEN() FIN - SUCCÈS ✅');
    console.log('█'.repeat(70) + '\n');
  }

  /**
   * Récupérer le token - AVEC LOGS
   */
  getToken() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('   getToken():', token ? `✅ ${token.substring(0, 30)}...` : '❌ NULL');
    return token;
  }

  /**
   * Récupérer l'utilisateur - AVEC LOGS
   */
  getUser() {
    console.log('   getUser() START');
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (!userStr) {
      console.log('      ❌ userStr est NULL');
      return null;
    }
    
    console.log('      userStr obtenu:', userStr.substring(0, 30) + '...');
    
    try {
      const user = JSON.parse(userStr);
      console.log('      ✅ Parsé:', user.email);
      return user;
    } catch (error) {
      console.warn('      ❌ Parse error:', error.message);
      return null;
    }
  }

  /**
   * SIMPLE CHECK: Authentifié? - AVEC LOGS ULTRA-DÉTAILLÉS
   */
  isAuthenticated() {
    console.log('\n' + '▼'.repeat(35));
    console.log('🔍 isAuthenticated() START');
    console.log('▼'.repeat(35));
    
    console.log('\n1️⃣ Récupération du token:');
    const token = this.getToken();
    const hasToken = !!token;
    console.log('   Présent?', hasToken ? '✅ OUI' : '❌ NON');

    console.log('\n2️⃣ Récupération de l\'utilisateur:');
    const user = this.getUser();
    const hasUser = !!user;
    console.log('   Présent?', hasUser ? '✅ OUI' : '❌ NON');

    const hasSession = localStorage.getItem(this.SESSION_KEY) === 'true';

    console.log('\n3️⃣ Résultat final:');
    const isAuth = (hasToken && hasUser) || (hasSession && hasUser);
    console.log('   Authentifié?', isAuth ? '✅ OUI' : '❌ NON');

    console.log('\n' + '▲'.repeat(35) + '\n');
    
    return isAuth;
  }

  /**
   * Déconnexion
   */
  logout() {
    console.log('🔓 LOGGING OUT');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
    localStorage.removeItem(this.SESSION_KEY);
    sessionStorage.clear();
    console.log('✅ LOGGED OUT');
  }

  /**
   * Diagnostic simple mais complet
   */
  diagnose() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 FULL AUTH DIAGNOSTIC');
    console.log('='.repeat(70));
    
    console.log('\n📦 RAW localStorage DATA:');
    console.log('   localStorage.length:', localStorage.length);
    console.log('   authToken:', localStorage.getItem('authToken')?.substring?.(0, 50) || 'NULL');
    console.log('   user:', localStorage.getItem('user')?.substring?.(0, 50) || 'NULL');
    console.log('   user_email:', localStorage.getItem('user_email'));

    console.log('\n🔐 AUTHENTICATION CHECK:');
    const isAuth = this.isAuthenticated();
    console.log('   Result:', isAuth ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED');

    console.log('\n' + '='.repeat(70) + '\n');
    return isAuth;
  }

  /**
   * Nettoyer complètement
   */
  async clearAllCaches() {
    console.log('🧹 Clearing ALL caches...');
    localStorage.clear();
    sessionStorage.clear();
    
    if ('caches' in window) {
      const names = await caches.keys();
      for (const name of names) {
        await caches.delete(name);
      }
    }
    
    console.log('✅ ALL CLEARED');
  }
}

export default new AuthService();
