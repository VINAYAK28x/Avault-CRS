import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    CircularProgress,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { useSnackbar } from 'notistack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Web3 from 'web3';
import { CRIME_REPORT_ABI } from '../utils/contracts';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Statistics = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReports: 0,
        reportsPerStatus: [],
        reportsPerType: [],
        recentReports: [],
        monthlyReports: [],
    });

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            if (!window.ethereum) {
                throw new Error('MetaMask is not installed');
            }

            const web3 = new Web3(window.ethereum);
            const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
            const contract = new web3.eth.Contract(CRIME_REPORT_ABI, contractAddress);

            // Fetch all reports
            const totalReports = await contract.methods.getReportCount().call();
            const reports = await Promise.all(
                Array.from({ length: totalReports }, (_, i) =>
                    contract.methods.getReport(i).call()
                )
            );

            // Process reports for statistics
            const typeCount = {};
            const monthlyCount = {};

            reports.forEach(report => {
                // Count by type
                typeCount[report.reportType] = (typeCount[report.reportType] || 0) + 1;

                // Count by month
                const date = new Date(parseInt(report.timestamp) * 1000);
                const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
                monthlyCount[monthYear] = (monthlyCount[monthYear] || 0) + 1;
            });

            // Transform data for charts
            const reportsPerType = Object.entries(typeCount).map(([name, value]) => ({
                name,
                value,
            }));

            const monthlyReports = Object.entries(monthlyCount).map(([name, value]) => ({
                name,
                value,
            }));

            setStats({
                totalReports: parseInt(totalReports),
                reportsPerType,
                monthlyReports,
            });
        } catch (error) {
            console.error('Error fetching statistics:', error);
            enqueueSnackbar('Failed to fetch statistics', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

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
                    <Typography variant="h4" sx={{ mb: 4, color: 'primary.main', fontWeight: 'bold' }}>
                        Crime Report Statistics
                    </Typography>

                    <Grid container spacing={3}>
                        {/* Total Reports Card */}
                        <Grid item xs={12} md={4}>
                            <Card elevation={3}>
                                <CardContent>
                                    <Typography variant="h6" color="secondary.main">
                                        Total Reports
                                    </Typography>
                                    <Typography variant="h3" color="primary.main">
                                        {stats.totalReports}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Reports by Type */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                                    Reports by Type
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.reportsPerType}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                {stats.reportsPerType.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Monthly Trend */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                                    Monthly Trend
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.monthlyReports}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="value" fill="#82ca9d" name="Reports" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Recent Reports */}
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2, color: 'secondary.main' }}>
                                    Recent Reports
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>ID</TableCell>
                                                <TableCell>Title</TableCell>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.recentReports.map((report) => (
                                                <TableRow key={report.id}>
                                                    <TableCell>{report.id}</TableCell>
                                                    <TableCell>{report.title}</TableCell>
                                                    <TableCell>{report.type}</TableCell>
                                                    <TableCell>{report.status}</TableCell>
                                                    <TableCell>{report.date}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
};

export default Statistics; 