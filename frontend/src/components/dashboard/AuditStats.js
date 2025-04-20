import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { 
    Timeline as TimelineIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Assessment as AssessmentIcon 
} from '@mui/icons-material';

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Paper sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box sx={{ 
                backgroundColor: `${color}15`, 
                borderRadius: '50%', 
                p: 1, 
                mr: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="h6" component="div">
                    {title}
                </Typography>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
                    {value}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    </Paper>
);

const AuditStats = ({ totalAudits, inProgress, completed, delayed }) => {
    const stats = [
        {
            title: 'Total Audits',
            value: totalAudits,
            icon: <AssessmentIcon sx={{ color: '#2196f3' }} />,
            color: '#2196f3',
            subtitle: `↑12% vs mois dernier`
        },
        {
            title: 'En Cours',
            value: inProgress,
            icon: <TimelineIcon sx={{ color: '#ff9800' }} />,
            color: '#ff9800',
            subtitle: 'Audits actifs'
        },
        {
            title: 'Complétés',
            value: completed,
            icon: <CheckCircleIcon sx={{ color: '#4caf50' }} />,
            color: '#4caf50',
            subtitle: 'Cette année'
        },
        {
            title: 'En Retard',
            value: delayed,
            icon: <WarningIcon sx={{ color: '#f44336' }} />,
            color: '#f44336',
            subtitle: 'Requiert attention'
        }
    ];

    return (
        <Grid container spacing={3}>
            {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <StatCard {...stat} />
                </Grid>
            ))}
        </Grid>
    );
};

export default AuditStats; 