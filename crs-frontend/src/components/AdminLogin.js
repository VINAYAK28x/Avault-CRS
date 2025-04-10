import React, { useState } from 'react';
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
import { AdminPanelSettings, Person } from '@mui/icons-material';
import { adminLogin, checkAdminExists } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [adminExists, setAdminExists] = useState(true);
    
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // Check if admin exists when component mounts
    React.useEffect(() => {
        const checkAdmin = async () => {
            try {
                const exists = await checkAdminExists();
                setAdminExists(exists);
            } catch (error) {
                console.error('Error checking if admin exists:', error);
            }
        };
        
        checkAdmin();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // Validate input
            if (!email || !password) {
                throw new Error('Please enter both email and password');
            }
            
            // Attempt admin login
            const result = await adminLogin({ email, password });
            
            // Check if we got a valid user with admin role
            if (!result.user || result.user.role !== 'admin') {
                throw new Error('Not authorized as administrator');
            }
            
            // Store admin user info in localStorage
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            
            enqueueSnackbar('Admin login successful', { variant: 'success' });
            
            // Redirect to admin dashboard
            navigate('/admin/dashboard');
        } catch (error) {
            console.error('Admin login error:', error);
            setError(error.message || 'Login failed');
            enqueueSnackbar(error.message || 'Login failed', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Paper elevation={6} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <AdminPanelSettings color="primary" sx={{ fontSize: 64, mb: 2 }} />
                
                <Typography component="h1" variant="h4" gutterBottom>
                    Admin Login
                </Typography>
                
                <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                    Access the administrative dashboard to manage crime reports.
                </Typography>
                
                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
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
                        disabled={loading}
                    />
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                    
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Login as Administrator'}
                    </Button>
                    
                    <Button 
                        fullWidth 
                        variant="outlined" 
                        color="secondary"
                        sx={{ mb: 2, py: 1.5 }}
                        onClick={() => navigate('/')}
                    >
                        Return to Home
                    </Button>
                    
                    <Divider sx={{ my: 2 }}>OR</Divider>
                    
                    <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        sx={{ py: 1.5 }}
                        startIcon={<Person />}
                        onClick={() => navigate('/admin/setup')}
                    >
                        Create Admin Account
                    </Button>
                    
                    {!adminExists && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            No admin account exists yet. Please create one to start managing the system.
                        </Alert>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default AdminLogin; 