import axios from "axios";
import Web3 from "web3";

// Base API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API URL:', API_URL);

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
        console.log('Adding auth token to request:', config.url);
        // Make sure token is properly formatted with 'Bearer ' prefix
        config.headers.Authorization = token.startsWith('Bearer ') 
            ? token 
            : `Bearer ${token}`;
    } else {
        console.log('No token found for request:', config.url);
    }
    
    return config;
}, (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401s for non-admin and non-login endpoints
        if (error.response?.status === 401 && 
            !error.config.url.includes('/reports/create') && 
            !error.config.url.includes('/admin') && 
            !error.config.url.includes('/login') &&
            !error.config.url.includes('/auth/admin')) {
            
            console.log('Redirecting to login due to auth error');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// MetaMask Authentication
export const authenticateWithMetaMask = async (address, userData = {}) => {
    try {
        // Create message to sign
        const timestamp = Date.now();
        const message = `Login to Crime Reporting System: ${timestamp}`;
        
        // Get Web3 instance
        const web3 = new Web3(window.ethereum);
        
        // Request signature from user if not provided
        const signature = await web3.eth.personal.sign(message, address, '');
        
        // Determine if this is registration or login
        const endpoint = userData.name ? '/auth/register' : '/auth/login';
        
        // Prepare request data based on the type of request
        const requestData = userData.name ? {
            // Registration data
            walletAddress: address.toLowerCase(),
            message,
            signature,
            name: userData.name,
            email: userData.email?.toLowerCase(),
            password: userData.password,
            dateOfBirth: userData.dateOfBirth,
            phoneNumber: userData.phoneNumber,
            // Generate a unique username from email
            username: userData.email?.toLowerCase().split('@')[0] + Math.floor(Math.random() * 1000),
            // Ensure address object is properly structured for registration
            address: {
                street: userData.address?.street || '',
                city: userData.address?.city || '',
                state: userData.address?.state || '',
                country: userData.address?.country || '',
                postalCode: userData.address?.postalCode || ''
            }
        } : {
            // Login data
            walletAddress: address.toLowerCase(),
            password: userData.password,
            signature,
            message,
            timestamp
        };

        // Log the full request data (excluding sensitive fields)
        console.log('Authentication request data:', {
            ...requestData,
            password: '[HIDDEN]',
            signature: '[HIDDEN]'
        });

        // Send to backend for verification
        const response = await api.post(endpoint, requestData);
        
        console.log('Server response:', {
            status: response.status,
            hasToken: !!response.data.token,
            hasUser: !!response.data.user
        });

        const { token, user } = response.data;
        if (token) {
            localStorage.setItem('token', token);
            return { token, user };
        } else {
            throw new Error('Authentication failed: No token received');
        }
    } catch (error) {
        // Log the full error response
        console.error('Authentication error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            endpoint: error.config?.url,
            validationErrors: error.response?.data?.errors,
            requestData: {
                ...error.config?.data,
                password: '[HIDDEN]',
                signature: '[HIDDEN]'
            }
        });
        
        // Handle specific error cases
        if (error.response?.status === 400) {
            const errorData = error.response.data;
            console.log('Server validation error:', errorData);

            if (errorData.message?.includes('duplicate') || errorData.error?.includes('Duplicate')) {
                if (errorData.field === 'username') {
                    throw new Error('Username is already taken. Please try again with a different email.');
                } else if (errorData.field === 'email') {
                    throw new Error('Email is already registered. Please try logging in instead.');
                } else if (errorData.field === 'walletAddress') {
                    throw new Error('This wallet address is already registered. Please try logging in instead.');
                } else {
                    throw new Error('This account is already registered. Please try logging in instead.');
                }
            } else if (errorData.errors) {
                // Handle validation errors
                const errorMessages = Object.entries(errorData.errors)
                    .map(([field, message]) => `${field}: ${message}`)
                    .join(', ');
                throw new Error(`Registration failed: ${errorMessages}`);
            } else if (errorData.message) {
                throw new Error(errorData.message);
            } else if (errorData.error) {
                throw new Error(errorData.error);
            } else {
                // Log the full error data for debugging
                console.error('Full error data:', errorData);
                throw new Error('Registration failed. Please check your input and try again.');
            }
        }
        
        throw error;
    }
};

// Report submission function
export const submitReport = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please log in to submit a report');
        }

        console.log('Using token:', token.substring(0, 20) + '...');
        console.log('FormData contents:', {
            title: formData.get('title'),
            reportType: formData.get('reportType'),
            description: formData.get('description'),
            location: formData.get('location'),
            date: formData.get('date'),
            transactionHash: formData.get('transactionHash'),
            evidenceHashes: formData.get('evidenceHashes'),
            files: formData.getAll('evidence').map(f => f.name || 'unnamed-file')
        });

        // Log all form data entries for debugging
        console.log('All FormData entries:');
        for (let pair of formData.entries()) {
            console.log(`${pair[0]}: ${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]}`);
        }

        // Check if this is a blockchain submission (has transactionHash)
        if (formData.get('transactionHash')) {
            console.log('Using blockchain-reports endpoint for blockchain submission');
            return submitBlockchainReport(formData);
        }

        // Add timeout to prevent long-running requests
        const response = await api.post('/reports', formData, {
            headers: {
                // Let browser set correct Content-Type for FormData
                'Content-Type': undefined
            },
            timeout: 30000 // 30 second timeout
        });

        if (response.data) {
            console.log('Report submitted successfully:', response.data);
            // Check for warnings
            if (response.data.warning) {
                console.warn('Report submission warning:', response.data.warning);
                // Return both data and warning
                return {
                    ...response.data,
                    warning: response.data.warning
                };
            }
            return response.data;
        } else {
            throw new Error('No response data received');
        }
    } catch (error) {
        console.error('Report submission error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            endpoint: '/reports'
        });

        // Check for timeout
        if (error.code === 'ECONNABORTED') {
            throw new Error('Report submission timed out. The server is taking too long to respond.');
        }

        // Handle 401 errors specifically for report submission
        if (error.response?.status === 401) {
            const errorMessage = error.response.data?.error || 'Authentication failed. Please try logging in again.';
            throw new Error(errorMessage);
        }

        // Handle server errors
        if (error.response?.status === 500) {
            const details = error.response.data?.details || '';
            let errorMessage = 'Server error while submitting report.';
            
            // Look for specific blockchain errors
            if (details.includes('blockchain') || error.response.data?.error?.includes('blockchain')) {
                errorMessage = 'Blockchain storage error. Your report data will be saved in the database only.';
            }
            
            throw new Error(errorMessage + (details ? ` Details: ${details}` : ''));
        }

        // Handle validation errors
        if (error.response?.status === 400) {
            const errorMessage = error.response.data?.error || 'Invalid report data. Please check your form entries.';
            throw new Error(errorMessage);
        }

        // Generic error
        throw new Error(`Report submission failed: ${error.message}`);
    }
};

