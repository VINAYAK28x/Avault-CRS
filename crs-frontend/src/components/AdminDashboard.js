import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Tab,
    Tabs,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    Refresh,
    Visibility,
    Assignment,
    CheckCircle,
    Cancel,
    Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { getAdminReports, assignReport, updateAdminReportStatus } from '../api';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState([]);
    const [officers, setOfficers] = useState([
        { id: 'off1', name: 'Officer 1' },
        { id: 'off2', name: 'Officer 2' },
        { id: 'off3', name: 'Officer 3' }
    ]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedOfficerId, setSelectedOfficerId] = useState('');
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [tabValue, setTabValue] = useState(0);
    
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    // Check if user is admin on component mount
    useEffect(() => {
        const checkAdminStatus = () => {
            try {
                const userStr = localStorage.getItem('user');
                if (!userStr) {
                    enqueueSnackbar('Not authenticated', { variant: 'error' });
                    navigate('/admin/login');
                    return false;
                }
                
                const user = JSON.parse(userStr);
                if (user.role !== 'admin') {
                    enqueueSnackbar('Not authorized as administrator', { variant: 'error' });
                    navigate('/admin/login');
                    return false;
                }
                
                return true;
            } catch (error) {
                console.error('Admin status check error:', error);
                enqueueSnackbar('Authentication error', { variant: 'error' });
                navigate('/admin/login');
                return false;
            }
        };
        
        const isAdmin = checkAdminStatus();
        if (isAdmin) {
            fetchReports();
        }
    }, [navigate, enqueueSnackbar]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getAdminReports();
            setReports(data);
        } catch (error) {
            console.error('Fetch reports error:', error);
            enqueueSnackbar('Failed to fetch reports', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const openAssignDialog = (report) => {
        setSelectedReport(report);
        setSelectedOfficerId(report.assignedTo || '');
        setAssignDialogOpen(true);
    };

    const closeAssignDialog = () => {
        setAssignDialogOpen(false);
        setSelectedReport(null);
        setSelectedOfficerId('');
    };

    const handleAssignReport = async () => {
        try {
            await assignReport(selectedReport._id, selectedOfficerId);
            enqueueSnackbar('Report assigned successfully', { variant: 'success' });
            fetchReports();
        } catch (error) {
            console.error('Assign report error:', error);
            enqueueSnackbar('Failed to assign report', { variant: 'error' });
        } finally {
            closeAssignDialog();
        }
    };

    const openStatusDialog = (report) => {
        setSelectedReport(report);
        setSelectedStatus(report.status || 'Pending');
        setStatusComment('');
        setStatusDialogOpen(true);
    };

    const closeStatusDialog = () => {
        setStatusDialogOpen(false);
        setSelectedReport(null);
        setSelectedStatus('');
        setStatusComment('');
    };

    const handleUpdateStatus = async () => {
        try {
            await updateAdminReportStatus(selectedReport._id, selectedStatus, statusComment);
            enqueueSnackbar('Status updated successfully', { variant: 'success' });
            fetchReports();
        } catch (error) {
            console.error('Update status error:', error);
            enqueueSnackbar('Failed to update status: ' + (error.message || 'Unknown error'), { variant: 'error' });
        } finally {
            closeStatusDialog();
        }
    };

    const getStatusChipColor = (status) => {
        switch(status) {
            case 'pending': return 'default';
            case 'assigned': return 'primary';
            case 'in_progress': return 'warning';
            case 'resolved': return 'success';
            case 'closed': return 'secondary';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'pending': return 'Pending';
            case 'assigned': return 'Assigned';
            case 'in_progress': return 'In Progress';
            case 'resolved': return 'Resolved';
            case 'closed': return 'Closed';
            case 'rejected': return 'Rejected';
            default: return 'Unknown';
        }
    };

    const filteredReports = reports.filter(report => {
        if (tabValue === 0) return true; // All reports
        if (tabValue === 1) return ['pending', 'assigned'].includes(report.status);
        if (tabValue === 2) return ['in_progress'].includes(report.status);
        if (tabValue === 3) return ['resolved', 'closed'].includes(report.status);
        return true;
    });

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Admin Dashboard
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<Refresh />}
                        onClick={fetchReports}
                    >
                        Refresh
                    </Button>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="All Reports" />
                        <Tab label="New & Assigned" />
                        <Tab label="In Progress" />
                        <Tab label="Resolved" />
                    </Tabs>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Submitted By</TableCell>
                                    <TableCell>Location</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredReports.length > 0 ? (
                                    filteredReports.map((report) => (
                                        <TableRow key={report._id}>
                                            <TableCell>{report._id.substring(0, 8)}...</TableCell>
                                            <TableCell>{report.title}</TableCell>
                                            <TableCell>{report.reportType}</TableCell>
                                            <TableCell>{report.submittedBy?.name || 'Anonymous'}</TableCell>
                                            <TableCell>{report.location}</TableCell>
                                            <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={getStatusLabel(report.status)} 
                                                    color={getStatusChipColor(report.status)} 
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {report.assignedTo ? (
                                                    officers.find(o => o.id === report.assignedTo)?.name || 'Unknown'
                                                ) : (
                                                    <Chip label="Unassigned" size="small" variant="outlined" />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton 
                                                    size="small" 
                                                    color="primary"
                                                    onClick={() => navigate(`/admin/reports/${report._id}`)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="secondary"
                                                    onClick={() => openAssignDialog(report)}
                                                >
                                                    <Assignment />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    color="default"
                                                    onClick={() => openStatusDialog(report)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">
                                            <Typography variant="body1" sx={{ py: 2 }}>
                                                No reports found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Assign Report Dialog */}
            <Dialog open={assignDialogOpen} onClose={closeAssignDialog}>
                <DialogTitle>Assign Report</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle1" gutterBottom>
                        {selectedReport?.title}
                    </Typography>
                    <TextField
                        select
                        fullWidth
                        label="Assign to Officer"
                        value={selectedOfficerId}
                        onChange={(e) => setSelectedOfficerId(e.target.value)}
                        margin="normal"
                    >
                        <MenuItem value="">
                            <em>Unassigned</em>
                        </MenuItem>
                        {officers.map((officer) => (
                            <MenuItem key={officer.id} value={officer.id}>
                                {officer.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeAssignDialog}>Cancel</Button>
                    <Button 
                        onClick={handleAssignReport} 
                        color="primary" 
                        variant="contained"
                    >
                        Assign
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={statusDialogOpen} onClose={closeStatusDialog}>
                <DialogTitle>Update Report Status</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            label="Status"
                        >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Under Investigation">Under Investigation</MenuItem>
                            <MenuItem value="Verified">Verified</MenuItem>
                            <MenuItem value="Resolved">Resolved</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                            <MenuItem value="Fake">Fake</MenuItem>
                        </Select>
                    </FormControl>
                    
                    <TextField
                        margin="dense"
                        id="comment"
                        label="Comment (optional)"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeStatusDialog}>Cancel</Button>
                    <Button 
                        onClick={handleUpdateStatus}
                        color="primary" 
                        variant="contained"
                    >
                        Update Status
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboard; 