const express = require("express");
const multer = require("multer");
const Report = require("../models/Report");
const { auth } = require("../middleware/auth");
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Files will be stored in "uploads/" folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filenames
  },
});

const upload = multer({ storage });

// Submit a Crime Report with Files
router.post("/create", auth, upload.array("files", 5), async (req, res) => {
  console.log('=== Starting Report Creation ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('User from auth middleware:', req.user);

  try {
    if (!req.user || !req.user._id) {
      console.error('Authentication error: No user found');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { title, type, description, location, date, transactionHash } = req.body;
    console.log('Extracted fields:', { title, type, description, location, date, transactionHash });
    
    // Validate required fields
    if (!title || !type || !description || !location || !date || !transactionHash) {
      console.error('Missing required fields:', {
        hasTitle: !!title,
        hasType: !!type,
        hasDescription: !!description,
        hasLocation: !!location,
        hasDate: !!date,
        hasTransactionHash: !!transactionHash
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get file paths
    const files = req.files ? req.files.map((file) => file.path) : [];
    console.log('Processed file paths:', files);
    
    // Handle evidence hashes
    let evidenceHashes = [];
    if (req.body.evidenceHashes) {
      console.log('Raw evidenceHashes:', req.body.evidenceHashes);
      try {
        evidenceHashes = JSON.parse(req.body.evidenceHashes);
        if (!Array.isArray(evidenceHashes)) {
          evidenceHashes = [evidenceHashes];
        }
        console.log('Parsed evidenceHashes:', evidenceHashes);
      } catch (e) {
        console.error('Error parsing evidenceHashes:', e);
        evidenceHashes = [req.body.evidenceHashes];
      }
    }

    console.log('Creating report with data:', {
      title,
      type,
      description,
      location,
      date,
      transactionHash,
      evidenceHashes,
      files,
      reporter: req.user._id
    });

    const newReport = new Report({ 
      title, 
      type,
      description, 
      location,
      date: new Date(date),
      transactionHash,
      evidenceHashes,
      files,
      reporter: req.user._id
    });

    console.log('Attempting to save report to database...');
    await newReport.save();
    console.log('Report saved successfully');
    
    res.json({ message: "Report submitted successfully", report: newReport });
  } catch (error) {
    console.error('=== Error in Report Creation ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    res.status(500).json({ 
      error: error.message,
      details: error.stack 
    });
  }
});

// Fetch All Reports
router.get("/", async (req, res) => {
  try {
    const reports = await Report.find().populate("reporter", "walletAddress");
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