// New function for blockchain-based report submission
export const submitBlockchainReport = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Please log in to submit a report');
        }

        // Submit to blockchain-specific endpoint
        const response = await api.post('/blockchain-reports', formData, {
            headers: {
                'Content-Type': undefined
            },
            timeout: 30000
        });

        if (response.data) {
            console.log('Blockchain report submitted successfully:', response.data);
            return response.data;
        } else {
            throw new Error('No response data received from blockchain report submission');
        }
    } catch (error) {
        console.error('Blockchain report submission error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            endpoint: '/blockchain-reports'
        });

        // For any errors, throw with a clear message
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.details || 
                            error.message || 
                            'Failed to submit report to blockchain';

        throw new Error(`Blockchain report submission failed: ${errorMessage}`);
    }
};

export const getReports = async () => {
    try {
        console.log('Making API request to fetch reports...');
        console.log('API URL:', `${API_URL}/reports`);
        
        const response = await api.get("/reports");
        
        console.log('Reports API response:', response);
        
        if (!response.data) {
            throw new Error('No data received from the server');
        }
        
        return response.data;
    } catch (error) {
        console.error('Error in getReports:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            endpoint: error.config?.url
        });
        throw error;
    }
};

export const getReport = async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
};

export const updateAdminReportStatus = async (reportId, status, comment = '') => {
    try {
        // Format the status data properly as an object
        const statusData = {
            status: status,
            comment: comment
        };
        
        console.log('Updating report status:', { reportId, statusData });
        
        const response = await api.patch(`/reports/admin/${reportId}/status`, statusData);
        return response.data;
    } catch (error) {
        console.error('Update report status error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || error.message || 'Failed to update report status');
    }
};

export const verifyReport = async (id) => {
    const response = await api.patch(`/reports/${id}/verify`);
    return response.data;
};

export const assignOfficer = async (reportId, officerId) => {
    const response = await api.patch(`/reports/${reportId}/assign`, { officerId });
    return response.data;
};

// Auth APIs
export const login = async (credentials) => {
    try {
        // Create message to sign
        const timestamp = Date.now();
        const message = `Login to Crime Reporting System: ${timestamp}`;
        
        // Get Web3 instance
        const web3 = new Web3(window.ethereum);
        
        // Request signature from user
        const signature = await web3.eth.personal.sign(message, credentials.walletAddress, '');
        
        // Prepare login request data
        const requestData = {
            walletAddress: credentials.walletAddress.toLowerCase(),
            password: credentials.password,
            signature,
            message,
            timestamp
        };

        console.log('Login request data:', {
            ...requestData,
            password: '[HIDDEN]',
            signature: '[HIDDEN]'
        });

        const response = await api.post("/auth/login", requestData);
        const { token, user } = response.data;
        
        if (token) {
            localStorage.setItem("token", token);
            return { token, user };
        }
        throw new Error('No token received');
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            response: error.response?.data,
            requestData: error.config?.data
        });
        
        // Handle specific error cases
        if (error.response?.status === 400) {
            const errorData = error.response.data;
            if (errorData.error === 'Invalid signature') {
                throw new Error('Invalid signature. Please try again.');
            } else if (errorData.error === 'Invalid password') {
                throw new Error('Invalid password. Please try again.');
            } else if (errorData.error === 'User not found. Please register first.') {
                throw new Error('Account not found. Please register first.');
            } else if (errorData.error) {
                throw new Error(errorData.error);
            }
        }
        throw error;
    }
};

