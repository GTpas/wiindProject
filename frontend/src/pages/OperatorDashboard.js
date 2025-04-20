import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Typography, Paper } from '@mui/material';
import AuditStats from '../components/dashboard/AuditStats';
import AuditProgress from '../components/dashboard/AuditProgress';
import DelayedAudits from '../components/dashboard/DelayedAudits';
import RecentAudits from '../components/dashboard/RecentAudits';
import AuditExecution from '../components/audit/AuditExecution';

const OperatorDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        totalAudits: 0,
        inProgress: 0,
        completed: 0,
        delayed: 0,
        recentAudits: [],
        delayedAudits: []
    });

    const [selectedAudit, setSelectedAudit] = useState(null);

    useEffect(() => {
        // Charger les données du tableau de bord
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/audits/dashboard/');
            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ py: 4 }}>
                <Typography variant="h4" sx={{ mb: 4 }}>
                    Tableau de Bord Opérateur
                </Typography>

                <Grid container spacing={3}>
                    {/* Statistiques des audits */}
                    <Grid item xs={12}>
                        <AuditStats 
                            totalAudits={dashboardData.totalAudits}
                            inProgress={dashboardData.inProgress}
                            completed={dashboardData.completed}
                            delayed={dashboardData.delayed}
                        />
                    </Grid>

                    {/* Graphique de progression */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <AuditProgress />
                        </Paper>
                    </Grid>

                    {/* Audits en retard */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <DelayedAudits audits={dashboardData.delayedAudits} />
                        </Paper>
                    </Grid>

                    {/* Audits récents */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <RecentAudits 
                                audits={dashboardData.recentAudits}
                                onAuditSelect={setSelectedAudit}
                            />
                        </Paper>
                    </Grid>

                    {/* Interface d'exécution d'audit */}
                    {selectedAudit && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <AuditExecution 
                                    audit={selectedAudit}
                                    onComplete={() => {
                                        setSelectedAudit(null);
                                        fetchDashboardData();
                                    }}
                                />
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Container>
    );
};

export default OperatorDashboard; 