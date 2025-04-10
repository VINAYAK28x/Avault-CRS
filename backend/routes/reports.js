const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { auth, isAdmin } = require('../middleware/auth');
const blockchainService = require('../utils/blockchain');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const User = require('../models/User');
const mongoose = require('mongoose');

// Ensure uploads directory exists
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(16, (err, buf) => {
            if (err) {
                console.error('Error generating filename:', err);
                return cb(err);
            }
            // Sanitize the original filename to remove special characters
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
        
        cb(new Error(`Invalid file type: Only JPEG, JPG, PNG, and PDF are allowed. You uploaded: ${file.mimetype}`));
    }
}).array('evidence', 5);

// Create a new report
router.post('/', auth, (req, res) => {
    // Use a custom error handler for multer
    upload(req, res, async function(err) {
        // Handle file upload errors
        if (err) {
            console.error('File upload error:', err.message);
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: 'File size limit exceeded. Maximum size is 10MB per file.'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(400).json({
                        error: 'Too many files. Maximum is 5 files.'
                    });
                }
                return res.status(400).json({
                    error: `File upload error: ${err.message}`
                });
            }
            
            // Other errors
            return res.status(400).json({
                error: `File upload error: ${err.message}`
            });
        }
        
        // Once files are uploaded, proceed with report creation
        try {
            // Support both old and new field names
            const {
                title,
                description,
                location,
                reportType,
                type, // Old field name
                date,
                transactionHash,
                blockchainReportId
            } = req.body;
            
            // Use either reportType or fallback to old type field
            const finalReportType = reportType || type || 'Other';
            
            console.log('Report submission received:', {
                title,
                reportType: finalReportType,
                location,
                hasDescription: !!description,
                date: date || 'Not provided (using current date)',
                transactionHash: transactionHash || 'Not provided',
                blockchainReportId: blockchainReportId || 'Not provided',
                files: req.files?.length || 0
            });
            
            // Validate required fields
            if (!title) {
                return res.status(400).json({ error: 'Title is required' });
            }
            
            const timestamp = Date.now();
            
            console.log('Creating new report:', { title, reportType: finalReportType, location });
            console.log('Files uploaded:', req.files?.length || 0);
            
            // Generate evidence hashes if files are uploaded
            const evidenceHashes = req.files ? req.files.map(file => {
                return crypto.createHash('sha256').update(file.path).digest('hex');
            }) : [];

            let blockchainResult = { success: false, error: 'Blockchain operation not performed' };
            
            // If we have a transaction hash from the frontend, use it
            if (transactionHash) {
                console.log('Using transaction hash from frontend:', transactionHash);
                blockchainResult = { 
                    success: true,
                    transactionHash,
                    reportId: blockchainReportId || null,
                    fromFrontend: true
                };
            } 
            // Otherwise try to store on blockchain through backend
            else {
                try {
                    console.log('No transaction hash provided, attempting to store on blockchain...');
                    blockchainResult = await blockchainService.submitReport(
                        title,
                        finalReportType, // Provide a default if reportType is missing
                        description,
                        location,
                        evidenceHashes,
                        timestamp
                    );
                    
                    console.log('Blockchain result:', blockchainResult);
                } catch (blockchainError) {
                    console.error('Error in blockchain operation:', blockchainError);
                    blockchainResult = { 
                        success: false, 
                        error: blockchainError.message || 'Unknown blockchain error' 
                    };
                }
            }

            // Create report in database whether blockchain succeeded or not
            const report = new Report({
                title,
                description,
                location,
                // Use both old and new field names to satisfy the schema validation
                type: finalReportType,
                reportType: finalReportType,
                reporter: req.user.id,
                evidence: req.files ? req.files.map(file => file.path) : [],
                files: req.files ? req.files.map(file => file.path) : [], // Old field name
                blockchainTxHash: blockchainResult.transactionHash || null,
                blockchainReportId: blockchainResult.reportId || blockchainReportId || null,
                status: 'Pending', // Use the old valid status value
                date: date || new Date(),
                transactionHash: transactionHash || blockchainResult.transactionHash || null,
            });

            await report.save();
            
            // Return a warning if necessary
            if (!blockchainResult.success && !transactionHash) {
                return res.status(201).json({
                    ...report.toObject(),
                    warning: 'Report saved to database only. Blockchain storage failed: ' + 
                            (blockchainResult.error || 'Unknown error')
                });
            }
            
            // Return appropriate response based on frontend vs backend blockchain submission
            if (transactionHash) {
                res.status(201).json({
                    ...report.toObject(),
                    message: 'Report successfully saved with blockchain transaction from frontend'
                });
            } else {
                res.status(201).json({
                    ...report.toObject(),
                    message: 'Report successfully saved to blockchain and database'
                });
            }
        } catch (error) {
            console.error('Error creating report:', error);
            
            // Clean up uploaded files if there was an error
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    try {
                        fs.unlinkSync(file.path);
                        console.log(`Cleaned up file: ${file.path}`);
                    } catch (err) {
                        console.error(`Failed to clean up file ${file.path}:`, err);
                    }
                });
            }
            
            res.status(500).json({ error: 'Server error', details: error.message });
        }
    });
});

