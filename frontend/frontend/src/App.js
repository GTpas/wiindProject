import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import AuditPageCanva from "./components/AuditPageCanva";
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import VerificationPending from './components/VerificationPending';
import CodeVerification from './components/CodeVerification';
import SignupRedirect from './components/SignupRedirect';
import VerifyEmail from './components/VerifyEmail';
import { useEffect } from 'react';


const ProtectedRoute = ({ element: Element, requiredRole }) => {
  const { isAuthenticated, userRole } = useAuth();
  

  if (!isAuthenticated) {
    console.log("⛔ Redirection vers signin car non authentifié");
    return <Navigate to="/signin" replace />;
  }
  

  if (requiredRole && userRole !== requiredRole) {
    console.log("⛔ Redirection vers accueil car rôle incorrect");
    return <Navigate to="/" replace />;
  }
  
  return Element;
};


const RouteLogger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log("🧭 Navigation vers:", {
      path: location.pathname,
      search: location.search,
      timestamp: new Date().toISOString()
    });
  }, [location]);
  
  return null;
};


const PostSignupHandler = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log("🔍 Vérification de l'état post-inscription:", {
      path: location.pathname,
      email: localStorage.getItem('pendingVerificationEmail'),
      justRegistered: localStorage.getItem('justRegistered'),
      timestamp: new Date().toISOString()
    });
    

    if (localStorage.getItem('justRegistered') === 'true' && 
        (location.pathname === '/signin' || location.pathname === '/login')) {
      console.log("🔄 Redirection automatique post-inscription vers la vérification");
      

      setTimeout(() => {
        window.location.href = '/verification-pending';
      }, 100);
    }
  }, [location]);
  
  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        {}
        <RouteLogger />
        <PostSignupHandler />
        
        <Routes>
          {}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signup-success" element={<SignupRedirect />} />
          
          {}
          <Route path="/verification-pending" element={<VerificationPending />} />
          <Route path="/code-verification" element={<CodeVerification />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          
          {/* Routes protégées nécessitant une authentification */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                element={<Dashboard />}
                requiredRole="admin"
              />
            }
          />
          
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute
                element={<AdminDashboard />}
                requiredRole="admin"
              />
            }
          />
          
          <Route
            path="/auditCanva"
            element={
              <ProtectedRoute
                element={<AuditPageCanva />}
                requiredRole="operateur"
              />
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
