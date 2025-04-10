import React, { useState, useEffect } from 'react';
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
import { LockOpen } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [validatingToken, setValidatingToken] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    
    const navigate = useNavigate();
    const { token } = useParams();

    useEffect(() => {
        // Validate token on component mount
        const validateToken = async () => {
            try {
                if (!token) {
                    throw new Error('Reset token is missing');
                }
                
                // In a real app, you would validate the token with your API
                // await api.post('/auth/validate-reset-token', { token });
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                setTokenValid(true);
            } catch (error) {
                console.error('Token validation error:', error);
                setError('Invalid or expired password reset token');
            } finally {
                setValidatingToken(false);
                setLoading(false);
            }
        };
        
        validateToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // Validate input
            if (!password || !confirmPassword) {
                throw new Error('All fields are required');
            }
            
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            
            // In a real app, you would call your API here
            // await api.post('/auth/reset-password', { token, password });
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setSuccess(true);
            
            // Auto-redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            console.error('Password reset error:', error);
            setError(error.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    // Show loading while validating token
    if (validatingToken) {
        return (
            <Container component="main" maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <LockOpen color="primary" sx={{ fontSize: 64, mb: 2 }} />
                
                <Typography component="h1" variant="h4" gutterBottom>
                    Reset Password
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Enter your new password below.
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                        Password reset successfully! Redirecting to login...
                    </Alert>
                )}
                
                {!tokenValid && !validatingToken && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        Invalid or expired password reset token. Please request a new password reset link.
                    </Alert>
                )}
                
                {tokenValid && !success && (
                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="New Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || success}
                        />
                        
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading || success}
                        />
                        
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                            disabled={loading || success}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
                        </Button>
                    </Box>
                )}
                
                <Button
                    fullWidth
                    variant="outlined"
                    sx={{ py: 1.5, mt: tokenValid ? 0 : 2 }}
                    onClick={() => navigate('/login')}
                >
                    Back to Login
                </Button>
            </Paper>
        </Container>
    );
};

export default ResetPassword; 