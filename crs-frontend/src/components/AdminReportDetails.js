import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Container, 
    Paper, 
    Typography, 
    Box, 
    Grid, 
    Button, 
    Chip, 
    Divider, 
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Card,
    CardContent,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { 
    ArrowBack,
    AssignmentInd,
    Edit,
    Face,
    LocationOn,
    CalendarToday,
    Gavel,
    Comment
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getAdminReportDetails, updateAdminReportStatus, assignReport } from '../api';

const AdminReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    
    const [report, setReport] = useState(null);
    const [blockchainReport, setBlockchainReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [selectedOfficerId, setSelectedOfficerId] = useState('');
    
    // Mock officers data - in a real app, fetch this from the server
    const officers = [
        { id: 'off1', name: 'Officer 1' },
        { id: 'off2', name: 'Officer 2' },
        { id: 'off3', name: 'Officer 3' }
    ];

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        setLoading(true);
        try {
            const data = await getAdminReportDetails(id);
            console.log('Admin report details:', data);
            setReport(data.report);
            if (data.blockchainReport) {
                setBlockchainReport(data.blockchainReport);
            }
        } catch (error) {
            console.error('Fetch report details error:', error);
            enqueueSnackbar('Error loading report details: ' + (error.message || 'Unknown error'), { 
                variant: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            await updateAdminReportStatus(id, selectedStatus, statusComment);
            enqueueSnackbar('Status updated successfully', { variant: 'success' });
            fetchReportDetails();
            setStatusDialogOpen(false);
        } catch (error) {
            console.error('Update status error:', error);
            enqueueSnackbar('Failed to update status: ' + (error.message || 'Unknown error'), { 
                variant: 'error' 
            });
        }
    };

    const handleAssignReport = async () => {
        try {
            await assignReport(id, selectedOfficerId);
            enqueueSnackbar('Report assigned successfully', { variant: 'success' });
            fetchReportDetails();
            setAssignDialogOpen(false);
        } catch (error) {
            console.error('Assign report error:', error);
            enqueueSnackbar('Failed to assign report: ' + (error.message || 'Unknown error'), { 
                variant: 'error' 
            });
        }
    };

    const openStatusDialog = () => {
        setSelectedStatus(report?.status || 'Pending');
        setStatusComment('');
        setStatusDialogOpen(true);
    };

    const openAssignDialog = () => {
        setSelectedOfficerId(report?.assignedOfficer?._id || '');
        setAssignDialogOpen(true);
    };

    const getStatusChip = (status) => {
        let color = 'default';
        switch(status) {
            case 'Pending': color = 'default'; break;
            case 'Under Investigation': color = 'primary'; break;
            case 'Verified': color = 'success'; break;
            case 'Resolved': color = 'info'; break;
            case 'Closed': color = 'secondary'; break;
            case 'Fake': color = 'error'; break;
            default: color = 'default';
        }
        
        return <Chip label={status} color={color} size="small" />;
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!report) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4 }}>
                    <Typography variant="h5" color="error">Report not found</Typography>
                    <Button 
                        startIcon={<ArrowBack />} 
                        onClick={() => navigate('/admin/dashboard')}
                        sx={{ mt: 2 }}
                    >
                        Back to Dashboard
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Button 
                startIcon={<ArrowBack />} 
                onClick={() => navigate('/admin/dashboard')}
                sx={{ mb: 2 }}
            >
                Back to Dashboard
            </Button>
            
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {report.title}
                    </Typography>
                    <Box>
                        {getStatusChip(report.status)}
                    </Box>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<Edit />}
                        onClick={openStatusDialog}
                        sx={{ mr: 2 }}
                    >
                        Update Status
                    </Button>
                    <Button 
                        variant="outlined" 
                        startIcon={<AssignmentInd />}
                        onClick={openAssignDialog}
                    >
                        Assign Officer
                    </Button>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" gutterBottom>Report Details</Typography>
                        
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Description</Typography>
                            <Typography variant="body1" paragraph>
                                {report.description}
                            </Typography>
                        </Box>
                        
                        {report.evidence && report.evidence.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Evidence</Typography>
                                <List>
                                    {report.evidence.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemText 
                                                primary={item.originalName || item.filename} 
                                                secondary={`${item.fileType} (${(item.size / 1024).toFixed(2)} KB)`} 
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                        
                        {report.adminComments && report.adminComments.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle1" fontWeight="bold">Admin Comments</Typography>
                                <List>
                                    {report.adminComments.map((comment, index) => (
                                        <ListItem key={index}>
                                            <Card variant="outlined" sx={{ width: '100%' }}>
                                                <CardContent>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Status changed to: {comment.status}
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {comment.text}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </ListItem>
                                    ))}
                                </List>
                            </Box>
                        )}
                        
                        {blockchainReport && (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6" gutterBottom>Blockchain Verification</Typography>
                                <Chip label="Blockchain Verified" color="success" sx={{ mb: 2 }} />
                                <Typography variant="body2">
                                    Transaction Hash: {report.blockchainTxHash}
                                </Typography>
                                <Typography variant="body2">
                                    Blockchain ID: {report.blockchainReportId}
                                </Typography>
                                <Typography variant="body2">
                                    Last Update: {blockchainReport.status}
                                </Typography>
                            </Box>
                        )}
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <Face sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Reporter Information
                                </Typography>
                                {report.reporter ? (
                                    <>
                                        <Typography variant="body1">
                                            Name: {report.reporter.name}
                                        </Typography>
                                        <Typography variant="body1">
                                            Email: {report.reporter.email}
                                        </Typography>
                                        {report.reporter.walletAddress && (
                                            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                Wallet: {report.reporter.walletAddress}
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Typography variant="body1">
                                        Anonymous Report
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Location
                                </Typography>
                                <Typography variant="body1">
                                    {report.location.address || 
                                     `${report.location.latitude}, ${report.location.longitude}`}
                                </Typography>
                            </CardContent>
                        </Card>
                        
                        <Card variant="outlined" sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Date & Time
                                </Typography>
                                <Typography variant="body1">
                                    Incident Date: {new Date(report.incidentDate).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body1">
                                    Report Submitted: {new Date(report.createdAt).toLocaleString()}
                                </Typography>
                                {report.updatedAt && (
                                    <Typography variant="body1">
                                        Last Updated: {new Date(report.updatedAt).toLocaleString()}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Case Assignment
                                </Typography>
                                {report.assignedOfficer ? (
                                    <>
                                        <Typography variant="body1">
                                            Assigned To: {report.assignedOfficer.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Email: {report.assignedOfficer.email}
                                        </Typography>
                                    </>
                                ) : (
                                    <Typography variant="body1">
                                        Not assigned to any officer
                                    </Typography>
                                )}
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    onClick={openAssignDialog}
                                    sx={{ mt: 1 }}
                                >
                                    Change Assignment
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
            
            {/* Status Update Dialog */}
            <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
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
                    <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleUpdateStatus}
                        color="primary" 
                        variant="contained"
                    >
                        Update Status
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* Assign Officer Dialog */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
                <DialogTitle>Assign Report</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Assign to Officer</InputLabel>
                        <Select
                            value={selectedOfficerId}
                            onChange={(e) => setSelectedOfficerId(e.target.value)}
                            label="Assign to Officer"
                        >
                            <MenuItem value="">
                                <em>Unassigned</em>
                            </MenuItem>
                            {officers.map((officer) => (
                                <MenuItem key={officer.id} value={officer.id}>
                                    {officer.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleAssignReport}
                        color="primary" 
                        variant="contained"
                    >
                        Assign Officer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminReportDetails; 