// Get all reports
router.get('/', auth, async (req, res) => {
    try {
        console.log('GET /reports endpoint accessed');
        
        const reports = await Report.find()
            .populate('reporter', 'name email')
            .populate('assignedOfficer', 'name email')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${reports.length} reports`);
        
        // Send response with status code for clarity
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// ADMIN ROUTES - Must come before routes with path parameters
// Get all reports - Admin only
router.get('/admin', auth, isAdmin, async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'name email walletAddress')
            .sort({ createdAt: -1 });
        
        console.log(`Retrieved ${reports.length} reports for admin`);
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching admin reports:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Update report status - Admin only
router.patch('/admin/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;
        
        // Validate status
        const validStatuses = ['Pending', 'Under Investigation', 'Verified', 'Resolved', 'Closed', 'Fake'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status', 
                validStatuses 
            });
        }
        
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Update status
        report.status = status;
        
        // Add comment if provided
        if (comment) {
            if (!report.adminComments) {
                report.adminComments = [];
            }
            report.adminComments.push({
                text: comment,
                status,
                createdBy: req.user._id,
                createdAt: new Date()
            });
        }
        
        // If marking as Verified, update isVerified flag
        if (status === 'Verified') {
            report.isVerified = true;
        }
        
        // Update on blockchain if there's a transaction hash
        let blockchainResult = null;
        if (report.blockchainTxHash) {
            try {
                blockchainResult = await blockchainService.updateReportStatus(
                    report.blockchainReportId, 
                    status
                );
                
                console.log('Blockchain status update:', blockchainResult);
                
                if (blockchainResult.success) {
                    report.blockchainStatusUpdateTxHash = blockchainResult.transactionHash;
                }
            } catch (blockchainError) {
                console.error('Blockchain status update error:', blockchainError);
                // Continue even if blockchain update fails
            }
        }
        
        await report.save();
        
        res.status(200).json({
            success: true,
            report,
            blockchainResult
        });
    } catch (error) {
        console.error('Error updating report status:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get reports from blockchain - Admin only
router.get('/admin/blockchain', auth, isAdmin, async (req, res) => {
    try {
        // Get report count from blockchain
        const countResult = await blockchainService.getReportCount();
        if (!countResult.success) {
            return res.status(500).json({ 
                error: 'Failed to get report count from blockchain',
                details: countResult.error
            });
        }
        
        console.log(`Found ${countResult.count} reports on blockchain`);
        
        // If no reports, return empty array
        if (parseInt(countResult.count) === 0) {
            return res.status(200).json([]);
        }
        
        // Get all reports from blockchain
        const reports = [];
        for (let i = 1; i <= parseInt(countResult.count); i++) {
            try {
                const reportResult = await blockchainService.getReport(i);
                if (reportResult.success) {
                    reports.push(reportResult.report);
                }
            } catch (error) {
                console.error(`Error fetching report ${i} from blockchain:`, error);
                // Continue to next report
            }
        }
        
        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching blockchain reports:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get a specific report by ID including blockchain data - Admin only
router.get('/admin/:id', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`GET /reports/admin/${id} endpoint accessed`);
        
        // Validate if ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`Error fetching report by ID: Invalid ObjectId format: ${id}`);
            return res.status(400).json({ error: 'Invalid report ID format' });
        }
        
        // Get report from database
        const report = await Report.findById(id)
            .populate('reporter', 'name email walletAddress')
            .populate('assignedOfficer', 'name email');
            
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        let blockchainReport = null;
        // If there's a blockchain ID, fetch the blockchain data
        if (report.blockchainReportId) {
            try {
                const blockchainResult = await blockchainService.getReport(report.blockchainReportId);
                if (blockchainResult.success) {
                    blockchainReport = blockchainResult.report;
                }
            } catch (blockchainError) {
                console.error('Error fetching blockchain report:', blockchainError);
                // Continue without blockchain data
            }
        }
        
        res.status(200).json({
            report,
            blockchainReport
        });
    } catch (error) {
        console.error('Error fetching report details:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Assign report to officer - Admin only
router.patch('/admin/:id/assign', auth, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { officerId } = req.body;
        
        if (!officerId) {
            return res.status(400).json({ error: 'Officer ID is required' });
        }
        
        // Check if officer exists
        const officer = await User.findById(officerId);
        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        // Assign officer
        report.assignedOfficer = officerId;
        
        // Update status to 'Under Investigation' if not already
        if (report.status === 'Pending') {
            report.status = 'Under Investigation';
        }
        
        await report.save();
        
        res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        console.error('Error assigning report:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Get report by ID - This must be the last route to avoid conflicts with more specific routes
router.get('/:id', auth, async (req, res) => {
    try {
        console.log(`GET /reports/${req.params.id} endpoint accessed`);
        
        // Validate if ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            console.error(`Error fetching report by ID: Invalid ObjectId format: ${req.params.id}`);
            return res.status(400).json({ error: 'Invalid report ID format' });
        }
        
        const report = await Report.findById(req.params.id)
            .populate('reporter', 'name email')
            .populate('assignedOfficer', 'name email');

        if (!report) {
            console.log(`Report with ID ${req.params.id} not found`);
            return res.status(404).json({ error: 'Report not found' });
        }
        
        console.log(`Report found: ${report._id}, blockchain ID: ${report.blockchainReportId || 'none'}`);
        
        // Only attempt to get blockchain data if we have a blockchain report ID
        let blockchainData = null;
        if (report.blockchainReportId) {
            try {
                console.log(`Fetching blockchain data for report ID: ${report.blockchainReportId}`);
                const blockchainReport = await blockchainService.getReport(report.blockchainReportId);
                blockchainData = blockchainReport.success ? blockchainReport.report : null;
                
                if (!blockchainReport.success) {
                    console.error(`Blockchain fetch failed: ${blockchainReport.error}`);
                }
            } catch (blockchainError) {
                console.error('Error fetching blockchain data:', blockchainError);
                // We continue even if blockchain fetch fails
            }
        } else {
            console.log('No blockchain report ID available, skipping blockchain data fetch');
        }
        
        res.json({
            ...report.toObject(),
            blockchain: blockchainData
        });
    } catch (error) {
        console.error('Error fetching report by ID:', error);
        res.status(500).json({ error: 'Server error', details: error.message });
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