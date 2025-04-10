const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const mongoose = require('mongoose');

// Ensure uploads directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) {
                return cb(err);
            }
            const sanitizedName = path.basename(file.originalname)
                .replace(/[^a-zA-Z0-9_.]/g, '_');
            cb(null, buf.toString('hex') + '_' + sanitizedName);
        });
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        }
        
        cb(new Error(`Invalid file type: Only JPEG, JPG, PNG, and PDF are allowed`));
    }
}).array('evidence', 5);

// Create a new report - direct to MongoDB, bypassing mongoose validation
router.post('/', auth, (req, res) => {
    upload(req, res, async function(err) {
        if (err) {
            console.error('File upload error:', err.message);
            return res.status(400).json({ error: `File upload error: ${err.message}` });
        }
        
        try {
            // Get data from request
            const {
                title,
                description,
                location,
                reportType,
                transactionHash,
                blockchainReportId
            } = req.body;
            
            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }
            
            if (!transactionHash) {
                return res.status(400).json({ error: 'Transaction hash is required' });
            }
            
            console.log('Blockchain report submission:', {
                title,
                reportType: reportType || 'Other',
                transactionHash,
                blockchainReportId: blockchainReportId || 'Not provided'
            });
            
            // Generate evidence paths if files are uploaded
            const evidencePaths = req.files ? req.files.map(file => file.path) : [];
            
            // Create document directly with MongoDB driver
            const db = mongoose.connection.db;
            const result = await db.collection('reports').insertOne({
                title,
                description,
                location,
                reportType: reportType || 'Other',
                type: reportType || 'Other',  // Add both fields for compatibility
                reporter: new mongoose.Types.ObjectId(req.user.id),
                status: 'Pending',
                date: new Date(),
                transactionHash,
                evidence: evidencePaths,
                files: evidencePaths,
                blockchainTxHash: transactionHash,
                blockchainReportId: blockchainReportId || null,
                isVerified: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('Report saved with direct MongoDB insert:', result.insertedId);
            
            // Return success response
            res.status(201).json({
                _id: result.insertedId,
                title,
                reportType: reportType || 'Other',
                description,
                location,
                transactionHash,
                blockchainTxHash: transactionHash,
                blockchainReportId: blockchainReportId || null,
                message: 'Report successfully saved with blockchain transaction'
            });
            
        } catch (error) {
            console.error('Error in blockchain report submission:', error);
            
            // Clean up uploaded files if there was an error
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (err) {
                        console.error(`Failed to clean up file ${file.path}:`, err);
                    }
                });
            }
            
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    });
});

module.exports = router; 