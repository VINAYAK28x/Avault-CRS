import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
} from '@mui/material';
import {
    VisibilityOutlined,
    EditOutlined,
    VerifiedUser,
    PendingActions,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { getReports, updateAdminReportStatus, verifyReport } from '../api';

const statusColors = {
    'Pending': 'warning',
    'Under Investigation': 'info',
    'Resolved': 'success',
    'Closed': 'error',
};

const ReportList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [statusDialog, setStatusDialog] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            console.log('Fetching reports...');
            const data = await getReports();
            console.log('Reports fetched successfully:', data);
            setReports(data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            enqueueSnackbar('Error fetching reports: ' + (error.message || 'Unknown error'), { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        try {
            await updateAdminReportStatus(selectedReport._id, newStatus);
            enqueueSnackbar('Status updated successfully', { variant: 'success' });
            fetchReports();
            setStatusDialog(false);
        } catch (error) {
            enqueueSnackbar('Error updating status', { variant: 'error' });
        }
    };

    const handleVerify = async (reportId) => {
        try {
            await verifyReport(reportId);
            enqueueSnackbar('Report verified successfully', { variant: 'success' });
            fetchReports();
        } catch (error) {
            enqueueSnackbar('Error verifying report', { variant: 'error' });
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
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading reports...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Crime Reports
            </Typography>
            {reports.length === 0 ? (
                <Typography variant="body1">No reports found</Typography>
            ) : (
                <Grid container spacing={3}>
                    {reports.map((report) => (
                        <Grid item xs={12} md={6} lg={4} key={report._id}>
                            <Card 
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                }}
                            >
                                {report.isVerified && (
                                    <Chip
                                        icon={<VerifiedUser />}
                                        label="Verified"
                                        color="success"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                        }}
                                    />
                                )}
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {report.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="textSecondary"
                                        gutterBottom
                                    >
                                        {formatDate(report.createdAt)}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mb: 2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        {report.description}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            mt: 'auto',
                                        }}
                                    >
                                        <Chip
                                            label={report.status}
                                            color={statusColors[report.status]}
                                            size="small"
                                        />
                                        <Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setOpenDialog(true);
                                                }}
                                            >
                                                <VisibilityOutlined />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setNewStatus(report.status);
                                                    setStatusDialog(true);
                                                }}
                                            >
                                                <EditOutlined />
                                            </IconButton>
                                            {!report.isVerified && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleVerify(report._id)}
                                                >
                                                    <PendingActions />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Report Details Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                {selectedReport && (
                    <>
                        <DialogTitle>{selectedReport.title}</DialogTitle>
                        <DialogContent dividers>
                            <Typography gutterBottom>
                                <strong>Description:</strong> {selectedReport.description}
                            </Typography>
                            <Typography gutterBottom>
                                <strong>Location:</strong> {selectedReport.location}
                            </Typography>
                            <Typography gutterBottom>
                                <strong>Type:</strong> {selectedReport.reportType}
                            </Typography>
                            <Typography gutterBottom>
                                <strong>Status:</strong>{' '}
                                <Chip
                                    label={selectedReport.status}
                                    color={statusColors[selectedReport.status]}
                                    size="small"
                                />
                            </Typography>
                            <Typography gutterBottom>
                                <strong>Reported on:</strong>{' '}
                                {formatDate(selectedReport.createdAt)}
                            </Typography>
                            {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                                <Box mt={2}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Evidence Files:
                                    </Typography>
                                    {selectedReport.evidence.map((file, index) => (
                                        <Chip
                                            key={index}
                                            label={`File ${index + 1}`}
                                            component="a"
                                            href={file}
                                            target="_blank"
                                            clickable
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpenDialog(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Status Update Dialog */}
            <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
                {selectedReport && (
                    <>
                        <DialogTitle>Update Report Status</DialogTitle>
                        <DialogContent>
                            <TextField
                                select
                                label="Status"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                fullWidth
                                margin="normal"
                            >
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Under Investigation">Under Investigation</MenuItem>
                                <MenuItem value="Resolved">Resolved</MenuItem>
                                <MenuItem value="Closed">Closed</MenuItem>
                            </TextField>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
                            <Button onClick={handleStatusUpdate} color="primary">
                                Update
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
};

export default ReportList; 