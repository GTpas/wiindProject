import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Container, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function SignupRedirect() {
  const [countdown, setCountdown] = useState(5);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const email = localStorage.getItem('pendingVerificationEmail');
    const currentLocation = window.location.href;
    
    console.log("🚀 SignupRedirect - Page chargée", {
      email,
      currentLocation,
      timestamp: new Date().toISOString()
    });
    
    // Marquer comme étant juste inscrit
    localStorage.setItem('justRegistered', 'true');
    
    // Décompte avant redirection
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        const newValue = prev - 1;
        console.log(`⏱️ Redirection dans ${newValue} secondes...`);
        return newValue;
      });
    }, 1000);
    
    // Utiliser une fonction de redirection après le délai
    const redirectTimeout = setTimeout(() => {
      performRedirect();
    }, 5000);
    
    // Nettoyage
    return () => {
      clearTimeout(redirectTimeout);
      clearInterval(countdownInterval);
      console.log("🧹 Nettoyage du composant SignupRedirect");
    };
  }, []);
  
  // Fonction pour effectuer la redirection de différentes manières
  const performRedirect = () => {
    setRedirectInProgress(true);
    
    console.log("🔄 Tentative de redirection vers verification-pending...");
    
    try {
      // Première approche : utiliser navigate
      navigate('/verification-pending');
      console.log("✅ Navigation initiée avec navigate");
      
      // Comme seconde sécurité, tenter une redirection directe après un court délai
      setTimeout(() => {
        if (window.location.pathname !== '/verification-pending') {
          console.log("⚠️ La navigation avec navigate a échoué, tentative avec window.location");
          window.location.href = '/verification-pending';
        }
      }, 500);
      
    } catch (error) {
      console.error("❌ Erreur lors de la redirection:", error);
      setRedirectFailed(true);
      setRedirectInProgress(false);
    }
  };
  
  // Fonction pour la redirection manuelle
  const handleManualRedirect = () => {
    console.log("👆 Redirection manuelle déclenchée");
    performRedirect();
  };
  
  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <Typography variant="h5" gutterBottom>
          Compte créé avec succès !
        </Typography>
        
        <Typography variant="body1" paragraph textAlign="center">
          {!redirectInProgress && !redirectFailed ? (
            `Vous allez être redirigé vers la page d'attente de vérification dans ${countdown} secondes...`
          ) : redirectFailed ? (
            "La redirection automatique a échoué."
          ) : (
            "Redirection en cours..."
          )}
        </Typography>
        
        <CircularProgress sx={{ mt: 3 }} />
        
        {(countdown <= 0 || redirectFailed) && (
          <Box mt={3}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleManualRedirect}
            >
              Cliquez ici pour continuer
            </Button>
          </Box>
        )}
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 3 }}>
          Si la redirection ne fonctionne pas, veuillez fermer cette page et vous connecter à nouveau.
        </Typography>
      </Box>
    </Container>
  );
}

export default SignupRedirect; 