export const register = async (userData) => {
    try {
        // Create message to sign
        const timestamp = Date.now();
        const message = `Register for Crime Reporting System: ${timestamp}`;
        
        // Get Web3 instance
        const web3 = new Web3(window.ethereum);
        
        // Request signature from user
        const signature = await web3.eth.personal.sign(message, userData.walletAddress, '');
        
        // Prepare registration data
        const requestData = {
            walletAddress: userData.walletAddress.toLowerCase(),
            message,
            signature,
            name: userData.name,
            email: userData.email?.toLowerCase(),
            password: userData.password,
            dateOfBirth: userData.dateOfBirth,
            phoneNumber: userData.phoneNumber,
            address: {
                street: userData.address?.street || '',
                city: userData.address?.city || '',
                state: userData.address?.state || '',
                country: userData.address?.country || '',
                postalCode: userData.address?.postalCode || ''
            }
        };

        console.log('Registration request data:', {
            ...requestData,
            password: '[HIDDEN]',
            signature: '[HIDDEN]'
        });

        const response = await api.post("/auth/metamask-register", requestData);
        const { token, user } = response.data;
        
        if (token) {
            localStorage.setItem("token", token);
            return { token, user };
        }
        throw new Error('Registration failed: No token received');
    } catch (error) {
        console.error('Registration error:', {
            message: error.message,
            response: error.response?.data,
            requestData: error.config?.data
        });
        
        // Handle specific error cases
        if (error.response?.status === 400) {
            const errorData = error.response.data;
            if (errorData.error === 'Invalid signature') {
                throw new Error('Invalid signature. Please try again.');
            } else if (errorData.error === 'Wallet address already registered') {
                throw new Error('This wallet address is already registered. Please try logging in instead.');
            } else if (errorData.error === 'Email already registered') {
                throw new Error('This email is already registered. Please try logging in instead.');
            } else if (errorData.error === 'Validation failed') {
                const errorMessages = errorData.details.map(err => `${err.field}: ${err.message}`).join(', ');
                throw new Error(`Registration failed: ${errorMessages}`);
            } else if (errorData.error === 'Duplicate value found') {
                throw new Error(`Registration failed: ${errorData.field} is already taken.`);
            } else if (errorData.error) {
                throw new Error(errorData.error);
            }
        }
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem("token");
};

export const getCurrentUser = async () => {
    const response = await api.get("/auth/me");
    return response.data;
};

// Admin login function
export const adminLogin = async (credentials) => {
    try {
        const response = await api.post('/auth/admin-login', credentials);
        if (response.data) {
            // Save token to localStorage
            localStorage.setItem('token', response.data.token);
            // Save user info including admin role
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        }
        throw new Error('Invalid response from server');
    } catch (error) {
        console.error('Admin login error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Handle authentication errors
        if (error.response?.status === 401) {
            throw new Error(error.response.data?.error || 'Authentication failed. Invalid credentials.');
        }
        
        // Handle other errors
        throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
};

// Create admin account (for first time setup)
export const createAdmin = async (adminData) => {
    try {
        // Use direct axios call instead of the api instance with auth interceptors
        // This is because the create-admin endpoint should not require authentication
        const response = await axios.post(`${API_URL}/auth/create-admin`, adminData, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        
        console.log('Admin creation response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Create admin error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Return more specific error messages when available
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        } else if (error.response?.data?.details) {
            throw new Error(error.response.data.details);
        } else {
            throw new Error(error.message || 'Failed to create admin');
        }
    }
};

// Get all reports for admin
export const getAdminReports = async () => {
    try {
        console.log('Fetching admin reports...');
        const token = localStorage.getItem("token");
        console.log('Using token:', token ? `${token.substring(0, 15)}...` : 'No token found');
        
        const response = await api.get('/reports/admin');
        console.log('Admin reports response:', response.status, response.data.length || 0, 'reports');
        return response.data;
    } catch (error) {
        console.error('Get admin reports error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || error.message || 'Failed to fetch reports');
    }
};

// Get blockchain reports
export const getBlockchainReports = async () => {
    try {
        const response = await api.get('/reports/admin/blockchain');
        return response.data;
    } catch (error) {
        console.error('Get blockchain reports error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || error.message || 'Failed to fetch blockchain reports');
    }
};

// Get detailed report for admin
export const getAdminReportDetails = async (reportId) => {
    try {
        const response = await api.get(`/reports/admin/${reportId}`);
        return response.data;
    } catch (error) {
        console.error('Get report details error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || error.message || 'Failed to fetch report details');
    }
};

// Assign report to officer
export const assignReport = async (reportId, officerId) => {
    try {
        const response = await api.patch(`/reports/admin/${reportId}/assign`, { officerId });
        return response.data;
    } catch (error) {
        console.error('Assign report error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw new Error(error.response?.data?.error || error.message || 'Failed to assign report');
    }
};

// Check if admin exists
export const checkAdminExists = async () => {
    try {
        const response = await api.get('/auth/check-admin-exists');
        return response.data.adminExists;
    } catch (error) {
        console.error('Check admin exists error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return false; // Assume no admin exists if the request fails
    }
};

export default api;
