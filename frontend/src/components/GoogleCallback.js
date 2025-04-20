import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Récupérer le code d'autorisation de l'URL
                const searchParams = new URLSearchParams(location.search);
                const code = searchParams.get('code');

                if (!code) {
                    console.error('Code d\'autorisation manquant');
                    navigate('/login');
                    return;
                }

                // Envoyer le code au backend
                const response = await axios.post('http://localhost:8000/api/auth/google/callback/', {
                    code: code
                });

                // Stocker les tokens JWT
                const { access_token, refresh_token } = response.data;
                localStorage.setItem('access_token', access_token);
                localStorage.setItem('refresh_token', refresh_token);

                // Rediriger vers le dashboard
                navigate('/dashboard');
            } catch (error) {
                console.error('Erreur lors du callback Google:', error);
                navigate('/login');
            }
        };

        handleCallback();
    }, [navigate, location]);

    return (
        <div>
            Authentification en cours...
        </div>
    );
};

export default GoogleCallback; 