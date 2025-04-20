import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    Search as SearchIcon,
    PlayArrow as PlayArrowIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';

const statusConfig = {
    completed: {
        label: 'Complété',
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />
    },
    inProgress: {
        label: 'En Cours',
        color: 'warning',
        icon: <ScheduleIcon fontSize="small" />
    },
    delayed: {
        label: 'En Retard',
        color: 'error',
        icon: <WarningIcon fontSize="small" />
    },
    pending: {
        label: 'En Attente',
        color: 'default',
        icon: <ScheduleIcon fontSize="small" />
    }
};

const RecentAudits = ({ audits, onAuditSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAudits = audits.filter(audit =>
        audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                    Audits Récents
                </Typography>
                <TextField
                    size="small"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 200 }}
                />
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nom de l'Audit</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Statut</TableCell>
                            <TableCell>Date d'Échéance</TableCell>
                            <TableCell>Progression</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAudits.map((audit, index) => {
                            const status = statusConfig[audit.status];
                            return (
                                <TableRow key={index} hover>
                                    <TableCell>{audit.title}</TableCell>
                                    <TableCell>{audit.type}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={status.icon}
                                            label={status.label}
                                            color={status.color}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(audit.dueDate)}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    mr: 1,
                                                    height: 8,
                                                    borderRadius: 4,
                                                    bgcolor: 'grey.200',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: `${audit.progress}%`,
                                                        height: '100%',
                                                        bgcolor: audit.status === 'delayed' ? 'error.main' : 'primary.main',
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {audit.progress}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="primary"
                                            onClick={() => onAuditSelect(audit)}
                                            disabled={audit.status === 'completed'}
                                        >
                                            <PlayArrowIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {filteredAudits.length === 0 && (
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ textAlign: 'center', py: 4 }}
                >
                    Aucun audit trouvé
                </Typography>
            )}
        </Box>
    );
};

export default RecentAudits; 