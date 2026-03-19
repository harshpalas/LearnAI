import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentList } from './pages/DocumentList';
import { DocumentStudy } from './pages/DocumentStudy';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { LandingPage } from './pages/LandingPage';
import { ROUTES } from './constants';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to={ROUTES.LOGIN} />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.LANDING} element={<LandingPage />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<Signup />} />
      <Route path={ROUTES.DASHBOARD} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path={ROUTES.DOCUMENTS} element={<ProtectedRoute><DocumentList /></ProtectedRoute>} />
      <Route path={ROUTES.STUDY} element={<ProtectedRoute><DocumentStudy /></ProtectedRoute>} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
