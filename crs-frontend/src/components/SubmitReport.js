import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Grid,
    MenuItem,
    CircularProgress,
    Alert,
    Snackbar,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import {
    CloudUpload,
    Send,
    Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { submitReport, submitBlockchainReport } from '../api';
import { getWeb3, getContract } from '../utils/contracts';
import { create } from 'ipfs-http-client';
import { IPFS_CONFIG } from '../utils/contracts';

const reportTypes = [
    'Theft',
    'Fraud',
    'Cybercrime',
    'Violence',
    'Property Damage',
    'Other',
];

const steps = ['Prepare Report', 'Upload to Blockchain', 'Complete Submission'];

const SubmitReport = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [blockchainLoading, setBlockchainLoading] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        description: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [files, setFiles] = useState([]);
    const [processedFiles, setProcessedFiles] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [transactionHash, setTransactionHash] = useState('');
    const [blockchainReportId, setBlockchainReportId] = useState('');
    const [ipfs, setIpfs] = useState(null);

    useEffect(() => {
        // Initialize IPFS client
        try {
            const ipfsClient = create(IPFS_CONFIG);
            setIpfs(ipfsClient);
        } catch (error) {
            console.error('IPFS initialization error:', error);
            enqueueSnackbar('Failed to initialize IPFS client. File uploads may not work.', { variant: 'warning' });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
        }
    };

    const handleRemoveFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        setProcessedFiles(processedFiles.filter((_, i) => i !== index));
    };

    const handleUploadToIPFS = async () => {
        if (!ipfs) {
            enqueueSnackbar('IPFS client not initialized. Please reload the page.', { variant: 'error' });
            return [];
        }

        setLoading(true);
        setError('');
        const uploadedFiles = [];

        try {
            for (const file of files) {
                const buffer = await file.arrayBuffer();
                const result = await ipfs.add(buffer);
                uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    hash: result.path,
                    file
                });
            }
            setProcessedFiles(uploadedFiles);
            return uploadedFiles;
        } catch (error) {
            console.error('Error uploading files to IPFS:', error);
            enqueueSnackbar('Failed to upload files to IPFS', { variant: 'error' });
            setError('Failed to upload files to IPFS: ' + error.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleBlockchainSubmit = async () => {
        setBlockchainLoading(true);
        setError('');

        try {
            // Validate form data
            if (!formData.title || !formData.type || !formData.description || !formData.location) {
                throw new Error('Please fill in all required fields');
            }

            // Upload files to IPFS if needed
            let uploadedFiles = processedFiles;
            if (files.length > 0 && processedFiles.length === 0) {
                uploadedFiles = await handleUploadToIPFS();
                if (uploadedFiles.length === 0) {
                    throw new Error('Failed to upload files to IPFS');
                }
            }

            // Get Web3 instance and contract
            const web3 = getWeb3();
            const contract = await getContract();

            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const accounts = await web3.eth.getAccounts();
            if (!accounts || accounts.length === 0) {
                throw new Error('Please connect to MetaMask');
            }

            const userAddress = accounts[0];

            // Prepare report data for blockchain
            const reportData = {
                title: formData.title,
                reportType: formData.type,
                description: formData.description,
                location: formData.location,
                evidenceHashes: uploadedFiles.map(file => file.hash),
                timestamp: Math.floor(new Date(formData.date).getTime() / 1000)
            };

            console.log('Submitting to blockchain:', {
                address: userAddress,
                ...reportData
            });

            // Submit report to blockchain
            const tx = await contract.methods.submitReport(
                reportData.title,
                reportData.reportType,
                reportData.description,
                reportData.location,
                reportData.evidenceHashes,
                reportData.timestamp
            ).send({ from: userAddress });

            console.log('Transaction complete:', tx);
            
            // Save transaction details
            setTransactionHash(tx.transactionHash);
            
            // Extract report ID from event if available
            if (tx.events && tx.events.ReportSubmitted) {
                const reportId = tx.events.ReportSubmitted.returnValues.reportId;
                setBlockchainReportId(reportId);
            }
            
            setActiveStep(2);
            enqueueSnackbar('Successfully submitted to blockchain!', { variant: 'success' });
            return tx;
            
        } catch (error) {
            console.error('Blockchain submission error:', error);
            let errorMessage = 'Failed to submit to blockchain';
            
            // Format error messages for common blockchain errors
            if (error.code === 4001) {
                errorMessage = 'Transaction rejected by user';
            } else if (error.message?.includes('User denied transaction')) {
                errorMessage = 'Transaction rejected by user';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for transaction';
            }
            
            setError(errorMessage);
            enqueueSnackbar(errorMessage, { variant: 'error' });
            return null;
        } finally {
            setBlockchainLoading(false);
        }
    };

    const handleBackendSubmit = async (txData) => {
        setLoading(true);
        setError('');

        try {
            // Create FormData for backend
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('reportType', formData.type);
            submitData.append('description', formData.description);
            submitData.append('location', formData.location);
            submitData.append('date', formData.date);
            
            // Add blockchain transaction details
            if (txData) {
                submitData.append('transactionHash', txData.transactionHash);
                
                // If we have event data for the report ID, include it
                if (txData.events && txData.events.ReportSubmitted) {
                    const reportId = txData.events.ReportSubmitted.returnValues.reportId;
                    submitData.append('blockchainReportId', reportId);
                }
                
                // Append evidence hashes as a JSON string
                const evidenceHashes = processedFiles.map(file => file.hash);
                submitData.append('evidenceHashes', JSON.stringify(evidenceHashes));
            }
            
            // Append files if any
            files.forEach(file => {
                submitData.append('evidence', file);
            });

            // Submit to backend
            await submitBlockchainReport(submitData);
            
            setSuccess(true);
            enqueueSnackbar('Report submitted successfully!', { variant: 'success' });
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Backend submission error:', error);
            setError(error.message || 'Failed to submit report to server');
            enqueueSnackbar(error.message || 'Failed to submit report to server', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        if (activeStep === 0) {
            // First step validation
            if (!formData.title || !formData.type || !formData.description || !formData.location) {
                setError('Please fill in all required fields');
                enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
                return;
            }
            setActiveStep(1);
        } else if (activeStep === 1) {
            // Submit to blockchain
            const tx = await handleBlockchainSubmit();
            if (tx) {
                // If blockchain submission successful, proceed to final step
                await handleBackendSubmit(tx);
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    Submit a Report
                </Typography>
                
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
                
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                
                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Report submitted successfully! Redirecting to dashboard...
                    </Alert>
                )}
                
                <Box component="form">
                    {activeStep === 0 && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Report Title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    disabled={loading || success}
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    select
                                    label="Report Type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    disabled={loading || success}
                                >
                                    {reportTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="Location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    disabled={loading || success}
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
                                    disabled={loading || success}
                                />
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Evidence Files (Optional)
                                    </Typography>
                                    
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<CloudUpload />}
                                        sx={{ mb: 2 }}
                                        disabled={loading || success}
                                    >
                                        Upload Files
                                        <input
                                            type="file"
                                            multiple
                                            hidden
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                    
                                    {files.length > 0 && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                Selected Files:
                                            </Typography>
                                            <ul>
                                                {files.map((file, index) => (
                                                    <li key={index}>
                                                        {file.name}
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveFile(index)}
                                                            disabled={loading || success}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </Box>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    )}
                    
                    {activeStep === 1 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Submit to Blockchain
                            </Typography>
                            <Typography variant="body1" paragraph>
                                Your report will now be submitted to the blockchain. This ensures that your report is tamper-proof and permanently recorded.
                            </Typography>
                            <Typography variant="body2" paragraph color="text.secondary">
                                You will need to confirm the transaction in your MetaMask wallet. This might take a moment to process.
                            </Typography>
                            
                            {blockchainLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <CircularProgress />
                                </Box>
                            )}
                        </Box>
                    )}
                    
                    {activeStep === 2 && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="h6" gutterBottom>
                                Finalizing Submission
                            </Typography>
                            
                            {transactionHash && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2">
                                        Transaction Hash:
                                    </Typography>
                                    <Typography variant="body2">
                                        {transactionHash}
                                    </Typography>
                                </Box>
                            )}
                            
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : success ? (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    Report successfully submitted and recorded on the blockchain!
                                </Alert>
                            ) : (
                                <Typography variant="body1">
                                    Completing submission to our secure database...
                                </Typography>
                            )}
                        </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={activeStep === 0 ? () => navigate('/dashboard') : handleBack}
                            disabled={loading || blockchainLoading || success}
                        >
                            {activeStep === 0 ? 'Cancel' : 'Back'}
                        </Button>
                        
                        {activeStep < 2 && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNext}
                                disabled={loading || blockchainLoading || success}
                                startIcon={loading || blockchainLoading ? <CircularProgress size={20} /> : null}
                            >
                                {activeStep === 0 ? 'Next' : 'Submit to Blockchain'}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default SubmitReport; 