import React from 'react';
import { 
    Box, 
    Button, 
    Container, 
    Typography, 
    Paper
} from '@mui/material';
import { SentimentDissatisfied } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PageNotFound = () => {
    const navigate = useNavigate();
    
    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <SentimentDissatisfied color="primary" sx={{ fontSize: 80, mb: 2 }} />
                
                <Typography component="h1" variant="h4" gutterBottom>
                    404 - Page Not Found
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                    The page you are looking for doesn't exist or has been moved.
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
                    <Button
                        fullWidth
                        variant="contained"
                        sx={{ py: 1.5 }}
                        onClick={() => navigate('/')}
                    >
                        Go to Home
                    </Button>
                    
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ py: 1.5 }}
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default PageNotFound; 