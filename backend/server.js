require("dotenv").config();
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const authRoutes = require("./routes/auth"); // ✅ Import Auth Routes
const reportsRoutes = require("./routes/reports"); // ✅ Import Reports Routes (fixed plural)
const blockchainReportsRoutes = require("./routes/blockchain-reports"); // Import Blockchain Reports Routes
const User = require("./models/User");

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600 // Cache preflight requests for 10 minutes
}));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads")); // Serve uploaded files

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/crimeReports", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// Health check endpoint - Move this before other routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// User Signup Route
app.post("/api/signup", async (req, res) => {
    try {
        console.log("Received request body:", req.body); // Debugging step

        const { username, password, walletId } = req.body;
        if (!username || !password || !walletId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, walletId });

        await newUser.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error("Error in signup:", err); // Log the error
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

app.post("/api/signup", async (req, res) => {
    try {
        const { username, password, walletId } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save new user
        const newUser = new User({ username, password: hashedPassword, walletId });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// User Login Route (Supports both Username/Password & Wallet Login)
app.post("/api/login", async (req, res) => {
    try {
        const { username, password, walletId } = req.body;
        let user;

        if (walletId) {
            // Login using MetaMask Wallet ID
            user = await User.findOne({ walletId });
            if (!user) return res.status(400).json({ message: "User not found. Please sign up." });
        } else {
            // Login using Username and Password
            user = await User.findOne({ username });
            if (!user) return res.status(400).json({ message: "Invalid credentials" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                walletAddress: user.walletAddress 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );

        res.json({ token, user: { id: user._id, username: user.username, walletId: user.walletId } });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// Register Auth & Report Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportsRoutes); // Fix route name to match the import
app.use("/api/blockchain-reports", blockchainReportsRoutes); // Add new blockchain reports route

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('=== Unhandled Error ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request body:', req.body);
    console.error('Request headers:', req.headers);
    console.error('=====================');
    
    res.status(500).json({ 
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

