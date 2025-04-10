import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Paper,
    Avatar,
    Alert,
    Grid,
    InputAdornment,
    IconButton,
    Divider,
} from '@mui/material';
import {
    LockOutlined,
    AccountBalanceWallet,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { login } from '../api';
import { connectWallet, checkWalletConnection, setupAccountChangeListener } from '../utils/metamask';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

const theme = createTheme({
    palette: {
        primary: {
            main: '#d32f2f',
            light: '#ff6659',
            dark: '#9a0007',
        },
        secondary: {
            main: '#455a64',
            light: '#718792',
            dark: '#1c313a',
        },
    },
});

const Login = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { login: authLogin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        password: '',
    });

    useEffect(() => {
        checkWalletConnection().then((result) => {
            if (result.success) {
                setWalletAddress(result.account);
            }
        });

        setupAccountChangeListener((result) => {
            if (result.success) {
                setWalletAddress(result.account);
            } else {
                setWalletAddress('');
            }
        });
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async () => {
        if (!walletAddress) {
            enqueueSnackbar('Please connect your MetaMask wallet first', { variant: 'error' });
            return;
        }

        if (!formData.password) {
            enqueueSnackbar('Please enter your password', { variant: 'error' });
            return;
        }

        setLoading(true);
        try {
            console.log('Starting login process...');
            
            const result = await login({
                walletAddress: walletAddress.toLowerCase(),
                password: formData.password
            });

            console.log('Login API response:', {
                success: !!result.token,
                hasUser: !!result.user,
                token: result.token ? 'exists' : 'missing',
                userData: result.user ? 'exists' : 'missing'
            });
            
            if (result.token) {
                // Update auth context
                await authLogin(result.token, result.user);
                console.log('Auth context updated');

                // Show success message
                enqueueSnackbar('Successfully logged in', { variant: 'success' });
                
                // Navigate to dashboard
                console.log('Navigating to dashboard...');
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('Authentication failed: No token received');
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Failed to login. Please check your password and try again.';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Clear password field on error
            setFormData(prev => ({ ...prev, password: '' }));
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleConnectWallet = async () => {
        try {
            const result = await connectWallet();
            if (result.success) {
                setWalletAddress(result.account);
                enqueueSnackbar('Wallet connected successfully', { variant: 'success' });
            } else {
                enqueueSnackbar(result.error, { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar(error.message || 'Failed to connect wallet', { variant: 'error' });
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="sm">
                <Box
                    sx={{
                        marginTop: 8,
                        marginBottom: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            padding: 4,
                            width: '100%',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        }}
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                                <LockOutlined />
                            </Avatar>
                            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                Sign In
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                                {!walletAddress ? 'Connect your wallet to continue' : 'Enter your password to sign in'}
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* MetaMask Connection */}
                            <Grid item xs={12}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AccountBalanceWallet />}
                                    onClick={handleConnectWallet}
                                    disabled={loading || !!walletAddress}
                                    sx={{ py: 1.5 }}
                                >
                                    {walletAddress
                                        ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                                        : 'Connect MetaMask'}
                                </Button>
                            </Grid>

                            {/* Password Field - Show when wallet is connected */}
                            {walletAddress && (
                                <Grid item xs={12}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={handleTogglePassword} edge="end">
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            )}

                            {/* Action Buttons */}
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Actions
                                    </Typography>
                                </Divider>
                            </Grid>

                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => navigate('/register')}
                                    sx={{ py: 1.5 }}
                                >
                                    Sign Up
                                </Button>
                            </Grid>

                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    onClick={handleLogin}
                                    disabled={loading || !walletAddress || !formData.password}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </Grid>

                            {!walletAddress && (
                                <Grid item xs={12}>
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Please connect your wallet first to sign in
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Link component={RouterLink} to="/register" variant="body2" sx={{ color: 'secondary.main' }}>
                                Don't have an account? Sign up
                            </Link>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Login; 