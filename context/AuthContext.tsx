import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiClient, setAuthToken, getAuthToken, removeAuthToken } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (name: string, email: string) => void;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      loginWithToken(token);
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    } else {
      const existingToken = getAuthToken();
      if (existingToken) {
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    }
  }, []);

 const fetchUserProfile = async () => { try { const data = await apiClient.get('/api/user/me'); if (data.user) { setUser({ id: data.user._id, name: data.user.name, email: data.user.email }); } } catch (error) { console.error('Failed to fetch user profile:', error); removeAuthToken(); } finally { setLoading(false); } };

  const login = (name: string, email: string) => {
    const newUser = { id: '1', name, email };
    setUser(newUser);
    localStorage.setItem('learnai_user_session', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      removeAuthToken();
      localStorage.removeItem('learnai_user_session');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
