import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {useNavigate} from "react-router-dom";
import axiosInstance from '../utils/axios';
import Alert from '@mui/material/Alert';

const theme = createTheme();

export default function SignUp() {
  const navigate = useNavigate();
  const [error, setError] = React.useState('');
  const [signupSuccess, setSignupSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [role, setRole] = React.useState('operateur');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData(e.currentTarget);

    const user = {
      first_name: data.get('firstName'),
      last_name: data.get('lastName'),
      email: data.get('email'),
      password: data.get('password'),
      phone_number: data.get('phoneNumber'),
      role: 'operateur'
    };

    const confirmPassword = data.get('confirmPassword');

    // Validation du mot de passe
    if (user.password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      console.log("📝 Début du processus d'inscription pour l'email:", user.email);
      
      // Debug - état initial
      console.log("🔍 État du localStorage avant inscription:", {
        contents: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      });
      
      const response = await axiosInstance.post('/api/auth/signup/', user);
      
      console.log("🎉 Inscription réussie:", {
        userData: response.data,
        email: user.email,
        timestamp: new Date().toISOString()
      });
      
      // Stocker l'email pour l'étape de vérification
      localStorage.setItem('pendingVerificationEmail', user.email);
      console.log("📝 Email stocké dans localStorage:", user.email);
      
      // Debug - vérifier le localStorage
      console.log("🔍 État du localStorage avant redirection:", {
        pendingVerificationEmail: localStorage.getItem('pendingVerificationEmail'),
        timestamp: new Date().toISOString()
      });
      
      // Utiliser une redirection directe avec window.location
      console.log("🔄 Lancement de la redirection vers /signup-success");
      
      try {
        window.location.href = '/signup-success';
        console.log("✅ Redirection initiée");
      } catch (error) {
        console.error("❌ Erreur lors de la redirection:", error);
        
        // En cas d'échec, essayer une autre approche
        setTimeout(() => {
          console.log("⚠️ Tentative de redirection avec reload...");
          window.location.replace('/signup-success');
        }, 500);
      }
      
    } catch (err) {
      console.error("❌ Erreur lors de l'inscription:", err);
      
      let errorMessage = "Une erreur est survenue lors de l'inscription.";
      
      if (err.response) {
        console.log("🛑 Détails de l'erreur:", {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
        
        // Extraction de messages d'erreur spécifiques
        if (err.response.data) {
          if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else if (err.response.data.email) {
            errorMessage = `Email: ${err.response.data.email}`;
          } else if (err.response.data.password) {
            errorMessage = `Mot de passe: ${err.response.data.password}`;
          }
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const redirectToSignIn = () => {
    navigate('/signin');
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Inscription
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  autoComplete="given-name"
                  name="firstName"
                  required
                  fullWidth
                  id="firstName"
                  label="Prénom"
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Nom"
                  name="lastName"
                  autoComplete="family-name"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="email"
                  label="Adresse email"
                  name="email"
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Mot de passe"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirmer le mot de passe"
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="phoneNumber"
                  label="Numéro de téléphone"
                  name="phoneNumber"
                  autoComplete="tel"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              S'inscrire
            </Button>
            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="#" onClick={redirectToSignIn} variant="body2">
                  Déjà un compte ? Se connecter
                </Link>
              </Grid>
            </Grid>
          </Box>
          <div className="auth-success" style={{ display: signupSuccess ? 'block' : 'none' }}>
            <p>
              <strong>{successMessage}</strong>
            </p>
            {role === 'operateur' && (
              <div className="verification-info">
                <h3>Processus de validation en deux étapes</h3>
                <ol>
                  <li>
                    <strong>Vérification de votre email :</strong> Un email contenant un lien de vérification 
                    a été envoyé à l'adresse que vous avez fournie. Veuillez cliquer sur ce lien pour vérifier votre adresse email.
                  </li>
                  <li>
                    <strong>Approbation par un administrateur :</strong> Une fois votre email vérifié, un administrateur 
                    examinera votre demande d'inscription. Vous recevrez une notification par email lorsque votre 
                    compte sera approuvé.
                  </li>
                  <li>
                    <strong>Code d'activation :</strong> Après l'approbation, vous recevrez un code d'activation par email. 
                    Vous devrez saisir ce code lors de votre prochaine connexion pour finaliser l'activation de votre compte.
                  </li>
                </ol>
                <p>
                  Veuillez vérifier régulièrement votre boîte de réception et vos spams pour les emails de vérification et d'activation.
                </p>
              </div>
            )}
          </div>
        </Box>
      </Container>
    </ThemeProvider>
  );
}