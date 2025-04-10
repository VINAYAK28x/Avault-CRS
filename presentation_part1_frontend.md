# Crime Reporting System - Frontend Components

## Frontend API Configuration (api.js)

```javascript
// Base API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance configuration
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    }
});

// Request interceptor for authentication
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Report submission function
export const submitReport = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.post(`${API_URL}/reports/create`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(error.response?.data?.error || 'Failed to submit report');
    }
};
```

### API Configuration Explanation
- Sets up base API URL configuration
- Configures axios instance with default headers
- Implements authentication token handling
- Provides report submission functionality with file upload support

## Report Submission Component (SubmitReport.js)

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmittingToChain(true);

    try {
        // Get Web3 instance and contract
        const web3 = getWeb3();
        const contract = await getContract();

        // Get user's Ethereum address
        const accounts = await web3.eth.requestAccounts();
        const userAddress = accounts[0];

        // Prepare report data for blockchain
        const reportData = {
            title: formData.title,
            type: formData.type,
            description: formData.description,
            location: formData.location,
            evidenceHashes: files.map(file => file.hash),
            timestamp: Math.floor(new Date(formData.date).getTime() / 1000)
        };

        // Submit to blockchain
        const tx = await contract.methods.submitReport(
            reportData.title,
            reportData.type,
            reportData.description,
            reportData.location,
            reportData.evidenceHashes,
            reportData.timestamp
        ).send({ from: userAddress });

        // Create FormData for backend
        const backendData = new FormData();
        backendData.append('title', formData.title);
        backendData.append('type', formData.type);
        backendData.append('description', formData.description);
        backendData.append('location', formData.location);
        backendData.append('date', formData.date);
        backendData.append('transactionHash', tx.transactionHash);
        backendData.append('evidenceHashes', JSON.stringify(reportData.evidenceHashes));
        
        // Append files
        files.forEach(file => {
            if (file.file) {
                backendData.append('files', file.file);
            }
        });

        // Submit to backend
        await submitReport(backendData);
        
        enqueueSnackbar('Report submitted successfully', { variant: 'success' });
        navigate('/dashboard');
    } catch (error) {
        console.error('Submit report error:', error);
        enqueueSnackbar(error.message || 'Failed to submit report', { variant: 'error' });
    } finally {
        setLoading(false);
        setSubmittingToChain(false);
    }
};
```

### Report Submission Component Explanation
- Handles form submission with file uploads
- Integrates with Ethereum blockchain
- Manages loading states and error handling
- Provides user feedback through notifications

## Web3 Integration (contracts.js)

```javascript
// Contract ABI and address configuration
export const CRIME_REPORT_ABI = [/* Contract ABI */];
export const CRIME_REPORT_ADDRESS = "YOUR_CONTRACT_ADDRESS";

// Get Web3 instance
export const getWeb3 = () => {
    if (window.ethereum) {
        return new Web3(window.ethereum);
    }
    throw new Error("No Web3 provider found");
};

// Get contract instance
export const getContract = async () => {
    const web3 = getWeb3();
    return new web3.eth.Contract(CRIME_REPORT_ABI, CRIME_REPORT_ADDRESS);
};
```

### Web3 Integration Explanation
- Configures Web3 connection to Ethereum network
- Manages smart contract interaction
- Provides contract instance for transactions
- Handles Web3 provider detection

## Frontend Components Overview

1. **Authentication**
   - Login/Signup forms
   - Token management
   - Session handling

2. **Report Management**
   - Report submission
   - File upload handling
   - Blockchain integration

3. **User Interface**
   - Material-UI components
   - Responsive design
   - Error handling
   - Loading states

4. **Navigation**
   - Protected routes
   - User dashboard
   - Report details view

## Frontend Security Features

1. **Authentication**
   - JWT token handling
   - Secure storage
   - Request interceptors

2. **Data Validation**
   - Input sanitization
   - File type checking
   - Size limitations

3. **Error Handling**
   - User feedback
   - Error recovery
   - Session management

4. **Integration Security**
   - API endpoint protection
   - CORS configuration
   - Secure file uploads 