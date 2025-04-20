import React, { useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    TextField,
    Button,
    ButtonGroup,
    IconButton,
    Grid,
    Paper,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    RemoveCircle as RemoveCircleIcon,
    PhotoCamera as PhotoCameraIcon,
    Upload as UploadIcon,
} from '@mui/icons-material';

const ValidationButton = ({ status, onClick, label, icon, color }) => (
    <Button
        variant={status ? "contained" : "outlined"}
        color={color}
        onClick={onClick}
        startIcon={icon}
        sx={{ minWidth: '120px' }}
    >
        {label}
    </Button>
);

const AuditExecution = ({ audit, onComplete }) => {
    const [standards, setStandards] = useState(audit.standards.map(standard => ({
        ...standard,
        status: null,
        comment: '',
        images: []
    })));

    const handleStatusChange = (index, status) => {
        const newStandards = [...standards];
        newStandards[index].status = status;
        setStandards(newStandards);
    };

    const handleCommentChange = (index, comment) => {
        const newStandards = [...standards];
        newStandards[index].comment = comment;
        setStandards(newStandards);
    };

    const handleImageUpload = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await fetch('/api/audits/upload-image/', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                const newStandards = [...standards];
                newStandards[index].images.push(data.imageUrl);
                setStandards(newStandards);
            }
        } catch (error) {
            console.error('Erreur lors du téléchargement de l\'image:', error);
        }
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`/api/audits/${audit.id}/validate/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ standards }),
            });

            if (response.ok) {
                onComplete();
            }
        } catch (error) {
            console.error('Erreur lors de la validation de l\'audit:', error);
        }
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Exécution de l'Audit: {audit.title}
            </Typography>

            <List>
                {standards.map((standard, index) => (
                    <Paper key={index} sx={{ mb: 2, p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    {standard.description}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <ButtonGroup sx={{ mb: 2 }}>
                                    <ValidationButton
                                        status={standard.status === 'OK'}
                                        onClick={() => handleStatusChange(index, 'OK')}
                                        label="OK"
                                        icon={<CheckCircleIcon />}
                                        color="success"
                                    />
                                    <ValidationButton
                                        status={standard.status === 'NOK'}
                                        onClick={() => handleStatusChange(index, 'NOK')}
                                        label="Non OK"
                                        icon={<CancelIcon />}
                                        color="error"
                                    />
                                    <ValidationButton
                                        status={standard.status === 'NA'}
                                        onClick={() => handleStatusChange(index, 'NA')}
                                        label="N/A"
                                        icon={<RemoveCircleIcon />}
                                        color="info"
                                    />
                                </ButtonGroup>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Commentaires"
                                    value={standard.comment}
                                    onChange={(e) => handleCommentChange(index, e.target.value)}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <input
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id={`image-upload-${index}`}
                                        type="file"
                                        onChange={(e) => handleImageUpload(index, e)}
                                    />
                                    <label htmlFor={`image-upload-${index}`}>
                                        <Button
                                            variant="outlined"
                                            component="span"
                                            startIcon={<UploadIcon />}
                                        >
                                            Télécharger
                                        </Button>
                                    </label>
                                    <IconButton color="primary" component="span">
                                        <PhotoCameraIcon />
                                    </IconButton>
                                </Box>
                                {standard.images.length > 0 && (
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        {standard.images.map((image, imgIndex) => (
                                            <img
                                                key={imgIndex}
                                                src={image}
                                                alt={`Preuve ${imgIndex + 1}`}
                                                style={{
                                                    width: 100,
                                                    height: 100,
                                                    objectFit: 'cover',
                                                    borderRadius: 4
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Paper>
                ))}
            </List>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={standards.some(s => s.status === null)}
                >
                    Valider l'Audit
                </Button>
            </Box>
        </Box>
    );
};

export default AuditExecution; 