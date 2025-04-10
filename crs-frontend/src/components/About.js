import React from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    AccountBalanceWallet,
    Security,
    CloudUpload,
    TrackChanges,
    Search,
    HowToReg,
    Lock,
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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

const About = () => {
    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                    pt: 3,
                    pb: 6,
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        {/* Header */}
                        <Grid item xs={12}>
                            <Typography 
                                variant="h3" 
                                component="h1" 
                                gutterBottom 
                                sx={{ 
                                    color: 'primary.main',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    mb: 4
                                }}
                            >
                                Welcome to aVault
                            </Typography>
                            <Typography 
                                variant="h6" 
                                color="text.secondary" 
                                paragraph 
                                align="center"
                                sx={{ mb: 6 }}
                            >
                                A secure, blockchain-based platform for reporting and tracking incidents
                            </Typography>
                        </Grid>

                        {/* Key Features */}
                        <Grid item xs={12}>
                            <Typography variant="h4" gutterBottom sx={{ color: 'secondary.main', mb: 3 }}>
                                Key Features
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Security color="primary" sx={{ fontSize: 40, mb: 2 }} />
                                            <Typography variant="h6" gutterBottom>
                                                Secure & Immutable
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                All reports are stored on the blockchain, ensuring data integrity and immutability.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <CloudUpload color="primary" sx={{ fontSize: 40, mb: 2 }} />
                                            <Typography variant="h6" gutterBottom>
                                                Multimedia Evidence
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Upload and store images and videos securely on IPFS.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <TrackChanges color="primary" sx={{ fontSize: 40, mb: 2 }} />
                                            <Typography variant="h6" gutterBottom>
                                                Real-time Tracking
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Monitor the status and progress of your reports in real-time.
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* How to Use */}
                        <Grid item xs={12} sx={{ mt: 4 }}>
                            <Paper elevation={3} sx={{ p: 4 }}>
                                <Typography variant="h4" gutterBottom sx={{ color: 'secondary.main', mb: 3 }}>
                                    How to Use aVault
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <HowToReg color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="1. Sign Up"
                                            secondary="Create an account by connecting your MetaMask wallet and providing your personal details."
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <Lock color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="2. Login"
                                            secondary="Access your account using your MetaMask wallet and password."
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <CloudUpload color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="3. Submit Reports"
                                            secondary="Create detailed reports with descriptions, locations, and multimedia evidence."
                                        />
                                    </ListItem>
                                    <Divider component="li" />
                                    <ListItem>
                                        <ListItemIcon>
                                            <Search color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="4. Track Progress"
                                            secondary="Monitor your reports' status and view updates in real-time."
                                        />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>

                        {/* Requirements */}
                        <Grid item xs={12} sx={{ mt: 4 }}>
                            <Paper elevation={3} sx={{ p: 4 }}>
                                <Typography variant="h4" gutterBottom sx={{ color: 'secondary.main', mb: 3 }}>
                                    Requirements
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemIcon>
                                            <AccountBalanceWallet color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="MetaMask Wallet"
                                            secondary="Install MetaMask browser extension and create a wallet to use aVault."
                                        />
                                    </ListItem>
                                </List>
                            </Paper>
                        </Grid>

                        {/* Footer */}
                        <Grid item xs={12} sx={{ mt: 4 }}>
                            <Typography variant="body2" color="text.secondary" align="center">
                                aVault © {new Date().getFullYear()} | Secure Incident Reporting Platform
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default About; 