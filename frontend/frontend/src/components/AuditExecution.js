import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  TextField, 
  Card, 
  CardContent,
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel,
  CircularProgress,
  Alert,
  LinearProgress,
  Grid,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HelpOutline,
  ArrowBack,
  ArrowForward,
  PhotoCamera,
  Save,
  Done,
  Refresh
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';

const AuditExecution = ({ auditId, onComplete }) => {
  const [audit, setAudit] = useState(null);
  const [reperes, setReperes] = useState([]);
  const [currentRepereIndex, setCurrentRepereIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  
  // État pour le contrôle du repère actuel
  const [repereControl, setRepereControl] = useState({
    valeur_reelle: '',
    statut: '',
    commentaire: '',
    image: null
  });
  
  // Charger les détails de l'audit
  useEffect(() => {
    if (!auditId) return;
    
    const fetchAuditDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get(`/api/audits/${auditId}/execution/`);
        setAudit(response.data.audit);
        setReperes(response.data.reperes);
        
        // Trouver le premier repère non contrôlé pour commencer
        const firstUncontrolledIndex = response.data.reperes.findIndex(
          repere => !repere.controle
        );
        setCurrentRepereIndex(firstUncontrolledIndex !== -1 ? firstUncontrolledIndex : 0);
        
      } catch (err) {
        setError("Impossible de charger les détails de l'audit: " + 
                (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditDetails();
  }, [auditId]);
  
  // Gestion des changements de contrôle
  const handleControlChange = (field, value) => {
    setRepereControl(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gestion de l'upload d'image
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRepereControl(prev => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };
  
  // Soumettre le contrôle du repère actuel
  const saveRepereControl = async () => {
    if (!reperes[currentRepereIndex]) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const repereId = reperes[currentRepereIndex].id;
      const formData = new FormData();
      
      formData.append('valeur_reelle', repereControl.valeur_reelle);
      formData.append('statut', repereControl.statut);
      formData.append('commentaire', repereControl.commentaire);
      
      if (repereControl.image) {
        formData.append('image', repereControl.image);
      }
      
      const response = await axiosInstance.post(
        `/api/reperes/${repereId}/control/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Mettre à jour le repère dans la liste
      const updatedReperes = [...reperes];
      updatedReperes[currentRepereIndex] = {
        ...updatedReperes[currentRepereIndex],
        controle: response.data
      };
      
      setReperes(updatedReperes);
      setSuccess("Contrôle enregistré avec succès");
      
      // Réinitialiser le formulaire pour le prochain repère
      setRepereControl({
        valeur_reelle: '',
        statut: '',
        commentaire: '',
        image: null
      });
      
      // Actualiser les données de l'audit pour mettre à jour la progression
      const auditResponse = await axiosInstance.get(`/api/audits/${auditId}/execution/`);
      setAudit(auditResponse.data.audit);
      
    } catch (err) {
      setError("Impossible d'enregistrer le contrôle: " + 
              (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  // Régénérer les repères pour cet audit
  const regenerateReperes = async () => {
    try {
      setRegenerating(true);
      setError(null);
      
      const response = await axiosInstance.post(`/api/audits/${auditId}/regenerate-reperes/`);
      
      setAudit(response.data.audit);
      setReperes(response.data.reperes);
      setCurrentRepereIndex(0);
      setSuccess("Repères régénérés avec succès!");
      
      // Réinitialiser le formulaire
      setRepereControl({
        valeur_reelle: '',
        statut: '',
        commentaire: '',
        image: null
      });
      
    } catch (err) {
      setError("Impossible de régénérer les repères: " + 
              (err.response?.data?.error || err.message));
    } finally {
      setRegenerating(false);
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };
  
  // Navigation entre les repères
  const goToNextRepere = () => {
    if (currentRepereIndex < reperes.length - 1) {
      setCurrentRepereIndex(currentRepereIndex + 1);
      
      // Si le repère suivant a déjà un contrôle, préremplir le formulaire
      const nextRepere = reperes[currentRepereIndex + 1];
      if (nextRepere.controle) {
        setRepereControl({
          valeur_reelle: nextRepere.controle.valeur_reelle || '',
          statut: nextRepere.controle.statut || '',
          commentaire: nextRepere.controle.commentaire || '',
          image: null
        });
      } else {
        // Réinitialiser le formulaire
        setRepereControl({
          valeur_reelle: '',
          statut: '',
          commentaire: '',
          image: null
        });
      }
    }
  };
  
  const goToPreviousRepere = () => {
    if (currentRepereIndex > 0) {
      setCurrentRepereIndex(currentRepereIndex - 1);
      
      // Préremplir le formulaire avec les valeurs du repère précédent
      const prevRepere = reperes[currentRepereIndex - 1];
      if (prevRepere.controle) {
        setRepereControl({
          valeur_reelle: prevRepere.controle.valeur_reelle || '',
          statut: prevRepere.controle.statut || '',
          commentaire: prevRepere.controle.commentaire || '',
          image: null
        });
      } else {
        // Réinitialiser le formulaire
        setRepereControl({
          valeur_reelle: '',
          statut: '',
          commentaire: '',
          image: null
        });
      }
    }
  };
  
  // Compléter l'audit
  const completeAudit = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await axiosInstance.post(`/api/audits/${auditId}/execution/`);
      
      setSuccess("Audit complété avec succès");
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000);
      
    } catch (err) {
      setError("Impossible de compléter l'audit: " + 
              (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };
  
  // Rendu du composant
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Chargement des données de l'audit...</Typography>
      </Box>
    );
  }
  
  if (error && !audit) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!audit) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1">
          Veuillez sélectionner un audit à exécuter.
        </Typography>
      </Box>
    );
  }
  
  const currentRepere = reperes[currentRepereIndex];
  const isCompleted = audit.status === 'completed';
  const allReperesControlled = reperes.every(repere => repere.controle);
  const noReperes = reperes.length === 0;
  
  // Si aucun repère n'est trouvé, afficher un message et un bouton pour régénérer
  if (noReperes) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Aucun repère trouvé pour cet audit. Veuillez régénérer les repères pour commencer l'audit.
        </Alert>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={regenerateReperes}
          disabled={regenerating}
          sx={{ mt: 2 }}
        >
          {regenerating ? <CircularProgress size={24} /> : "Générer les repères pour cet audit"}
        </Button>
        
        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {success}
          </Alert>
        )}
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Exécution d'Audit: {audit.title}
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={audit.progress} 
              sx={{ mb: 2, height: 10, borderRadius: 5 }}
            />
            <Typography variant="body1" textAlign="center" fontWeight="bold">
              Progression: {audit.progress}% ({reperes.filter(r => r.controle).length}/{reperes.length} repères contrôlés)
            </Typography>
          </Box>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        
        {success && (
          <Grid item xs={12}>
            <Alert severity="success">{success}</Alert>
          </Grid>
        )}
        
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Repère #{currentRepere?.numero}: {currentRepere?.nom}
              </Typography>
              
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Description technique:
                </Typography>
                <Typography variant="body2" paragraph style={{ whiteSpace: 'pre-line' }}>
                  {currentRepere?.description || "Aucune description disponible"}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 2, bgcolor: '#fffde7', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Valeur théorique: <span style={{ color: '#1976d2' }}>{currentRepere?.valeur_theorique || "N/A"}</span>
                </Typography>
                
                {currentRepere?.controle && (
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold"
                    color={
                      currentRepere.controle.statut === 'conforme' ? 'success.main' : 
                      currentRepere.controle.statut === 'non_conforme' ? 'error.main' : 
                      'text.secondary'
                    }
                  >
                    Statut: {
                      currentRepere.controle.statut === 'conforme' ? 'Conforme' : 
                      currentRepere.controle.statut === 'non_conforme' ? 'Non Conforme' : 
                      'Non Applicable'
                    }
                  </Typography>
                )}
              </Box>
              
              {currentRepere?.controle?.image_url && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Image du contrôle:
                  </Typography>
                  <img 
                    src={currentRepere.controle.image_url} 
                    alt="Image du contrôle" 
                    style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #e0e0e0', borderRadius: '4px' }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Navigation entre repères ({currentRepereIndex + 1}/{reperes.length}):
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="outlined" 
                startIcon={<ArrowBack />}
                onClick={goToPreviousRepere}
                disabled={currentRepereIndex === 0 || saving}
              >
                Précédent
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<Refresh />}
                onClick={regenerateReperes}
                disabled={regenerating || saving}
              >
                Régénérer les repères
              </Button>
              
              <Button 
                variant="outlined" 
                endIcon={<ArrowForward />}
                onClick={goToNextRepere}
                disabled={currentRepereIndex === reperes.length - 1 || saving}
              >
                Suivant
              </Button>
            </Box>
          </Box>
          
          {/* Indicateurs de progression des repères */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              État des repères:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {reperes.map((repere, index) => (
                <Box 
                  key={repere.id}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: index === currentRepereIndex
                      ? '#1976d2'
                      : repere.controle
                        ? repere.controle.statut === 'conforme'
                          ? '#4caf50'
                          : repere.controle.statut === 'non_conforme'
                            ? '#f44336'
                            : '#ffeb3b'
                        : '#e0e0e0',
                    color: index === currentRepereIndex || !repere.controle ? '#fff' : '#000',
                    cursor: 'pointer',
                    border: '1px solid #ccc',
                  }}
                  onClick={() => setCurrentRepereIndex(index)}
                >
                  {repere.numero}
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Contrôle du repère
            </Typography>
            
            <TextField
              label="Valeur réelle"
              type="number"
              value={repereControl.valeur_reelle}
              onChange={(e) => handleControlChange('valeur_reelle', e.target.value)}
              fullWidth
              margin="normal"
              disabled={isCompleted || saving}
              InputProps={{
                endAdornment: <Typography variant="caption" color="textSecondary">
                  Valeur théorique: {currentRepere?.valeur_theorique || "N/A"}
                </Typography>
              }}
            />
            
            <FormControl component="fieldset" sx={{ mt: 2 }} fullWidth>
              <FormLabel component="legend">Statut</FormLabel>
              <RadioGroup
                value={repereControl.statut}
                onChange={(e) => handleControlChange('statut', e.target.value)}
              >
                <FormControlLabel 
                  value="conforme" 
                  control={<Radio color="success" />} 
                  label="Conforme" 
                  disabled={isCompleted || saving}
                />
                <FormControlLabel 
                  value="non_conforme" 
                  control={<Radio color="error" />} 
                  label="Non Conforme" 
                  disabled={isCompleted || saving}
                />
                <FormControlLabel 
                  value="na" 
                  control={<Radio />} 
                  label="Non Applicable" 
                  disabled={isCompleted || saving}
                />
              </RadioGroup>
            </FormControl>
            
            <TextField
              label="Commentaire"
              multiline
              rows={3}
              value={repereControl.commentaire}
              onChange={(e) => handleControlChange('commentaire', e.target.value)}
              fullWidth
              margin="normal"
              disabled={isCompleted || saving}
            />
            
            <Box sx={{ mt: 2, mb: 3 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload"
                type="file"
                onChange={handleImageChange}
                disabled={isCompleted || saving}
              />
              <label htmlFor="image-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  disabled={isCompleted || saving}
                  fullWidth
                >
                  {repereControl.image ? "Changer l'image" : "Ajouter une image"}
                </Button>
              </label>
              {repereControl.image && (
                <Typography variant="caption" display="block" mt={1}>
                  Image sélectionnée: {repereControl.image.name}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={saveRepereControl}
                disabled={
                  isCompleted ||
                  saving ||
                  !repereControl.valeur_reelle ||
                  !repereControl.statut
                }
                fullWidth
              >
                {saving ? <CircularProgress size={24} /> : "Enregistrer le contrôle"}
              </Button>
            </Box>
          </Paper>
          
          {allReperesControlled && !isCompleted && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Done />}
                onClick={completeAudit}
                disabled={saving}
                fullWidth
              >
                {saving ? <CircularProgress size={24} /> : "Terminer l'audit"}
              </Button>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditExecution; 