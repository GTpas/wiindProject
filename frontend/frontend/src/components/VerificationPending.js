import React, { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress, Paper, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/VerificationPending.css';

function VerificationPending() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isJustRegistered, setIsJustRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Enregistrer le chargement initial
    console.log("🌟 VerificationPending - Chargement initial", {
      url: window.location.href,
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    });
    
    // Fonction pour récupérer les informations utilisateur
    const loadUserInfo = () => {
      // Récupérer l'email depuis location.state ou localStorage
      const userEmail = location.state?.email || localStorage.getItem('pendingVerificationEmail');
      
      // Vérifier si l'utilisateur vient de s'inscrire
      const justRegistered = localStorage.getItem('justRegistered');
      
      console.log("📋 VerificationPending - Données récupérées", {
        userEmail,
        justRegistered,
        localStorage: {
          pendingVerificationEmail: localStorage.getItem('pendingVerificationEmail'),
          justRegistered: localStorage.getItem('justRegistered')
        }
      });
      
      if (userEmail) {
        setEmail(userEmail);
        setIsJustRegistered(justRegistered === 'true');
        
        console.log("✅ VerificationPending - Email trouvé:", userEmail);
        
        // Une fois lu, on peut supprimer le marqueur justRegistered
        if (justRegistered === 'true') {
          localStorage.removeItem('justRegistered');
          console.log("🧹 VerificationPending - Marqueur justRegistered supprimé");
        }
      } else {
        console.log("⚠️ VerificationPending - Aucun email trouvé");
      }
      
      setIsLoading(false);
    };

    // Utiliser un court délai pour s'assurer que localStorage est bien disponible
    // surtout après une redirection
    const timer = setTimeout(() => {
      loadUserInfo();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [location]);

  // Handler pour le bouton de retour à la connexion
  const handleBackToSignIn = () => {
    console.log("🔙 VerificationPending - Retour à la connexion demandé");
    navigate('/signin');
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" className="verification-container">
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" className="verification-container">
      <Paper elevation={3} className="verification-paper">
        <Box textAlign="center" p={4}>
          <Typography variant="h4" color="primary" gutterBottom>
            Compte en attente de vérification
          </Typography>
          
          <Box my={4} display="flex" justifyContent="center">
            <CircularProgress size={60} thickness={4} />
          </Box>
          
          {isJustRegistered && (
            <Box mb={3} p={2} bgcolor="#e8f5e9" borderRadius={2}>
              <Typography variant="body1" fontWeight="bold" color="success.dark">
                Félicitations ! Votre compte a été créé avec succès.
              </Typography>
            </Box>
          )}
          
          <Typography variant="body1" paragraph>
            {email 
              ? <span>Votre compte <strong>({email})</strong> est en attente de vérification.</span>
              : <span>Votre compte est en attente de vérification.</span>
            } 
            Veuillez vérifier votre email pour confirmer votre adresse.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Une fois votre adresse email confirmée, un administrateur examinera votre demande d'inscription.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Vous recevrez un email contenant un code d'activation à 6 chiffres une fois que votre compte sera approuvé.
          </Typography>
          
          <Box mt={3} p={2} bgcolor="#f5f5f5" borderRadius={1}>
            <Typography variant="body2" color="textSecondary">
              <strong>Note :</strong> Si vous n'avez pas reçu d'email dans les prochaines minutes, veuillez vérifier votre dossier de spam ou contacter notre support.
            </Typography>
          </Box>
          
          <Box mt={3}>
            <Button 
              variant="outlined" 
              color="primary"
              onClick={handleBackToSignIn}
            >
              Retour à la connexion
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default VerificationPending; 