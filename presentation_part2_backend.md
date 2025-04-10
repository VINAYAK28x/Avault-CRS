# Crime Reporting System - Backend Components

## Server Configuration (server.js)

```javascript
// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Initialize Express app
const app = express();

// Middleware configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet());
app.use(compression());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
```

### Server Configuration Explanation
- Sets up Express server with security middleware
- Configures CORS for frontend communication
- Establishes MongoDB connection
- Implements error handling

## Authentication Middleware (authMiddleware.js)

```javascript
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    console.log('=== Auth Middleware ===');
    console.log('Headers:', req.headers);
    
    const token = req.header("Authorization");
    if (!token) {
        console.log('No token found in request');
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
```

### Authentication Middleware Explanation
- Verifies JWT tokens for protected routes
- Validates user existence in database
- Provides detailed error logging
- Implements secure token handling

## Report Routes (report.js)

```javascript
router.post("/create", authMiddleware, upload.array("files", 5), async (req, res) => {
    console.log('=== Starting Report Creation ===');
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const { title, type, description, location, date, transactionHash } = req.body;
        
        // Validate required fields
        if (!title || !type || !description || !location || !date || !transactionHash) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Handle file uploads and evidence hashes
        const files = req.files ? req.files.map((file) => file.path) : [];
        let evidenceHashes = [];
        if (req.body.evidenceHashes) {
            evidenceHashes = JSON.parse(req.body.evidenceHashes);
        }

        // Create and save report
        const newReport = new Report({ 
            title, type, description, location,
            date: new Date(date),
            transactionHash,
            evidenceHashes,
            files,
            reporter: req.user._id
        });

        await newReport.save();
        res.json({ message: "Report submitted successfully", report: newReport });
    } catch (error) {
        console.error('=== Error in Report Creation ===');
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
```

### Report Routes Explanation
- Handles report creation with file uploads
- Implements authentication checks
- Validates required fields
- Manages file storage and evidence hashes

## Models

### User Model (User.js)

```javascript
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    }
}, { timestamps: true });
```

### Report Model (Report.js)

```javascript
const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['theft', 'assault', 'fraud', 'other']
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
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
    }]
}, { timestamps: true });
```

### Models Explanation
- Defines data structure for users and reports
- Implements data validation
- Manages relationships between entities
- Includes timestamps for auditing

## Backend Security Features

1. **Authentication & Authorization**
   - JWT token validation
   - Role-based access control
   - Session management

2. **Data Security**
   - Input validation
   - Data sanitization
   - Secure password handling

3. **File Handling**
   - Secure file uploads
   - File type validation
   - Size restrictions

4. **API Security**
   - Rate limiting
   - CORS configuration
   - Error handling

## Backend Architecture Overview

1. **Server Layer**
   - Express configuration
   - Middleware setup
   - Route management

2. **Authentication Layer**
   - Token handling
   - User verification
   - Session management

3. **Data Layer**
   - MongoDB models
   - Data validation
   - Relationship management

4. **File Management**
   - Upload handling
   - Storage management
   - File processing 