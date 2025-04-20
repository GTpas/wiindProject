import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  LinearProgress,
  Alert,
  Tab,
  Tabs,
  Divider
} from '@mui/material';
import {
  Assessment,
  Timeline,
  CheckCircle,
  Warning,
  ArrowUpward,
  PlayArrow,
  Refresh,
  Sync,
  SyncDisabled
} from '@mui/icons-material';
import axiosInstance from '../utils/axios';
import AuditProgress from './AuditProgress';
import AuditExecution from './AuditExecution';
import UserAvatar from './UserAvatar';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color={color}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {React.createElement(icon, { style: { color, fontSize: 40 } })}
      </Box>
    </CardContent>
  </Card>
);

const DelayedAuditCard = ({ audit }) => (
  <Card sx={{ mb: 1, bgcolor: audit.days_overdue > 3 ? '#fff3f0' : '#fff8f0' }}>
    <CardContent>
      <Typography variant="h6">{audit.title}</Typography>
      <Typography color="error" variant="body2">
        {audit.days_overdue} jours de retard
      </Typography>
    </CardContent>
  </Card>
);

const AuditTable = ({ audits, onExecuteAudit }) => (
  <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Nom de l'audit</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Statut</TableCell>
          <TableCell>Progression</TableCell>
          <TableCell>Date limite</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {audits.map((audit) => (
          <TableRow key={audit.id}>
            <TableCell>{audit.title}</TableCell>
            <TableCell>{audit.type_display}</TableCell>
            <TableCell>{audit.status_display}</TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                <LinearProgress
                  variant="determinate"
                  value={audit.progress}
                  sx={{ width: '100%', mr: 1 }}
                />
                <Typography variant="body2">{audit.progress}%</Typography>
              </Box>
            </TableCell>
            <TableCell>
              {new Date(audit.due_date).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => onExecuteAudit(audit.id)}
                disabled={audit.status === 'completed'}
                size="small"
              >
                Exécuter
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const AuditPageCanva = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total_audits: 0,
      in_progress: 0,
      completed: 0,
      delayed: 0
    },
    recent_audits: [],
    delayed_audits: []
  });
  
  const [operatorAudits, setOperatorAudits] = useState([]);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Intervalle pour le rafraîchissement automatique
  useEffect(() => {
    // Premier chargement des données
    fetchData();
    
    // Mettre en place un rafraîchissement périodique si autoRefresh est activé
    let intervalId = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchData(false); // Rafraîchir sans montrer l'indicateur de chargement
      }, 10000); // Rafraîchir toutes les 10 secondes
    }
    
    // Nettoyer l'intervalle lorsque le composant est démonté
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh]);
  
  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      // Récupérer les données du tableau de bord
      const dashboardResponse = await axiosInstance.get('/api/audits/dashboard/');
      setDashboardData(dashboardResponse.data);
      
      // Récupérer les audits de l'opérateur
      const auditsResponse = await axiosInstance.get('/api/operator-audits/');
      setOperatorAudits(auditsResponse.data);
      
    } catch (err) {
      setError("Erreur lors du chargement des données: " + 
              (err.response?.data?.error || err.message));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Si on revient au tableau de bord, désélectionner l'audit
    if (newValue === 0) {
      setSelectedAuditId(null);
    }
  };
  
  const handleExecuteAudit = (auditId) => {
    setSelectedAuditId(auditId);
    setActiveTab(1);
  };
  
  const handleAuditComplete = () => {
    // Rafraîchir les données et revenir au tableau de bord
    fetchData();
    setSelectedAuditId(null);
    setActiveTab(0);
  };
  
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };
  
  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Chargement des données...</Typography>
      </Box>
    );
  }
  
  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography variant="h4" component="h1">
            Gestion des Audits
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Refresh />}
              onClick={() => fetchData()}
              disabled={loading}
              size="small"
            >
              Mise à jour en temps réel
            </Button>
            
            <Button
              variant="outlined"
              color={autoRefresh ? "primary" : "default"}
              startIcon={autoRefresh ? 
                <Sync sx={{ animation: 'spin 2s linear infinite' }} /> : 
                <SyncDisabled />
              }
              onClick={toggleAutoRefresh}
              size="small"
            >
              {autoRefresh ? "Actif" : "Manuel"}
            </Button>
            
            <UserAvatar />
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <Button 
              size="small" 
              sx={{ ml: 2 }} 
              startIcon={<Refresh />}
              onClick={() => fetchData()}
            >
              Réessayer
            </Button>
          </Alert>
        )}
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Tableau de Bord" />
          <Tab label="Exécution d'Audit" disabled={!selectedAuditId} />
        </Tabs>
        
        {activeTab === 0 ? (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Audits"
                  value={dashboardData.stats.total_audits}
                  icon={Assessment}
                  color="primary.main"
                  subtitle={
                    <span>
                      <ArrowUpward fontSize="small" sx={{ verticalAlign: 'middle' }} />
                      1.2% vs dernier mois
                    </span>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="En cours"
                  value={dashboardData.stats.in_progress}
                  icon={Timeline}
                  color="#2196f3"
                  subtitle="Audits actifs"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Terminés"
                  value={dashboardData.stats.completed}
                  icon={CheckCircle}
                  color="success.main"
                  subtitle="Cette année"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="En retard"
                  value={dashboardData.stats.delayed}
                  icon={Warning}
                  color="error.main"
                  subtitle="Requiert attention"
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Progression des audits
                  </Typography>
                  <AuditProgress />
                </Paper>
                
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Audits récents
                  </Typography>
                  <AuditTable 
                    audits={operatorAudits} 
                    onExecuteAudit={handleExecuteAudit}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Audits en retard
                  </Typography>
                  
                  {dashboardData.delayed_audits.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Aucun audit en retard. Bon travail!
                    </Typography>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Audit</TableCell>
                          <TableCell>Jours de retard</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData.delayed_audits.map((audit) => (
                          <TableRow key={audit.id}>
                            <TableCell>{audit.title}</TableCell>
                            <TableCell sx={{ color: 'error.main' }}>
                              {audit.days_overdue} jours
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : (
          <Paper sx={{ p: 3 }}>
            <AuditExecution 
              auditId={selectedAuditId} 
              onComplete={handleAuditComplete}
            />
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default AuditPageCanva;
