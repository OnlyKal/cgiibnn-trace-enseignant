import { useState, useCallback } from 'react';
import ApiService from '../services/ApiService';

/**
 * Hook personnalisé pour les requêtes API
 */
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, endpoint, data = null, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await ApiService.get(endpoint, options);
          break;
        case 'POST':
          response = await ApiService.post(endpoint, data, options);
          break;
        case 'PATCH':
          response = await ApiService.patch(endpoint, data, options);
          break;
        case 'DELETE':
          response = await ApiService.delete(endpoint, options);
          break;
        default:
          throw new Error(`Méthode HTTP non supportée: ${method}`);
      }
      return response;
    } catch (err) {
      const errorMsg = err.message || 'Une erreur est survenue';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint, options) => request('GET', endpoint, null, options), [request]);
  const post = useCallback((endpoint, data, options) => request('POST', endpoint, data, options), [request]);
  const patch = useCallback((endpoint, data, options) => request('PATCH', endpoint, data, options), [request]);
  const del = useCallback((endpoint, options) => request('DELETE', endpoint, null, options), [request]);

  return {
    loading,
    error,
    get,
    post,
    patch,
    delete: del,
    request,
  };
};

export default useApi;
