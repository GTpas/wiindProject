import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Paper, CircularProgress, Button } from '@mui/material';
import axios from 'axios';

function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }
    
    // Appeler l'API pour vérifier le token
    const verifyEmail = async () => {
      try {
        console.log(`🔑 Vérification du token: ${token}`);
        const response = await axios.get(`http://localhost:8000/api/auth/verify-email/${token}/`);
        
        console.log('✅ Email vérifié avec succès:', response.data);
        setStatus('success');
        setMessage(response.data.message || 'Votre email a été vérifié avec succès. Votre compte est maintenant en attente d\'approbation par un administrateur.');
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'email:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.error || 
          'Une erreur est survenue lors de la vérification de votre email. Veuillez réessayer ou contacter le support.'
        );
      }
    };
    
    verifyEmail();
  }, [token]);
  
  const handleBackToSignIn = () => {
    navigate('/signin');
  };
  
  return (
    <Container maxWidth="sm" sx={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Paper elevation={3} sx={{ width: '100%', borderRadius: '10px', overflow: 'hidden', padding: '30px' }}>
        <Box textAlign="center">
          {status === 'loading' && (
            <>
              <Typography variant="h4" color="primary" gutterBottom>
                Vérification en cours...
              </Typography>
              <Box my={4} display="flex" justifyContent="center">
                <CircularProgress size={60} thickness={4} />
              </Box>
              <Typography variant="body1">
                Nous vérifions votre adresse email. Veuillez patienter...
              </Typography>
            </>
          )}
          
          {status === 'success' && (
            <>
              <Typography variant="h4" color="primary" gutterBottom>
                Email vérifié avec succès !
              </Typography>
              <Box my={3} p={2} bgcolor="#e8f5e9" borderRadius={2}>
                <Typography variant="body1" fontWeight="bold" color="success.dark">
                  {message}
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Un administrateur va maintenant examiner votre demande d'inscription.
              </Typography>
              <Typography variant="body1" paragraph>
                Vous recevrez un email contenant un code d'activation lorsque votre compte sera approuvé.
              </Typography>
              <Box mt={3}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleBackToSignIn}
                >
                  Retour à la connexion
                </Button>
              </Box>
            </>
          )}
          
          {status === 'error' && (
            <>
              <Typography variant="h4" color="error" gutterBottom>
                Erreur de vérification
              </Typography>
              <Box my={3} p={2} bgcolor="#ffebee" borderRadius={2}>
                <Typography variant="body1" fontWeight="bold" color="error">
                  {message}
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                Vous pouvez essayer à nouveau en cliquant sur le lien dans votre email ou demander un nouveau lien de vérification.
              </Typography>
              <Box mt={3}>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleBackToSignIn}
                >
                  Retour à la connexion
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default VerifyEmail; 