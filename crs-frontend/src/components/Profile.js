import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Avatar,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Button,
    Divider,
} from '@mui/material';
import { Person, Assignment, Schedule, LocationOn } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { getContract, getWeb3 } from '../utils/contracts';
import { useAuth } from '../context/AuthContext';

const statusColors = {
    'Pending': '#ffa726',
    'Investigating': '#29b6f6',
    'Resolved': '#66bb6a',
    'Closed': '#ef5350',
};

const Profile = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [blockchainReports, setBlockchainReports] = useState([]);

    useEffect(() => {
        fetchUserReports();
    }, [user]);

    const fetchUserReports = async () => {
        try {
            setLoading(true);

            // Get Web3 instance and contract
            const web3 = getWeb3();
            const contract = await getContract();

            // Get user's Ethereum address
            const accounts = await web3.eth.requestAccounts();
            const userAddress = accounts[0];

            // Fetch reports from blockchain
            const reportIds = await contract.methods.getUserReports(userAddress).call();
            const fetchedReports = await Promise.all(
                reportIds.map(async (id) => {
                    const report = await contract.methods.getReport(id).call();
                    return {
                        id: report.id,
                        title: report.title,
                        description: report.description,
                        location: report.location,
                        reportType: report.reportType,
                        evidenceHashes: report.evidenceHashes,
                        timestamp: new Date(report.timestamp * 1000),
                        reporter: report.reporter,
                        status: "Pending" // Default status since it's not in the contract
                    };
                })
            );

            setBlockchainReports(fetchedReports);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reports:', error);
            enqueueSnackbar('Failed to fetch reports', { variant: 'error' });
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {/* User Profile Card */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        margin: '0 auto',
                                        backgroundColor: 'primary.main',
                                    }}
                                >
                                    <Person sx={{ fontSize: 60 }} />
                                </Avatar>
                                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                                    {user?.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {user?.email}
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Wallet Address"
                                        secondary={user?.walletAddress}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Reports Submitted"
                                        secondary={blockchainReports.length}
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemText
                                        primary="Member Since"
                                        secondary={formatDate(user?.createdAt)}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>

                    {/* Reports List */}
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 3 }}>
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                                My Reports
                            </Typography>
                            <Grid container spacing={3}>
                                {blockchainReports.length > 0 ? (
                                    blockchainReports.map((report) => (
                                        <Grid item xs={12} key={report.id}>
                                            <Card>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Typography variant="h6" gutterBottom>
                                                            {report.title}
                                                        </Typography>
                                                        <Chip
                                                            label={report.reportType}
                                                            color="primary"
                                                            size="small"
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="textSecondary" paragraph>
                                                        {report.description}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <LocationOn sx={{ fontSize: 20, mr: 0.5 }} />
                                                            <Typography variant="body2">
                                                                {report.location}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Schedule sx={{ fontSize: 20, mr: 0.5 }} />
                                                            <Typography variant="body2">
                                                                {formatDate(report.timestamp)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    {report.evidenceHashes.length > 0 && (
                                                        <Box sx={{ mt: 2 }}>
                                                            <Typography variant="subtitle2" gutterBottom>
                                                                Evidence Files:
                                                            </Typography>
                                                            {report.evidenceHashes.map((hash, index) => (
                                                                <Chip
                                                                    key={index}
                                                                    label={`Evidence ${index + 1}`}
                                                                    component="a"
                                                                    href={`https://ipfs.io/ipfs/${hash}`}
                                                                    target="_blank"
                                                                    clickable
                                                                    size="small"
                                                                    sx={{ mr: 1, mb: 1 }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))
                                ) : (
                                    <Grid item xs={12}>
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Assignment sx={{ fontSize: 60, color: 'text.secondary' }} />
                                            <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
                                                No reports submitted yet
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                sx={{ mt: 2 }}
                                                onClick={() => navigate('/submit')}
                                            >
                                                Submit a Report
                                            </Button>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default Profile; 