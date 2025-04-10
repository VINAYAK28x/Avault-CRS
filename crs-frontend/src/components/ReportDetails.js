import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Chip,
    CircularProgress,
    Button,
    Card,
    CardMedia,
    CardContent,
    Alert,
    Link,
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import {
    LocationOn,
    Category,
    AccessTime,
    Person,
    Description,
    Assignment,
    Image,
    VideoLibrary,
    AttachFile,
    CalendarToday,
    Flag,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Web3 from 'web3';
import { CRIME_REPORT_ABI } from '../utils/contracts';
import { getReport } from '../api';

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

const ReportDetails = () => {
    const { id } = useParams();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setLoading(true);
            
            // First, fetch the report from our backend API to get the blockchain ID
            const reportFromAPI = await getReport(id);
            
            // Initialize evidence structure with empty arrays
            const report = {
                ...reportFromAPI,
                evidence: {
                    images: [],
                    videos: [],
                    documents: []
                }
            };
            
            // Check if we have a valid blockchain report ID
            if (!reportFromAPI.blockchainReportId) {
                setReport(report);
                setLoading(false);
                return;
            }
            
            // Now use the blockchain report ID to fetch from blockchain
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const web3 = new Web3(window.ethereum);
            const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
            const contract = new web3.eth.Contract(CRIME_REPORT_ABI, contractAddress);

            // Use the blockchain report ID from our database
            const reportData = await contract.methods.getReport(reportFromAPI.blockchainReportId).call();
            
            // Transform blockchain data into a more usable format and combine with API data
            report.blockchain = {
                id: reportData.id,
                title: reportData.title,
                description: reportData.description,
                location: reportData.location,
                date: new Date(parseInt(reportData.timestamp) * 1000),
                type: reportData.reportType,
                status: reportData.status || "Pending",
                reporter: reportData.reporter,
                evidence: {
                    hashes: reportData.evidenceHashes || []
                }
            };

            setReport(report);
        } catch (error) {
            console.error('Error fetching report details:', error);
            enqueueSnackbar(`Error fetching report: ${error.message}`, { variant: 'error' });
            
            // Try to still load the report from API even if blockchain fails
            try {
                const reportFromAPI = await getReport(id);
                // Initialize evidence structure with empty arrays
                const report = {
                    ...reportFromAPI,
                    evidence: {
                        images: [],
                        videos: [],
                        documents: []
                    }
                };
                setReport(report);
                enqueueSnackbar('Loaded report data from database only.', { variant: 'warning' });
            } catch (apiError) {
                console.error('Error fetching from API fallback:', apiError);
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase() || 'pending') {
            case 'pending':
                return '#ffa726'; // Orange
            case 'investigating':
                return '#29b6f6'; // Light Blue
            case 'resolved':
                return '#66bb6a'; // Green
            case 'closed':
                return '#ef5350'; // Red
            default:
                return '#9e9e9e'; // Grey
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!report) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Typography variant="h5" color="error">
                    Report not found
                </Typography>
            </Box>
        );
    }

    // Ensure evidence arrays exist
    const evidence = report.evidence || {
        images: [],
        videos: [],
        documents: []
    };

    // Ensure updates array exists
    const updates = report.updates || [];

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
                        {/* Report Header */}
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box>
                                        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 2 }}>
                                            {report.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                                icon={<Category />}
                                                label={report.type || report.reportType}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<LocationOn />}
                                                label={report.location}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<CalendarToday />}
                                                label={new Date(report.date || report.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                                color="primary"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<Flag />}
                                                label={report.status || 'Pending'}
                                                sx={{
                                                    backgroundColor: getStatusColor(report.status),
                                                    color: '#ffffff',
                                                    fontWeight: 'bold'
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Box>
                                
                                {!report.blockchain && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>
                                        Blockchain data is not available. Showing database information only.
                                    </Alert>
                                )}

                                {report.blockchainTxHash && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle1" color="text.secondary">
                                            Blockchain Transaction:
                                        </Typography>
                                        <Link 
                                            href={`https://sepolia.etherscan.io/tx/${report.blockchainTxHash}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            sx={{ wordBreak: 'break-all' }}
                                        >
                                            {report.blockchainTxHash}
                                        </Link>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>

                        {/* Description */}
                        <Grid item xs={12} md={8}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 'bold', mb: 2 }}>
                                    Description
                                </Typography>
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {report.description}
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* Evidence */}
                        <Grid item xs={12} md={4}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 'bold', mb: 2 }}>
                                    Evidence
                                </Typography>
                                <Grid container spacing={2}>
                                    {evidence.images && evidence.images.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Image /> Images
                                            </Typography>
                                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                                {evidence.images.map((image, index) => (
                                                    <Grid item xs={6} key={index}>
                                                        <Card>
                                                            <CardMedia
                                                                component="img"
                                                                height="140"
                                                                image={`https://ipfs.io/ipfs/${image.hash}`}
                                                                alt={`Evidence ${index + 1}`}
                                                            />
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    )}

                                    {evidence.videos && evidence.videos.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <VideoLibrary /> Videos
                                            </Typography>
                                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                                {evidence.videos.map((video, index) => (
                                                    <Grid item xs={12} key={index}>
                                                        <Card>
                                                            <CardContent>
                                                                <Button
                                                                    fullWidth
                                                                    variant="outlined"
                                                                    href={`https://ipfs.io/ipfs/${video.hash}`}
                                                                    target="_blank"
                                                                >
                                                                    View Video {index + 1}
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    )}

                                    {evidence.documents && evidence.documents.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AttachFile /> Documents
                                            </Typography>
                                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                                {evidence.documents.map((doc, index) => (
                                                    <Grid item xs={12} key={index}>
                                                        <Card>
                                                            <CardContent>
                                                                <Button
                                                                    fullWidth
                                                                    variant="outlined"
                                                                    href={`https://ipfs.io/ipfs/${doc.hash}`}
                                                                    target="_blank"
                                                                >
                                                                    View Document {index + 1}
                                                                </Button>
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Grid>
                                    )}

                                    {(!evidence.images || evidence.images.length === 0) && 
                                     (!evidence.videos || evidence.videos.length === 0) && 
                                     (!evidence.documents || evidence.documents.length === 0) && (
                                        <Grid item xs={12}>
                                            <Typography variant="body1" color="text.secondary">
                                                No evidence available for this report.
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Status Timeline */}
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h5" sx={{ color: 'secondary.main', fontWeight: 'bold', mb: 2 }}>
                                    Investigation Timeline
                                </Typography>
                                {updates.length > 0 ? (
                                    <Timeline position="alternate">
                                        {updates.map((update, index) => (
                                            <TimelineItem key={index}>
                                                <TimelineOppositeContent color="text.secondary">
                                                    {new Date(update.timestamp).toLocaleString()}
                                                </TimelineOppositeContent>
                                                <TimelineSeparator>
                                                    <TimelineDot 
                                                        sx={{ 
                                                            bgcolor: getStatusColor(update.status),
                                                            color: '#ffffff'
                                                        }}
                                                    >
                                                        <Assignment />
                                                    </TimelineDot>
                                                    {index < updates.length - 1 && <TimelineConnector />}
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Paper elevation={2} sx={{ p: 2 }}>
                                                        <Typography variant="h6" component="span">
                                                            {update.status}
                                                        </Typography>
                                                        <Typography>{update.description}</Typography>
                                                    </Paper>
                                                </TimelineContent>
                                            </TimelineItem>
                                        ))}
                                    </Timeline>
                                ) : (
                                    <Typography variant="body1" color="text.secondary">
                                        No updates available for this report.
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default ReportDetails; 