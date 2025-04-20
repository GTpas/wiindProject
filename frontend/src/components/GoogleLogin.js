import React from 'react';
import axios from 'axios';

const GoogleLogin = () => {
    const handleGoogleLogin = async () => {
        try {
            // Obtenir l'URL d'autorisation du backend
            const response = await axios.get('http://localhost:8000/api/auth/google/');
            const { authorization_url } = response.data;
            
            // Rediriger vers l'URL d'autorisation Google
            window.location.href = authorization_url;
        } catch (error) {
            console.error('Erreur lors de l\'authentification Google:', error);
        }
    };

    return (
        <button onClick={handleGoogleLogin}>
            Se connecter avec Google
        </button>
    );
};

export default GoogleLogin; 