import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    MenuItem,
    IconButton,
    Card,
    CardContent,
    CardActions,
    Chip,
    InputAdornment,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Search,
    FilterList,
    Sort,
    Add,
    Refresh,
    Timeline,
    Description,
    Assessment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { getReports } from '../api';
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

const statusColors = {
    'Pending': '#ffa726',
    'Under Investigation': '#29b6f6',
    'Resolved': '#66bb6a',
    'Closed': '#ef5350',
};

const Dashboard = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentTab, setCurrentTab] = useState(0);

    useEffect(() => {
        fetchReports();
    }, [sortOrder, statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await getReports();
            setReports(response);
        } catch (error) {
            console.error('Fetch reports error:', error);
            enqueueSnackbar('Failed to fetch reports. Please try again later.', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleSortChange = (event) => {
        setSortOrder(event.target.value);
    };

    const handleStatusFilterChange = (event) => {
        setStatusFilter(event.target.value);
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const handleRefresh = () => {
        fetchReports();
    };

    // Filter and sort reports
    const filteredReports = reports
        .filter(report => {
            if (statusFilter === 'all') return true;
            return report.status === statusFilter;
        })
        .filter(report => {
            if (!searchQuery) return true;
            return (
                report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        .sort((a, b) => {
            if (sortOrder === 'newest') {
                return new Date(b.date) - new Date(a.date);
            }
            return new Date(a.date) - new Date(b.date);
        });

    const renderDashboardContent = () => {
        switch (currentTab) {
            case 0: // Reports
                return (
                    <Grid container spacing={3}>
                        {filteredReports.map((report) => (
                            <Grid item xs={12} md={6} lg={4} key={report._id}>
                                <Card 
                                    elevation={3}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                        },
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {report.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {report.description}
                                        </Typography>
                                        <Box sx={{ mt: 2 }}>
                                            <Chip
                                                label={report.status}
                                                sx={{
                                                    backgroundColor: statusColors[report.status],
                                                    color: 'white',
                                                }}
                                            />
                                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                Submitted: {new Date(report.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                    <CardActions>
                                        <Button 
                                            size="small" 
                                            color="primary"
                                            onClick={() => navigate(`/reports/${report._id}`)}
                                        >
                                            View Details
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                        {filteredReports.length === 0 && !loading && (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No reports found.
                                    </Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                );
            case 1: // Statistics
                return (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Report Statistics
                        </Typography>
                        {/* Add statistics components here */}
                    </Paper>
                );
            case 2: // Timeline
                return (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Report Timeline
                        </Typography>
                        {/* Add timeline components here */}
                    </Paper>
                );
            default:
                return null;
        }
    };

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
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h4" component="h1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                    Dashboard
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Add />}
                                    onClick={() => navigate('/submit')}
                                >
                                    New Report
                                </Button>
                            </Box>
                        </Grid>

                        {/* Filters and Search */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            fullWidth
                                            placeholder="Search reports..."
                                            value={searchQuery}
                                            onChange={handleSearch}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            value={statusFilter}
                                            onChange={handleStatusFilterChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <FilterList />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="all">All Status</MenuItem>
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="Under Investigation">Under Investigation</MenuItem>
                                            <MenuItem value="Resolved">Resolved</MenuItem>
                                            <MenuItem value="Closed">Closed</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            select
                                            fullWidth
                                            value={sortOrder}
                                            onChange={handleSortChange}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Sort />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        >
                                            <MenuItem value="newest">Newest First</MenuItem>
                                            <MenuItem value="oldest">Oldest First</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={2}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<Refresh />}
                                            onClick={handleRefresh}
                                            disabled={loading}
                                        >
                                            Refresh
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Tabs */}
                        <Grid item xs={12}>
                            <Paper sx={{ mb: 3 }}>
                                <Tabs
                                    value={currentTab}
                                    onChange={handleTabChange}
                                    indicatorColor="primary"
                                    textColor="primary"
                                    variant="fullWidth"
                                >
                                    <Tab icon={<Description />} label="Reports" />
                                    <Tab icon={<Assessment />} label="Statistics" />
                                    <Tab icon={<Timeline />} label="Timeline" />
                                </Tabs>
                            </Paper>
                        </Grid>

                        {/* Main Content */}
                        <Grid item xs={12}>
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                renderDashboardContent()
                            )}
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default Dashboard; 