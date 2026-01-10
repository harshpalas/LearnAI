const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getAuthToken = () => {
  return localStorage.getItem('learnai_token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('learnai_token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('learnai_token');
};

export const apiClient = {
  get: async (endpoint: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  delete: async (endpoint: string) => {
    const token = getAuthToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

export default API_URL;
