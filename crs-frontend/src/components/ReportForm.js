import React, { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Paper, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useSnackbar } from 'notistack';
import { submitReport } from '../api';

const Input = styled('input')({
    display: 'none',
});

const reportTypes = [
    { value: 'Theft', label: 'Theft' },
    { value: 'Assault', label: 'Assault' },
    { value: 'Vandalism', label: 'Vandalism' },
    { value: 'Fraud', label: 'Fraud' },
    { value: 'Other', label: 'Other' },
];

const ReportForm = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        reportType: '',
    });
    const [files, setFiles] = useState([]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        if (selectedFiles.length > 5) {
            enqueueSnackbar('Maximum 5 files allowed', { variant: 'error' });
            return;
        }
        setFiles(selectedFiles);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            files.forEach(file => {
                formDataToSend.append('evidence', file);
            });

            const response = await submitReport(formDataToSend);
            enqueueSnackbar('Report submitted successfully!', { variant: 'success' });
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                location: '',
                reportType: '',
            });
            setFiles([]);
        } catch (error) {
            enqueueSnackbar(error.message || 'Error submitting report', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto', my: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
                Submit Crime Report
            </Typography>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            required
                            fullWidth
                            multiline
                            rows={4}
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            label="Location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            required
                            fullWidth
                            select
                            label="Report Type"
                            name="reportType"
                            value={formData.reportType}
                            onChange={handleChange}
                            variant="outlined"
                        >
                            {reportTypes.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <label 
                                htmlFor="evidence-files"
                                style={{ display: 'block' }}
                            >
                                <Input
                                    accept="image/*,.pdf"
                                    id="evidence-files"
                                    name="evidence-files"
                                    multiple
                                    type="file"
                                    aria-label="Upload evidence files"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="contained"
                                    component="span"
                                    aria-label="Choose files to upload"
                                >
                                    Upload Evidence
                                </Button>
                            </label>
                            {files.length > 0 && (
                                <Typography variant="body2" color="textSecondary">
                                    {files.length} file(s) selected
                                </Typography>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    );
};

export default ReportForm; 