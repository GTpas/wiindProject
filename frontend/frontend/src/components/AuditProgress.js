import React, { useState, useEffect } from 'react';
import { Box, Typography, ButtonGroup, Button } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axiosInstance from '../utils/axios';

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
  const [period, setPeriod] = useState('month');
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressData();
  }, [period]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosInstance.get(`/api/audits/progress/?period=${period}`);
      setProgressData(response.data);
      
    } catch (err) {
      console.error("Erreur lors du chargement des données de progression:", err);
      setError("Impossible de charger les données de progression");
    } finally {
      setLoading(false);
    }
  };

  // Configuration du graphique
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  // Préparer les données pour le graphique
  const chartData = {
    labels: progressData.map(item => item.date),
    datasets: [
      {
        label: 'Progression',
        data: progressData.map(item => item.progress),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Objectif',
        data: progressData.map(item => item.target),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        borderDash: [5, 5],
        tension: 0.1,
      }
    ],
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
      
      <Box sx={{ height: 300, position: 'relative' }}>
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 2
            }}
          >
            <Typography>Chargement des données...</Typography>
          </Box>
        )}
        
        {error && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.7)',
              zIndex: 2
            }}
          >
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {progressData.length > 0 && (
          <Line options={options} data={chartData} />
        )}
      </Box>
    </Box>
  );
};

export default AuditProgress; 