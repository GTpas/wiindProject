import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Container, Paper, Button, TextField, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/CodeVerification.css';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axios';

function CodeVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const inputRefs = useRef([]);

  // Configurer les refs pour les inputs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Récupérer l'email depuis la state de navigation ou le localStorage
  useEffect(() => {
    const userEmail = location.state?.email || localStorage.getItem('pendingVerificationEmail');
    if (userEmail) {
      setEmail(userEmail);
      console.log("📧 Email pour vérification de code:", userEmail);
    } else {
      console.log("⚠️ Aucun email trouvé pour la vérification de code");
      // Rediriger vers la connexion si aucune email n'est trouvé
      navigate('/signin');
    }
  }, [location, navigate]);

  // Gérer la saisie des chiffres du code
  const handleCodeChange = (index, value) => {
    if (value.length > 1) {
      value = value[0]; // Limiter à un seul caractère
    }
    
    // Vérifier si c'est un chiffre
    if (value && !/^\d+$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Avancer automatiquement au prochain champ si celui-ci est rempli
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
    
    // Essayer de soumettre automatiquement si tous les champs sont remplis
    if (index === 5 && value !== '') {
      const allFilled = newCode.every(digit => digit !== '');
      if (allFilled) {
        // Attendre un peu pour éviter que la soumission soit trop rapide
        setTimeout(() => {
          handleSubmit(newCode.join(''));
        }, 300);
      }
    }
  };

  // Gérer la touche Backspace pour revenir au champ précédent
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Soumettre le code
  const handleSubmit = async (fullCodeParam) => {
    const fullCode = fullCodeParam || code.join('');
    
    if (fullCode.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log(`📤 Envoi du code ${fullCode} pour validation de l'email ${email}`);
      
      const response = await axiosInstance.post('/api/auth/verify-code/', {
        email: email,
        code: fullCode
      });

      console.log('✅ Code vérifié avec succès:', response.data);
      setSuccess('Code vérifié avec succès! Redirection en cours...');
      
      // Stocker le token d'authentification
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        
        // Mettre à jour le contexte d'authentification
        if (response.data.user_id && response.data.email && response.data.role) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userRole', response.data.role);
          localStorage.setItem('userEmail', response.data.email);
          
          // Mettre à jour le contexte d'authentification
          login({ 
            id: response.data.user_id, 
            email: response.data.email, 
            role: response.data.role 
          });
        }
      }
      
      // Nettoyer les données temporaires
      localStorage.removeItem('pendingVerificationEmail');
      
      // Rediriger vers la page appropriée après vérification réussie avec un délai
      setTimeout(() => {
        navigate(response.data.redirect_url || '/auditCanva');
      }, 1000);
    } catch (err) {
      console.error('❌ Erreur lors de la vérification du code:', err.response || err);
      setError(err.response?.data?.error || 'Erreur lors de la vérification du code. Veuillez réessayer.');
      
      // Vider les champs du code si le code est invalide
      if (err.response?.data?.error === 'Code invalide') {
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Annuler la vérification
  const handleCancel = () => {
    navigate('/signin');
  };

  return (
    <Container maxWidth="sm" className="code-verification-container">
      <Paper elevation={3} className="code-verification-paper">
        <Box textAlign="center" p={3}>
          <Typography variant="h4" gutterBottom>
            Plus qu'une étape !
          </Typography>
          
          <Typography variant="body1" paragraph>
            Un code de vérification a été envoyé à 
            <span className="email-highlight"> {email}</span>. Veuillez saisir ce code pour continuer.
          </Typography>

          <Box className="code-input-container" my={4}>
            {code.map((digit, index) => (
              <TextField
                key={index}
                inputRef={el => (inputRefs.current[index] = el)}
                variant="outlined"
                className="code-input"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                inputProps={{ maxLength: 1, className: "code-digit" }}
                autoFocus={index === 0}
                disabled={loading}
              />
            ))}
          </Box>

          {error && (
            <Typography color="error" variant="body2" paragraph>
              {error}
            </Typography>
          )}
          
          {success && (
            <Typography color="success.main" variant="body2" paragraph>
              {success}
            </Typography>
          )}

          <Box mt={4} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={loading}
              className="cancel-button"
            >
              ANNULER
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSubmit()}
              disabled={loading || code.some(digit => digit === '')}
              className="confirm-button"
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'VÉRIFICATION...' : 'CONFIRMER'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default CodeVerification; 