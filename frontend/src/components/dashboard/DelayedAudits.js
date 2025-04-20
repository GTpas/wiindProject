import React from 'react';
import { 
    Box, 
    Typography, 
    List, 
    ListItem, 
    ListItemText,
    ListItemIcon,
    Chip
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const DelayedAudits = ({ audits }) => {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                    Audits en Retard
                </Typography>
                <Chip 
                    label={`${audits.length} audits`}
                    color="error"
                    size="small"
                    sx={{ ml: 2 }}
                />
            </Box>

            <List>
                {audits.map((audit, index) => (
                    <ListItem 
                        key={index}
                        sx={{ 
                            bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                            borderRadius: 1
                        }}
                    >
                        <ListItemIcon>
                            <WarningIcon color="error" />
                        </ListItemIcon>
                        <ListItemText
                            primary={audit.title}
                            secondary={`${audit.daysOverdue} jours de retard`}
                            primaryTypographyProps={{
                                variant: 'subtitle2',
                                color: 'text.primary'
                            }}
                            secondaryTypographyProps={{
                                variant: 'caption',
                                color: 'error'
                            }}
                        />
                    </ListItem>
                ))}
            </List>

            {audits.length === 0 && (
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ textAlign: 'center', py: 2 }}
                >
                    Aucun audit en retard
                </Typography>
            )}
        </Box>
    );
};

export default DelayedAudits; 