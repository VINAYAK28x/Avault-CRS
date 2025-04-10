import React, { useState, useEffect } from 'react';
import { 
    Container, 
    Paper, 
    Typography, 
    CircularProgress, 
    Alert,
    Button
} from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const EmailVerification = () => {
    const [loading, setLoading] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        // Get token from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
            setError('Verification token is missing');
            setLoading(false);
            return;
        }
        
        // Simulate verification process
        const verifyEmail = async () => {
            try {
                // In a real app, you would call your API here
                // await api.post('/auth/verify-email', { token });
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                setVerified(true);
                
                // Redirect to login after successful verification
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error) {
                setError('Failed to verify email. The token may be invalid or expired.');
            } finally {
                setLoading(false);
            }
        };
        
        verifyEmail();
    }, [location, navigate]);
    
    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <VerifiedUser color="primary" sx={{ fontSize: 64, mb: 2 }} />
                
                <Typography component="h1" variant="h4" gutterBottom>
                    Email Verification
                </Typography>
                
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                        <CircularProgress />
                    </div>
                )}
                
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {verified && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                        Your email has been successfully verified! Redirecting to login...
                    </Alert>
                )}
                
                {!loading && !verified && !error && (
                    <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
                        Verifying your email address...
                    </Alert>
                )}
                
                <Button
                    fullWidth
                    variant="outlined"
                    sx={{ py: 1.5, mt: 2 }}
                    onClick={() => navigate('/login')}
                >
                    Back to Login
                </Button>
            </Paper>
        </Container>
    );
};

export default EmailVerification; 