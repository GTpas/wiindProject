import axios from 'axios';
import { getCsrfToken } from './csrf';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',  // URL de votre backend Django
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Intercepteur pour ajouter automatiquement le token CSRF à toutes les requêtes
axiosInstance.interceptors.request.use(
    (config) => {
        // Ajouter le token CSRF
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers['X-CSRFToken'] = csrfToken;
        }
        
        // Ajouter le token JWT si disponible
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les réponses et les erreurs
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('Axios error interceptor:', error.response);
        
        // Si vous souhaitez ajouter une gestion spéciale des erreurs, vous pouvez le faire ici
        // Par exemple, rediriger vers la page de connexion en cas d'erreur 401
        
        return Promise.reject(error);
    }
);

export default axiosInstance; 