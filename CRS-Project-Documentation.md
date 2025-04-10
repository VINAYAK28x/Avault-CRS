# Crime Reporting System (CRS) - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Smart Contract](#smart-contract)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Integration Points](#integration-points)
7. [Environment Configuration](#environment-configuration)
8. [Deployment Process](#deployment-process)
9. [Future Enhancements](#future-enhancements)

## Project Overview

The Crime Reporting System (CRS) is a decentralized application that leverages blockchain technology to create an immutable and transparent record of crime reports. The system allows users to submit crime reports, track their status, and provides a verifiable chain of custody for evidence.

Key features of the system include:
- Immutable storage of crime reports on the Ethereum blockchain (Sepolia testnet)
- File evidence uploading and hashing for verification
- Report status tracking and updates
- User authentication and authorization
- Officer assignment to reports
- Report verification mechanism

The application is built using a 3-tier architecture:
1. Smart Contract (Solidity) - For blockchain interaction
2. Backend API (Node.js/Express) - For business logic and database operations
3. Frontend Application (React) - For user interface

## Architecture

The CRS project follows a modern web application architecture with blockchain integration:

```
+------------------+     +------------------+     +--------------------+
|                  |     |                  |     |                    |
|  React Frontend  |<--->|  Express Backend |<--->|  MongoDB Database  |
|                  |     |                  |     |                    |
+------------------+     +------------------+     +--------------------+
        ^                        ^
        |                        |
        v                        v
+--------------------------------------------------+
|                                                  |
|              Ethereum Blockchain                 |
|             (Sepolia Testnet)                    |
|                                                  |
+--------------------------------------------------+
```

## Smart Contract

The `CrimeReport.sol` smart contract serves as the blockchain component of our system. This contract maintains an immutable record of all reports submitted to the system.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CrimeReport {
    // Defines the structure of a crime report
    struct Report {
        uint256 id;                // Unique identifier for the report
        string title;              // Title of the report
        string reportType;         // Type of crime (e.g., theft, fraud)
        string description;        // Detailed description of the incident
        string location;           // Location where the crime occurred
        string[] evidenceHashes;   // Hashes of evidence files for verification
        uint256 timestamp;         // Time when the report was submitted
        address reporter;          // Ethereum address of the person who filed the report
        string status;             // Current status of the report (e.g., Pending, Under Investigation)
    }

    // Array to store all reports
    Report[] public reports;
    
    // Mapping from user address to their report IDs
    mapping(address => uint256[]) public userReports;
    
    // Counter to assign unique IDs to reports
    uint256 private reportCounter;

    // Events for logging actions
    event ReportSubmitted(uint256 indexed id, address indexed reporter, string title);
    event ReportStatusUpdated(uint256 indexed id, string status);

    // Initialize the contract
    constructor() {
        reportCounter = 0;
    }

    // Function to submit a new report
    function submitReport(
        string memory _title,
        string memory _reportType,
        string memory _description,
        string memory _location,
        string[] memory _evidenceHashes,
        uint256 _timestamp
    ) public returns (uint256) {
        uint256 reportId = reportCounter++;
        
        // Create new report with the provided data
        Report memory newReport = Report({
            id: reportId,
            title: _title,
            reportType: _reportType,
            description: _description,
            location: _location,
            evidenceHashes: _evidenceHashes,
            timestamp: _timestamp,
            reporter: msg.sender,
            status: "Pending"
        });

        // Store the report and update user's report list
        reports.push(newReport);
        userReports[msg.sender].push(reportId);

        // Emit event to notify about the new report
        emit ReportSubmitted(reportId, msg.sender, _title);
        return reportId;
    }

    // Function to update the status of a report
    function updateReportStatus(uint256 _reportId, string memory _status) public {
        // Validate report exists and user is authorized
        require(_reportId < reports.length, "Report does not exist");
        require(msg.sender == reports[_reportId].reporter, "Not authorized");
        
        // Update status and emit event
        reports[_reportId].status = _status;
        emit ReportStatusUpdated(_reportId, _status);
    }

    // Function to retrieve details of a specific report
    function getReport(uint256 _reportId) public view returns (
        uint256 id,
        string memory title,
        string memory reportType,
        string memory description,
        string memory location,
        string[] memory evidenceHashes,
        uint256 timestamp,
        address reporter,
        string memory status
    ) {
        require(_reportId < reports.length, "Report does not exist");
        Report memory report = reports[_reportId];
        return (
            report.id,
            report.title,
            report.reportType,
            report.description,
            report.location,
            report.evidenceHashes,
            report.timestamp,
            report.reporter,
            report.status
        );
    }

    // Function to get all reports submitted by a specific user
    function getUserReports(address _user) public view returns (uint256[] memory) {
        return userReports[_user];
    }

    // Function to get the total number of reports
    function getReportCount() public view returns (uint256) {
        return reports.length;
    }
}
```

### Smart Contract Functions

1. **submitReport**: Allows users to submit new crime reports with details and evidence hashes
2. **updateReportStatus**: Enables updating the status of a report (only by the reporter)
3. **getReport**: Retrieves detailed information about a specific report
4. **getUserReports**: Gets all report IDs submitted by a specific user
5. **getReportCount**: Returns the total number of reports in the system

## Backend Implementation

The backend of our CRS project is built using Node.js with Express and interacts with both MongoDB and the Ethereum blockchain.

### Blockchain Service

The `blockchain.js` file provides a service layer for interacting with the smart contract:

```javascript
const Web3 = require('web3');
const contractABI = require('../contracts/CrimeReport.json').abi;
require('dotenv').config();

class BlockchainService {
    constructor() {
        // Initialize Web3 with the configured blockchain node URL
        this.web3 = new Web3(process.env.BLOCKCHAIN_NODE_URL || 'http://localhost:8545');
        
        // Create contract instance with ABI and address
        this.contract = new this.web3.eth.Contract(
            contractABI,
            process.env.CONTRACT_ADDRESS
        );
        
        // Account used for blockchain transactions
        this.adminAccount = process.env.ADMIN_ACCOUNT;
    }

    // Submit a new report to the blockchain
    async submitReport(title, reportType, description, location, evidenceHashes, timestamp) {
        try {
            // Estimate gas required for the transaction
            const gas = await this.contract.methods
                .submitReport(title, reportType, description, location, evidenceHashes, timestamp)
                .estimateGas({ from: this.adminAccount });

            // Execute the transaction
            const result = await this.contract.methods
                .submitReport(title, reportType, description, location, evidenceHashes, timestamp)
                .send({
                    from: this.adminAccount,
                    gas: Math.floor(gas * 1.5) // Add 50% buffer for safety
                });

            // Return success with transaction details
            return {
                success: true,
                reportId: result.events.ReportSubmitted.returnValues.id,
                transactionHash: result.transactionHash
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update the status of a report on the blockchain
    async updateReportStatus(reportId, status) {
        try {
            const gas = await this.contract.methods
                .updateReportStatus(reportId, status)
                .estimateGas({ from: this.adminAccount });

            const result = await this.contract.methods
                .updateReportStatus(reportId, status)
                .send({
                    from: this.adminAccount,
                    gas: Math.floor(gas * 1.5)
                });

            return {
                success: true,
                transactionHash: result.transactionHash
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get details of a specific report from the blockchain
    async getReport(reportId) {
        try {
            const report = await this.contract.methods
                .getReport(reportId)
                .call();

            return {
                success: true,
                report: {
                    id: report.id,
                    title: report.title,
                    reportType: report.reportType,
                    description: report.description,
                    location: report.location,
                    evidenceHashes: report.evidenceHashes,
                    timestamp: report.timestamp,
                    reporter: report.reporter,
                    status: report.status
                }
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all reports submitted by a specific user
    async getUserReports(userAddress) {
        try {
            const reportIds = await this.contract.methods
                .getUserReports(userAddress)
                .call();

            return {
                success: true,
                reportIds
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get the total number of reports
    async getReportCount() {
        try {
            const count = await this.contract.methods
                .getReportCount()
                .call();

            return {
                success: true,
                count
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainService();
```

### Report Routes

The `reports.js` route file handles HTTP requests related to crime reports:

```javascript
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const blockchainService = require('../utils/blockchain');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Generate random filename to prevent collisions
        crypto.randomBytes(16, (err, buf) => {
            if (err) return cb(err);
            cb(null, buf.toString('hex') + path.extname(file.originalname));
        });
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Only allow specific file types
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only support jpeg, jpg, png, pdf'));
    }
});

// Create a new report
router.post('/', auth, upload.array('evidence', 5), async (req, res) => {
    try {
        const { title, description, location, reportType } = req.body;
        const timestamp = Date.now();
        
        // Generate evidence hashes if files are uploaded
        const evidenceHashes = req.files ? req.files.map(file => {
            return crypto.createHash('sha256').update(file.path).digest('hex');
        }) : [];

        // Store report on blockchain
        const blockchainResult = await blockchainService.submitReport(
            title,
            reportType,
            description,
            location,
            evidenceHashes,
            timestamp
        );
        
        if (!blockchainResult.success) {
            return res.status(500).json({ error: 'Blockchain storage failed' });
        }

        // Create report in database
        const report = new Report({
            title,
            description,
            location,
            reportType,
            reporter: req.user.id,
            evidence: req.files ? req.files.map(file => file.path) : [],
            blockchainTxHash: blockchainResult.transactionHash,
            blockchainReportId: blockchainResult.reportId
        });

        await report.save();
        res.status(201).json(report);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all reports
router.get('/', auth, async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'name email')
            .populate('assignedOfficer', 'name email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get report by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'name email')
            .populate('assignedOfficer', 'name email');

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Get blockchain data
        const blockchainReport = await blockchainService.getReport(report.blockchainReportId);
        
        // Combine database and blockchain data
        res.json({
            ...report.toObject(),
            blockchain: blockchainReport.success ? blockchainReport.report : null
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update report status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Update status on blockchain
        const blockchainResult = await blockchainService.updateReportStatus(
            report.blockchainReportId,
            status
        );

        if (!blockchainResult.success) {
            return res.status(500).json({ error: 'Blockchain update failed' });
        }

        // Update status in database
        report.status = status;
        await report.save();

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify report (modified to use updateReportStatus since there's no verify function)
router.patch('/:id/verify', auth, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Update verification status using updateReportStatus
        const blockchainResult = await blockchainService.updateReportStatus(
            report.blockchainReportId,
            "Verified"
        );

        if (!blockchainResult.success) {
            return res.status(500).json({ error: 'Blockchain verification failed' });
        }

        // Mark as verified in database
        report.isVerified = true;
        report.status = "Verified";
        await report.save();

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Assign officer to report
router.patch('/:id/assign', auth, async (req, res) => {
    try {
        const { officerId } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        // Update officer assignment in database
        report.assignedOfficer = officerId;
        report.status = 'Under Investigation';
        await report.save();

        // Update status on blockchain
        await blockchainService.updateReportStatus(
            report.blockchainReportId,
            'Under Investigation'
        );

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
```

### Report Model

The MongoDB schema for crime reports is defined in `Report.js`:

```javascript
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Theft', 'Fraud', 'Cybercrime', 'Violence', 'Property Damage', 'Other']
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    transactionHash: {
        type: String,
        required: true
    },
    evidenceHashes: [{
        type: String
    }],
    files: [{
        type: String
    }],
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Investigation', 'Resolved', 'Closed'],
        default: 'Pending'
    },
    blockchainTxHash: {
        type: String
    },
    blockchainReportId: {
        type: Number
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    assignedOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Report", reportSchema);
```

## Frontend Implementation

The frontend of our CRS project is built using React and communicates with both the backend API and Ethereum blockchain.

### API Service

The `api.js` file provides functions for communicating with the backend:

```javascript
import axios from "axios";
import Web3 from "web3";

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
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor for handling auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only handle 401s for non-report submission endpoints
        if (error.response?.status === 401 && !error.config.url.includes('/reports/create')) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

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
            type: formData.get('type'),
            description: formData.get('description'),
            location: formData.get('location'),
            date: formData.get('date'),
            transactionHash: formData.get('transactionHash'),
            evidenceHashes: formData.get('evidenceHashes'),
            files: formData.getAll('files').map(f => f.name)
        });

        const response = await api.post('/reports/create', formData, {
            headers: {
                // Let browser set correct Content-Type for FormData
                'Content-Type': undefined
            }
        });

        if (response.data) {
            console.log('Report submitted successfully:', response.data);
            return response.data;
        } else {
            throw new Error('No response data received');
        }
    } catch (error) {
        console.error('Report submission error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        // Handle 401 errors specifically for report submission
        if (error.response?.status === 401) {
            const errorMessage = error.response.data?.error || 'Authentication failed. Please try logging in again.';
            throw new Error(errorMessage);
        }

        // Handle other errors
        if (error.response?.data?.error) {
            throw new Error(error.response.data.error);
        }
        throw new Error(error.message || 'Failed to submit report');
    }
};

// Get all reports
export const getReports = async () => {
    const response = await api.get("/reports");
    return response.data;
};

// Get a specific report by ID
export const getReport = async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
};

// Update the status of a report
export const updateReportStatus = async (id, status) => {
    const response = await api.patch(`/reports/${id}/status`, { status });
    return response.data;
};

// Verify a report
export const verifyReport = async (id) => {
    const response = await api.patch(`/reports/${id}/verify`);
    return response.data;
};

// Assign an officer to a report
export const assignOfficer = async (reportId, officerId) => {
    const response = await api.patch(`/reports/${reportId}/assign`, { officerId });
    return response.data;
};
```

### Blockchain Connection

The `contracts.js` file provides utilities for direct blockchain interaction:

```javascript
import Web3 from 'web3';

// Contract ABI - this defines the contract's interface
export const CRIME_REPORT_ABI = [
    // ABI definition (omitted for brevity)
];

// Contract configuration
export const CONTRACT_CONFIG = {
    address: process.env.REACT_APP_CONTRACT_ADDRESS,
    network: process.env.REACT_APP_BLOCKCHAIN_NETWORK || 'sepolia'
};

// Initialize Web3 with the provider
export const getWeb3 = () => {
    if (typeof window.ethereum !== 'undefined') {
        return new Web3(window.ethereum);
    }
    throw new Error('Please install MetaMask to use this feature');
};

// Get contract instance
export const getContract = async () => {
    const web3 = getWeb3();
    const networkId = await web3.eth.net.getId();
    
    if (!CONTRACT_CONFIG.address) {
        throw new Error('Contract address not configured');
    }

    return new web3.eth.Contract(
        CRIME_REPORT_ABI,
        CONTRACT_CONFIG.address
    );
};

// IPFS Configuration
export const IPFS_CONFIG = {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: `Basic ${Buffer.from(
            `${process.env.REACT_APP_INFURA_PROJECT_ID}:${process.env.REACT_APP_INFURA_PROJECT_SECRET}`
        ).toString('base64')}`,
    },
};
```

## Integration Points

Our CRS application has several key integration points:

### 1. Backend to Blockchain Integration
- The `blockchain.js` service interacts with the Ethereum blockchain using Web3.js
- Smart contract functions are called through this service to handle report operations

### 2. Frontend to Backend Integration  
- The React frontend communicates with the Express backend via RESTful API calls
- Authentication is handled through JWT tokens

### 3. Frontend to Blockchain Integration
- Direct blockchain interaction is possible through the Web3 provider in MetaMask
- Contract ABIs are used to define the interface between the frontend and smart contract

## Environment Configuration

The project uses environment variables to manage configuration settings:

### Backend Environment (.env)
```
MONGO_URI=mongodb://localhost:27017/crime_reports  
JWT_SECRET=mysecretkey  
PORT=5000  
INFURA_PROJECT_ID=eddc6dc0e3e74e31a9c2ba6a3fa7f8ec  
PRIVATE_KEY=52acd2bb2715b9101a2d23c48917996e1ad9be4ccf8f5d992453c478f8bfc9c2  
ETHERSCAN_API_KEY=7KMPTUCZGNS2IF7QK52266Q7V3FW8FWDQR  
MONGODB_URI=mongodb://localhost:27017/crime-reporting  
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/eddc6dc0e3e74e31a9c2ba6a3fa7f8ec
BLOCKCHAIN_NODE_URL=https://sepolia.infura.io/v3/eddc6dc0e3e74e31a9c2ba6a3fa7f8ec
CONTRACT_ADDRESS=0xfDFfcF81da82D8106cdA4E28811783a8F48cFd1B
ADMIN_ACCOUNT=0x52acd2bb2715b9101a2d23c48917996e1ad9be4ccf8f5d992453c478f8bfc9c2
```

### Frontend Environment (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BLOCKCHAIN_NODE_URL=https://sepolia.infura.io/v3/eddc6dc0e3e74e31a9c2ba6a3fa7f8ec
REACT_APP_CONTRACT_ADDRESS=0xfDFfcF81da82D8106cdA4E28811783a8F48cFd1B
REACT_APP_BLOCKCHAIN_NETWORK=sepolia
REACT_APP_INFURA_PROJECT_ID=eddc6dc0e3e74e31a9c2ba6a3fa7f8ec
REACT_APP_INFURA_PROJECT_SECRET=your_infura_project_secret
```

## Deployment Process

### Smart Contract Deployment

The smart contract was deployed to the Sepolia testnet using Hardhat:

1. Compile the contract:
```
npx hardhat compile
```

2. Deploy to Sepolia:
```
npx hardhat run scripts/deploy.js --network sepolia
```

The deployed contract address is: `0xfDFfcF81da82D8106cdA4E28811783a8F48cFd1B`

### Development Server Setup

1. Start the backend server:
```
cd backend
npm run dev
```

2. Start the frontend development server:
```
cd crs-frontend
npm start
```

## Future Enhancements

Potential future enhancements for the CRS project include:

1. **Advanced Reporting Features**
   - Geographic heat maps of crime reports
   - Statistical analysis and trend identification
   - Enhanced filtering and search capabilities

2. **Blockchain Enhancements**
   - Multi-signature verification for critical reports
   - Integration with decentralized storage (IPFS) for evidence files
   - Smart contract upgradeability for future improvements

3. **User Experience Improvements**
   - Mobile application development
   - Real-time notifications for report status changes
   - Integration with emergency services

4. **Security Enhancements**
   - Two-factor authentication
   - End-to-end encryption for sensitive reports
   - Advanced role-based access control 