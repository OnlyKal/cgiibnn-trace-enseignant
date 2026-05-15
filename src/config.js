// API Configuration
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://admin.cgiibnn-esursi.cd';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `${SERVER_URL}/api/bnn/`;

export const API_ENDPOINTS = {
  // Add your endpoints here as needed
  // Example: users: '/users',
  // Example: posts: '/posts',
};

export default API_BASE_URL;