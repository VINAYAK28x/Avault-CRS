import React, { useState } from 'react';
import { 
    Box, 
    Button, 
    Container, 
    TextField, 
    Typography, 
    Paper, 
    CircularProgress,
    Alert
} from '@mui/material';
import { LockReset } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // Validate input
            if (!email) {
                throw new Error('Email is required');
            }
            
            // In a real app, you would call your API here
            // await api.post('/auth/forgot-password', { email });
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setSuccess(true);
            
            // Clear form
            setEmail('');
        } catch (error) {
            console.error('Forgot password error:', error);
            setError(error.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <LockReset color="primary" sx={{ fontSize: 64, mb: 2 }} />
                
                <Typography component="h1" variant="h4" gutterBottom>
                    Forgot Password
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Enter your email address and we'll send you a link to reset your password.
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                        Password reset link sent! Please check your email.
                    </Alert>
                )}
                
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || success}
                    />
                    
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading || success}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
                    </Button>
                    
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ py: 1.5 }}
                        onClick={() => navigate('/login')}
                    >
                        Back to Login
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default ForgotPassword; 