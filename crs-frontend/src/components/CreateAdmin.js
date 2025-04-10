import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Container, 
    TextField, 
    Typography, 
    Paper, 
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import { AdminPanelSettings, LockReset } from '@mui/icons-material';
import { createAdmin, checkAdminExists } from '../api';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const CreateAdmin = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [formSubmitting, setFormSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        // Check if admin already exists
        const verifyNoAdmin = async () => {
            try {
                const adminExists = await checkAdminExists();
                if (adminExists) {
                    enqueueSnackbar('Admin account already exists', { variant: 'info' });
                    navigate('/admin/login');
                }
            } catch (error) {
                setError('Failed to check admin status: ' + (error.message || 'Unknown error'));
                enqueueSnackbar('Failed to check admin status', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        verifyNoAdmin();
    }, [navigate, enqueueSnackbar]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFormSubmitting(true);
        
        try {
            // Validate input
            if (!name || !email || !password || !confirmPassword) {
                throw new Error('All fields are required');
            }
            
            if (password !== confirmPassword) {
                throw new Error('Passwords do not match');
            }
            
            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }
            
            console.log('Submitting admin creation form...');
            
            // Create admin account with all required fields from the User model
            const result = await createAdmin({ 
                name, 
                email, 
                password,
                // Using default values for required fields in the User model
                walletAddress: '0x0000000000000000000000000000000000000000', // Default wallet address
                dateOfBirth: '1970-01-01', // Default date of birth
                phoneNumber: '000-000-0000', // Default phone number
                address: {
                    street: 'Admin Street',
                    city: 'Admin City',
                    state: 'Admin State',
                    country: 'Admin Country',
                    postalCode: '12345'
                }
            });
            
            setSuccess(true);
            console.log('Admin creation successful:', result);
            enqueueSnackbar('Admin account created successfully', { variant: 'success' });
            
            // Clear form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            
            // Auto-redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/admin/login');
            }, 3000);
        } catch (error) {
            console.error('Create admin error:', error);
            const errorMessage = error.message || 'Failed to create admin account';
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setFormSubmitting(false);
        }
    };

    // Show loading indicator while checking if admin exists
    if (loading && !error && !success) {
        return (
            <Container component="main" maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AdminPanelSettings color="primary" sx={{ fontSize: 64, mb: 2 }} />
                
                <Typography component="h1" variant="h4" gutterBottom>
                    Create Admin Account
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Set up the first administrator account for the system.
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                        Admin account created successfully! Redirecting to login...
                    </Alert>
                )}
                
                <Divider sx={{ width: '100%', mb: 3, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Enter Admin Details
                    </Typography>
                </Divider>
                
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="name"
                        label="Full Name"
                        name="name"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={formSubmitting || success}
                    />
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={formSubmitting || success}
                    />
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={formSubmitting || success}
                        helperText="Must be at least 6 characters"
                    />
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="confirmPassword"
                        label="Confirm Password"
                        type="password"
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={formSubmitting || success}
                    />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1 }}>
                        Note: Other required information will be filled with default values.
                    </Typography>
                    
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={formSubmitting || success}
                        startIcon={success ? <LockReset /> : null}
                    >
                        {formSubmitting ? <CircularProgress size={24} /> : (success ? 'Admin Created' : 'Create Admin Account')}
                    </Button>
                    
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ py: 1.5 }}
                        onClick={() => navigate('/admin/login')}
                    >
                        Back to Login
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateAdmin; 