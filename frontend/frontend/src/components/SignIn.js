import React, { useState } from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginIcon from '@mui/icons-material/Login';
import GoogleIcon from '@mui/icons-material/Google';
import {
  Box, Card, CardContent, Typography, TextField,
  FormControlLabel, Checkbox, Button, Link, Grid,
  InputAdornment, Alert
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { useAuth } from '../contexts/AuthContext';

const theme = createTheme();

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      // Essayer de se connecter avec les identifiants fournis
      const response = await axiosInstance.post('/api/auth/signin/', {
        email,
        password
      });
      
      console.log("✅ Réponse de connexion:", response.data);
      
      // Mise à jour du contexte d'authentification
      login(response.data.user);
      
      // Stocker explicitement les données d'authentification
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', response.data.user.role);
      localStorage.setItem('userEmail', response.data.user.email);
      
      console.log("🔑 Connecté en tant que:", {
        email: response.data.user.email,
        role: response.data.user.role,
        redirect: response.data.redirect_url
      });
      
      // Redirection vers la page appropriée
      navigate(response.data.redirect_url);
    } catch (err) {
      console.error('❌ Erreur de connexion:', err.response);
      
      // Test pour vérifier l'utilisateur et l'état de son compte
      if (err.response) {
        console.log('🔍 Détails de l\'erreur:', {
          status: err.response.status,
          data: err.response.data
        });
        
        // Gestion spéciale pour le cas où un code d'activation est requis (403)
        if (err.response.status === 403) {
          const { status, email } = err.response.data;
          
          console.log('🔑 Type d\'erreur 403:', status);
          
          if (status === 'approval_code_required' && email) {
            console.log("🔄 Redirection vers la page de vérification du code pour:", email);
            
            // Stocker l'email pour la page de vérification
            localStorage.setItem('pendingVerificationEmail', email);
            
            // Rediriger vers la page de vérification du code avec un délai
            setTimeout(() => {
              navigate('/code-verification');
            }, 100);
            return;
          }
        }
      }
      
      setError(err.response?.data?.error || "Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  const redirectToSignUp = () => {
    navigate('/signup');
  };

  const handleGoogleLogin = () => {
    window.location.href = `${axiosInstance.defaults.baseURL}/api/auth/google/`;
  };

  // Fonction pour faciliter le test de vérification de code
  const goToCodeVerification = () => {
    localStorage.setItem('pendingVerificationEmail', email);
    navigate('/code-verification');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Card sx={{ width: 400, p: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <LockOutlinedIcon sx={{ color: '#1976d2', fontSize: 40 }} />
              <Typography variant="h5" align="center" sx={{ mt: 1, fontWeight: 'bold' }}>
                Connexion
              </Typography>
            </Box>

            <Typography variant="body2" align="center" color="text.secondary">
              Connectez-vous à votre compte
            </Typography>

            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LoginIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FormControlLabel
                control={<Checkbox value="remember" color="primary" />}
                label="Se souvenir de moi"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                <LoginIcon sx={{ mr: 1 }} />
                Connexion
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={goToCodeVerification}
                  sx={{ mb: 2 }}
                >
                  Aller directement à la vérification du code (DEV)
                </Button>
              )}

              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                sx={{ mb: 2 }}
                startIcon={<GoogleIcon />}
              >
                Se connecter avec Google
              </Button>

              <Grid container justifyContent="space-between">
                <Grid item>
                  <Link href="#" variant="body2">
                    Mot de passe oublié ?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="#" onClick={redirectToSignUp} variant="body2">
                    Pas encore de compte ? Inscrivez-vous
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}
