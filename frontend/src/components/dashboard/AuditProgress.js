import React, { useState, useEffect } from 'react';
import { Box, Typography, ButtonGroup, Button } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AuditProgress = () => {
    const [period, setPeriod] = useState('week');
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        fetchChartData();
    }, [period]);

    const fetchChartData = async () => {
        try {
            const response = await fetch(`/api/audits/progress/?period=${period}`);
            const data = await response.json();
            
            setChartData({
                labels: data.labels,
                datasets: [
                    {
                        label: 'Audits Complétés',
                        data: data.completed,
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Audits en Cours',
                        data: data.inProgress,
                        borderColor: '#ff9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Audits en Retard',
                        data: data.delayed,
                        borderColor: '#f44336',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            });
        } catch (error) {
            console.error('Erreur lors du chargement des données du graphique:', error);
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Progression des Audits
                </Typography>
                <ButtonGroup size="small">
                    <Button 
                        variant={period === 'week' ? 'contained' : 'outlined'}
                        onClick={() => setPeriod('week')}
                    >
                        Semaine
                    </Button>
                    <Button 
                        variant={period === 'month' ? 'contained' : 'outlined'}
                        onClick={() => setPeriod('month')}
                    >
                        Mois
                    </Button>
                    <Button 
                        variant={period === 'year' ? 'contained' : 'outlined'}
                        onClick={() => setPeriod('year')}
                    >
                        Année
                    </Button>
                </ButtonGroup>
            </Box>

            <Box sx={{ height: 300 }}>
                {chartData && <Line data={chartData} options={options} />}
            </Box>
        </Box>
    );
};

export default AuditProgress; 