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
    PersonAddOutlined,
    AccountBalanceWallet,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { authenticateWithMetaMask } from '../api';
import { connectWallet, checkWalletConnection, setupAccountChangeListener } from '../utils/metamask';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Web3 from 'web3';

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

const Register = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [walletAddress, setWalletAddress] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dateOfBirth: '',
        phoneNumber: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
    });

    useEffect(() => {
        // Check if already connected to MetaMask
        checkWalletConnection().then((result) => {
            if (result.success) {
                setWalletAddress(result.account);
            }
        });

        // Setup listeners for account changes
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

    const validateForm = () => {
        if (!formData.name.trim()) {
            enqueueSnackbar('Name is required', { variant: 'error' });
            return false;
        }
        if (!formData.password || formData.password.length < 6) {
            enqueueSnackbar('Password must be at least 6 characters', { variant: 'error' });
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            enqueueSnackbar('Passwords do not match', { variant: 'error' });
            return false;
        }
        if (!formData.dateOfBirth) {
            enqueueSnackbar('Date of birth is required', { variant: 'error' });
            return false;
        }
        if (!formData.phoneNumber) {
            enqueueSnackbar('Phone number is required', { variant: 'error' });
            return false;
        }
        if (!formData.street || !formData.city || !formData.state || !formData.country || !formData.postalCode) {
            enqueueSnackbar('All address fields are required', { variant: 'error' });
            return false;
        }
        return true;
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

    const handleMetaMaskRegister = async () => {
        if (!walletAddress) {
            enqueueSnackbar('Please connect your MetaMask wallet first', { variant: 'error' });
            return;
        }

        if (!validateForm()) return;

        setLoading(true);
        try {
            // Create message to sign
            const message = `Register with Crime Reporting System: ${Date.now()}`;
            
            // Get Web3 instance
            const web3 = new Web3(window.ethereum);
            
            // Request signature from user
            const signature = await web3.eth.personal.sign(message, walletAddress, '');

            // Format date of birth to ISO string
            const formattedDateOfBirth = new Date(formData.dateOfBirth).toISOString();

            const userData = {
                name: formData.name.trim(),
                email: formData.email.trim() || undefined,
                password: formData.password,
                walletAddress: walletAddress,
                dateOfBirth: formattedDateOfBirth,
                phoneNumber: formData.phoneNumber.trim(),
                address: {
                    street: formData.street.trim(),
                    city: formData.city.trim(),
                    state: formData.state.trim(),
                    country: formData.country.trim(),
                    postalCode: formData.postalCode.trim(),
                },
                message,
                signature
            };

            console.log('Attempting registration with:', {
                ...userData,
                password: '[HIDDEN]',
                signature: '[HIDDEN]'
            });
            
            const result = await authenticateWithMetaMask(walletAddress, userData);
            if (result.token) {
                localStorage.setItem('token', result.token);
                enqueueSnackbar('Successfully registered with MetaMask', { variant: 'success' });
                navigate('/dashboard');
            } else {
                throw new Error('Registration failed: No token received');
            }
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Failed to register with wallet';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.errors) {
                // Handle validation errors
                const validationErrors = error.response.data.errors;
                const firstError = Object.values(validationErrors)[0];
                errorMessage = firstError.message || firstError;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            enqueueSnackbar(errorMessage, { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="md">
                <Box
                    sx={{
                        marginTop: 4,
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
                                <PersonAddOutlined />
                            </Avatar>
                            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                Create Account
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Personal Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
                                    Personal Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
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
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Confirm Password"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Phone Number"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* Address Information */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main', mt: 2 }}>
                                    Address Information
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Street Address"
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="State/Province"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Country"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Postal Code"
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleChange}
                                />
                            </Grid>

                            {/* MetaMask Connection */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ color: 'secondary.main' }}>
                                    Wallet Connection
                                </Typography>
                            </Grid>
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
                                {walletAddress && (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                        Wallet connected successfully
                                    </Alert>
                                )}
                            </Grid>

                            {/* Persistent Action Buttons */}
                            <Grid item xs={12}>
                                <Box sx={{ mt: 3, mb: 2 }}>
                                    <Divider>
                                        <Typography variant="body2" color="text.secondary">
                                            Actions
                                        </Typography>
                                    </Divider>
                                </Box>
                            </Grid>

                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => navigate('/login')}
                                    sx={{ py: 1.5 }}
                                >
                                    Sign In Instead
                                </Button>
                            </Grid>

                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    onClick={handleMetaMaskRegister}
                                    disabled={loading || !walletAddress || !formData.password || !formData.name}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? 'Creating Account...' : 'Complete Sign Up'}
                                </Button>
                            </Grid>

                            {!walletAddress && (
                                <Grid item xs={12}>
                                    <Alert severity="info">
                                        Please connect your wallet first, then fill in your details to create an account
                                    </Alert>
                                </Grid>
                            )}
                        </Grid>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {!walletAddress 
                                    ? 'Connect your wallet to continue' 
                                    : 'Fill in your details and click Sign Up to create your account'}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </ThemeProvider>
    );
};

export default Register; 