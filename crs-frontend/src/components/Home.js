import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Link,
} from '@mui/material';
import {
    Security,
    Speed,
    Visibility,
    Assignment,
} from '@mui/icons-material';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Security sx={{ fontSize: 40 }} />,
            title: 'Secure Reporting',
            description: 'Your reports are encrypted and stored securely on the blockchain.',
        },
        {
            icon: <Speed sx={{ fontSize: 40 }} />,
            title: 'Real-time Updates',
            description: 'Track the status of your reports in real-time.',
        },
        {
            icon: <Visibility sx={{ fontSize: 40 }} />,
            title: 'Transparent Process',
            description: 'Full transparency in the investigation process.',
        },
        {
            icon: <Assignment sx={{ fontSize: 40 }} />,
            title: 'Digital Evidence',
            description: 'Submit and manage digital evidence securely.',
        },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                pt: { xs: 4, md: 8 },
                pb: 6,
            }}
        >
            <Container maxWidth="lg">
                {/* Hero Section */}
                <Box
                    sx={{
                        textAlign: 'center',
                        mb: 8,
                    }}
                >
                    <Typography
                        variant="h2"
                        component="h1"
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            mb: 2,
                        }}
                    >
                        Crime Reporting System
                    </Typography>
                    <Typography
                        variant="h5"
                        color="text.secondary"
                        sx={{ mb: 4 }}
                    >
                        A secure and transparent platform for reporting incidents
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{ mr: 2 }}
                    >
                        Get Started
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="large"
                        onClick={() => navigate('/about')}
                    >
                        Learn More
                    </Button>
                </Box>

                {/* Features Section */}
                <Grid container spacing={4}>
                    {features.map((feature, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 3,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        mb: 2,
                                        color: 'primary.main',
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Typography
                                    variant="h6"
                                    component="h3"
                                    sx={{ mb: 1 }}
                                >
                                    {feature.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {feature.description}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                
                {/* Admin Login Link */}
                <Box sx={{ mt: 8, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Are you a law enforcement officer?
                    </Typography>
                    <Link 
                        component="button"
                        variant="body2"
                        onClick={() => navigate('/admin/login')}
                        sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                                textDecoration: 'underline' 
                            }
                        }}
                    >
                        Admin Login
                    </Link>
                </Box>
            </Container>
        </Box>
    );
};

export default Home; 