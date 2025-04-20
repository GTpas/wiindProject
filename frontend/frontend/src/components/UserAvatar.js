import React, { useState, useEffect } from 'react';
import { 
  Avatar, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  Typography, 
  Divider, 
  Box, 
  Badge, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  AccountCircle, 
  Logout, 
  PhotoCamera, 
  Settings,
  Person,
  Email,
  Work
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axios';

const UserAvatar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const open = Boolean(anchorEl);
  
  // Récupérer les informations de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer l'email de l'utilisateur depuis localStorage
        const userEmail = localStorage.getItem('userEmail');
        
        if (!userEmail) {
          throw new Error('Utilisateur non connecté');
        }
        
        // Appel API pour récupérer les informations de l'utilisateur
        const response = await axiosInstance.get('/api/auth/user-profile/');
        setUserInfo(response.data);
        
      } catch (err) {
        console.error('Erreur lors de la récupération des informations utilisateur:', err);
        setError('Impossible de charger les informations utilisateur');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserInfo();
  }, []);
  
  // Ouvrir le menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Fermer le menu
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Ouvrir la boîte de dialogue pour modifier l'avatar
  const handleEditAvatar = () => {
    handleClose();
    setDialogOpen(true);
  };
  
  // Gérer le changement d'avatar
  const handleAvatarChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };
  
  // Enregistrer le nouvel avatar
  const handleSaveAvatar = async () => {
    if (!avatarFile) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await axiosInstance.post('/api/auth/update-avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Mettre à jour les infos utilisateur avec le nouvel avatar
      setUserInfo(response.data);
      
      // Fermer la boîte de dialogue
      setDialogOpen(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', err);
      setError('Impossible de mettre à jour l\'avatar');
    } finally {
      setLoading(false);
    }
  };
  
  // Gérer la déconnexion
  const handleLogout = () => {
    handleClose();
    
    try {
      // Appel de la fonction logout du contexte d'authentification
      logout();
      
      // Redirection vers la page de connexion
      navigate('/signin');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };
  
  // Générer les initiales de l'utilisateur pour l'avatar par défaut
  const getInitials = () => {
    if (!userInfo) return 'U';
    
    const firstName = userInfo.first_name || '';
    const lastName = userInfo.last_name || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };
  
  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Avatar
              sx={{
                width: 22,
                height: 22,
                bgcolor: '#1976d2',
                fontSize: '0.8rem',
                border: '2px solid white'
              }}
            >
              <PhotoCamera fontSize="small" />
            </Avatar>
          }
        >
          <Avatar
            sx={{ width: 56, height: 56, bgcolor: userInfo?.avatar_url ? 'transparent' : '#1976d2' }}
            src={userInfo?.avatar_url || ''}
            alt={userInfo?.first_name || 'Utilisateur'}
          >
            {!userInfo?.avatar_url && getInitials()}
          </Avatar>
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            mt: 1.5,
            width: 250,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{ width: 80, height: 80, mb: 1, bgcolor: userInfo?.avatar_url ? 'transparent' : '#1976d2' }}
            src={userInfo?.avatar_url || ''}
          >
            {!userInfo?.avatar_url && getInitials()}
          </Avatar>
          <Typography variant="h6">
            {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : 'Chargement...'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userInfo?.role === 'operateur' ? 'Opérateur' : 'Administrateur'}
          </Typography>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Person sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="body2">
              <strong>Nom:</strong> {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : '-'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Email sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="body2">
              <strong>Email:</strong> {userInfo?.email || '-'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Work sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="body2">
              <strong>Rôle:</strong> {userInfo?.role === 'operateur' ? 'Opérateur' : 'Administrateur'}
            </Typography>
          </Box>
        </Box>
        
        <Divider />
        
        <MenuItem onClick={handleEditAvatar}>
          <ListItemIcon>
            <PhotoCamera fontSize="small" />
          </ListItemIcon>
          Modifier l'avatar
        </MenuItem>
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Se déconnecter
        </MenuItem>
      </Menu>
      
      {/* Boîte de dialogue pour modifier l'avatar */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Modifier votre avatar</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton
                  color="primary"
                  aria-label="upload picture"
                  component="label"
                  sx={{ bgcolor: 'white' }}
                >
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <PhotoCamera />
                </IconButton>
              }
            >
              <Avatar
                sx={{ width: 100, height: 100 }}
                src={avatarPreview || userInfo?.avatar_url || ''}
              >
                {!avatarPreview && !userInfo?.avatar_url && getInitials()}
              </Avatar>
            </Badge>
          </Box>
          
          <Typography variant="body2" color="text.secondary" align="center">
            Cliquez sur l'icône de caméra pour sélectionner une image
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleSaveAvatar} 
            variant="contained" 
            disabled={!avatarFile || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserAvatar; 