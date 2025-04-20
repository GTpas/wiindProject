import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [user, setUser] = useState(null);
    const [csrfToken, setCsrfToken] = useState(null);
    
    // Ajouter un état pour le suivi des redirections
    const [debugInfo, setDebugInfo] = useState({
        lastAction: null,
        timestamp: null,
        path: null
    });

    useEffect(() => {
        // Log pour débogage - Chargement initial du contexte
        console.log("💡 AuthContext - INITIALISATION", {
            currentPath: window.location.pathname,
            currentUrl: window.location.href
        });
        
        // Vérifier si l'utilisateur est déjà connecté au chargement
        const storedIsAuth = localStorage.getItem('isAuthenticated');
        const storedUserRole = localStorage.getItem('userRole');
        const storedUser = localStorage.getItem('user');
        const storedCsrfToken = localStorage.getItem('csrfToken');

        if (storedIsAuth === 'true' && storedUserRole) {
            setIsAuthenticated(true);
            setUserRole(storedUserRole);
            
            if (storedUser) {
                try {
                    const userData = JSON.parse(storedUser);
                    setUser(userData);
                } catch (e) {
                    console.error("Erreur de parsing user:", e);
                }
            }
            
            if (storedCsrfToken) {
                setCsrfToken(storedCsrfToken);
            }
            
            console.log("🔓 Auth Context - Utilisateur déjà connecté:", {
                userRole: storedUserRole,
                isAuthenticated: storedIsAuth,
                currentPath: window.location.pathname
            });
        } else {
            console.log("🔒 Auth Context - Aucun utilisateur connecté", {
                currentPath: window.location.pathname
            });
        }
        
        // Ajouter un écouteur d'événements pour les changements d'URL
        const handleRouteChange = () => {
            console.log("🧭 Navigation détectée:", {
                path: window.location.pathname,
                isAuth: localStorage.getItem('isAuthenticated') === 'true',
                timestamp: new Date().toISOString()
            });
            
            // Mettre à jour les infos de débogage
            setDebugInfo({
                lastAction: "navigation",
                timestamp: new Date().toISOString(),
                path: window.location.pathname
            });
        };
        
        window.addEventListener('popstate', handleRouteChange);
        
        // Surveiller les changements d'historique
        const originalPushState = window.history.pushState;
        window.history.pushState = function() {
            originalPushState.apply(this, arguments);
            handleRouteChange();
        };
        
        // Nettoyage
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
            window.history.pushState = originalPushState;
        };
    }, []);

    const login = (userData) => {
        // Stocker les informations utilisateur
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Mettre à jour l'état
        setUser(userData);
        setIsAuthenticated(true);
        setUserRole(userData.role);
        
        // Mettre à jour le debug
        setDebugInfo({
            lastAction: "login",
            timestamp: new Date().toISOString(),
            path: window.location.pathname
        });
        
        console.log("🔑 Auth Context - Login réussi:", {
            userRole: userData.role,
            email: userData.email,
            currentPath: window.location.pathname
        });
    };

    const logout = () => {
        // Supprimer les informations utilisateur
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('user');
        localStorage.removeItem('csrfToken');
        
        // Réinitialiser l'état
        setUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setCsrfToken(null);
        
        // Mettre à jour le debug
        setDebugInfo({
            lastAction: "logout",
            timestamp: new Date().toISOString(),
            path: window.location.pathname
        });
        
        console.log("🚪 Auth Context - Déconnexion réussie");
    };

    const setCsrf = (token) => {
        localStorage.setItem('csrfToken', token);
        setCsrfToken(token);
    };

    // Modifier la logique de redirection des utilisateurs non authentifiés
    // Ajouter la liste des routes publiques qui ne nécessitent pas d'authentification
    const publicRoutes = [
        '/signin', 
        '/signup', 
        '/verification-pending', 
        '/signup-success', 
        '/code-verification', 
        '/verification',
        '/'
    ];

    // Si une fonction de redirection existe, s'assurer qu'elle n'intercepte pas les routes publiques
    // Par exemple, dans une fonction comme celle-ci :
    const checkAuthentication = (location) => {
        const path = location?.pathname || window.location.pathname;
        
        // Vérifier si l'utilisateur est sur une route publique
        const isPublicRoute = publicRoutes.some(route => 
            path === route || path.startsWith(route)
        );
        
        console.log("🛡️ Vérification d'authentification:", {
            path,
            isPublicRoute,
            isAuthenticated,
            shouldAllow: isPublicRoute || isAuthenticated
        });
        
        if (isPublicRoute) {
            return true; // Autorisé même sans authentification
        }
        
        // Sinon, vérifier l'authentification normalement
        return isAuthenticated;
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            userRole,
            user,
            csrfToken,
            login,
            logout,
            setCsrf,
            checkAuthentication,
            debugInfo,
            publicRoutes
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
}; 