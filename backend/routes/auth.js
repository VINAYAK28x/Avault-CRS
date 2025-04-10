const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { check, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Web3 = require('web3');
const mongoose = require('mongoose');

const router = express.Router();

// Initialize Web3
const web3 = new Web3(process.env.BLOCKCHAIN_NODE_URL || 'http://localhost:8545');

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            userId: user._id,
            walletAddress: user.walletAddress 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// Register user with email and password
router.post(
    '/register',
    async (req, res) => {
        try {
            const { 
                name, 
                email, 
                password, 
                walletAddress, 
                dateOfBirth, 
                phoneNumber, 
                address,
                message,
                signature 
            } = req.body;

            console.log('Registration attempt with data:', { 
                name, 
                email, 
                walletAddress,
                dateOfBirth,
                phoneNumber,
                hasAddress: !!address,
                hasSignature: !!signature,
                hasMessage: !!message
            });

            // Verify the signature if provided
            if (signature && message && walletAddress) {
                try {
                    const recoveredAddress = web3.eth.accounts.recover(message, signature);
                    console.log('Signature verification:', {
                        recoveredAddress,
                        providedAddress: walletAddress,
                        matches: recoveredAddress.toLowerCase() === walletAddress.toLowerCase()
                    });
                    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                        return res.status(400).json({ error: 'Invalid signature' });
                    }
                } catch (sigError) {
                    console.error('Signature verification error:', sigError);
                    return res.status(400).json({ error: 'Invalid signature format' });
                }
            }

            // Basic validation
            if (!name || !password || !walletAddress) {
                console.error('Missing required fields:', { 
                    hasName: !!name, 
                    hasPassword: !!password, 
                    hasWallet: !!walletAddress 
                });
                return res.status(400).json({ error: 'Name, password, and wallet address are required' });
            }

            // Validate address object
            if (!address || !address.street || !address.city || !address.state || !address.country || !address.postalCode) {
                console.error('Invalid address object:', address);
                return res.status(400).json({ error: 'All address fields are required' });
            }

            // Check if user exists by wallet address
            let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
            if (user) {
                return res.status(400).json({ error: 'Wallet address already registered' });
            }

            // Check if email exists (if provided)
            if (email) {
                user = await User.findOne({ email: email.toLowerCase() });
                if (user) {
                    return res.status(400).json({ error: 'Email already registered' });
                }
            }

            // Create new user
            const userData = {
                name,
                email: email ? email.toLowerCase() : undefined,
                password,
                walletAddress: walletAddress.toLowerCase(),
                dateOfBirth: new Date(dateOfBirth),
                phoneNumber,
                address: {
                    street: address.street.trim(),
                    city: address.city.trim(),
                    state: address.state.trim(),
                    country: address.country.trim(),
                    postalCode: address.postalCode.trim(),
                },
            };

            console.log('Creating user with data:', {
                ...userData,
                password: '[HIDDEN]'
            });

            user = new User(userData);

            // Save user
            await user.save();
            console.log('User registered successfully:', user._id);

            // Generate token
            const token = generateToken(user);

            // Return user data and token
            res.status(201).json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    walletAddress: user.walletAddress,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Registration error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                errors: error.errors
            });

            if (error.name === 'ValidationError') {
                const validationErrors = Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }));
                console.error('Validation errors:', validationErrors);
                return res.status(400).json({ 
                    error: 'Validation failed', 
                    details: validationErrors 
                });
            }

            if (error.code === 11000) {
                console.error('Duplicate key error:', error.keyValue);
                return res.status(400).json({ 
                    error: 'Duplicate value found', 
                    field: Object.keys(error.keyValue)[0] 
                });
            }

            res.status(500).json({ 
                error: 'Server error during registration',
                message: error.message
            });
        }
    }
);

// Login with email and password
router.post(
    '/login',
    async (req, res) => {
        try {
            const { walletAddress, password, signature, message, timestamp } = req.body;
            console.log('Login attempt:', { walletAddress });

            // Verify the signature if provided
            if (signature && message && walletAddress) {
                try {
                    const recoveredAddress = web3.eth.accounts.recover(message, signature);
                    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                        return res.status(400).json({ error: 'Invalid signature' });
                    }
                } catch (sigError) {
                    console.error('Signature verification error:', sigError);
                    return res.status(400).json({ error: 'Invalid signature format' });
                }
            }

            // Find user by wallet address
            const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
            if (!user) {
                return res.status(400).json({ error: 'User not found. Please register first.' });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid password' });
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            console.log('User logged in successfully:', user._id);

            // Generate token
            const token = generateToken(user);

            // Return user data and token
            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    walletAddress: user.walletAddress,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }
);

// MetaMask Login
router.post('/metamask-login', async (req, res) => {
    try {
        const { walletAddress, password, signature, message, timestamp } = req.body;
        console.log('MetaMask login attempt:', { walletAddress });

        // Verify the signature
        const recoveredAddress = web3.eth.accounts.recover(message, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Find user with wallet address
        const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user);
        console.log('MetaMask login successful:', user._id);

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                walletAddress: user.walletAddress,
                role: user.role
            } 
        });
    } catch (error) {
        console.error('MetaMask login error:', error);
        res.status(500).json({ error: 'Server error during MetaMask login' });
    }
});

// MetaMask Registration
router.post('/metamask-register', async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            walletAddress, 
            dateOfBirth, 
            phoneNumber, 
            address,
            message,
            signature 
        } = req.body;

        console.log('MetaMask registration attempt:', { 
            name, 
            email, 
            walletAddress,
            dateOfBirth,
            phoneNumber,
            hasAddress: !!address,
            hasSignature: !!signature,
            hasMessage: !!message
        });

        // Verify the signature
        const recoveredAddress = web3.eth.accounts.recover(message, signature);
        if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Basic validation
        if (!name || !password || !walletAddress) {
            return res.status(400).json({ error: 'Name, password, and wallet address are required' });
        }

        // Validate address object
        if (!address || !address.street || !address.city || !address.state || !address.country || !address.postalCode) {
            return res.status(400).json({ error: 'All address fields are required' });
        }

        // Check if user exists by wallet address
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
        if (user) {
            return res.status(400).json({ error: 'Wallet address already registered' });
        }

        // Check if email exists (if provided)
        if (email) {
            user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                return res.status(400).json({ error: 'Email already registered' });
            }
        }

        // Create new user
        const userData = {
            name,
            email: email ? email.toLowerCase() : undefined,
            password,
            walletAddress: walletAddress.toLowerCase(),
            dateOfBirth: new Date(dateOfBirth),
            phoneNumber,
            address: {
                street: address.street.trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                country: address.country.trim(),
                postalCode: address.postalCode.trim(),
            },
        };

        console.log('Creating user with data:', {
            ...userData,
            password: '[HIDDEN]'
        });

        user = new User(userData);
        await user.save();
        console.log('User registered successfully:', user._id);

        // Generate token
        const token = generateToken(user);

        // Return user data and token
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletAddress: user.walletAddress,
                role: user.role
            }
        });
    } catch (error) {
        console.error('MetaMask registration error:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message
            }));
            return res.status(400).json({ 
                error: 'Validation failed', 
                details: validationErrors 
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({ 
                error: 'Duplicate value found', 
                field: Object.keys(error.keyValue)[0] 
            });
        }

        res.status(500).json({ 
            error: 'Server error during registration',
            message: error.message
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Server error while fetching user data' });
    }
});

// Debug route to check user data
router.get('/debug-user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log('Looking for user with ID:', userId);
        
        // Try to find user
        const user = await User.findById(userId);
        console.log('User found:', user);
        
        // If not found, try to find by wallet address
        if (!user) {
            const userByWallet = await User.findOne({ walletAddress: '0xcfda358479e68b6afced1745b79ac7bbd2173bd7' });
            console.log('User found by wallet:', userByWallet);
        }
        
        res.json({
            success: true,
            user: user,
            database: {
                name: mongoose.connection.db.databaseName,
                state: mongoose.connection.readyState
            }
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin Login
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // Find admin user
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials or not an admin account" });
        }

        // Compare passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Update last login
        user.lastLogin = Date.now();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress
            }
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

// Create Admin User (should be protected in production)
router.post("/create-admin", async (req, res) => {
    try {
        const { name, email, password, walletAddress, phoneNumber, dateOfBirth, address } = req.body;
        
        console.log('Admin creation request received:', { 
            name, 
            email, 
            hasPassword: !!password, 
            walletAddress,
            dateOfBirth,
            phoneNumber
        });

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }

        // Check if there's an existing admin (optional: allow only one admin)
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(400).json({ error: "Admin user already exists" });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Create admin with all required fields and proper defaults
        const adminData = {
            name,
            email: email.toLowerCase(),
            username: `admin_${email.split('@')[0]}_${Date.now()}`,
            password,
            role: 'admin',
            walletAddress: walletAddress || '0x0000000000000000000000000000000000000000',
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date('1970-01-01'),
            phoneNumber: phoneNumber || '000-000-0000',
            address: address || {
                street: 'Admin Headquarters',
                city: 'Admin City',
                state: 'Admin State',
                country: 'Admin Country',
                postalCode: '00000'
            }
        };

        // Ensure the address object is complete
        if (adminData.address) {
            adminData.address.street = adminData.address.street || 'Admin Headquarters';
            adminData.address.city = adminData.address.city || 'Admin City';
            adminData.address.state = adminData.address.state || 'Admin State';
            adminData.address.country = adminData.address.country || 'Admin Country';
            adminData.address.postalCode = adminData.address.postalCode || '00000';
        }

        // Log the admin data we're trying to save
        console.log('Creating admin with data:', {
            ...adminData,
            password: '[HIDDEN]'
        });

        // Check MongoDB connection
        if (mongoose.connection.readyState !== 1) {
            console.error('MongoDB connection is not ready. Current state:', mongoose.connection.readyState);
            return res.status(500).json({ 
                error: "Database connection error", 
                details: "MongoDB connection is not established"
            });
        }

        // Create and save the admin user
        const admin = new User(adminData);
        await admin.save();

        console.log('Admin user created successfully:', {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        });

        res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("Create admin error:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
            // If it's a Mongoose validation error, include the detailed error information
            validationErrors: error.errors ? 
                Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message,
                    value: error.errors[key].value
                })) : null
        });
        
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.keys(error.errors).map(key => 
                `${key}: ${error.errors[key].message}`
            ).join(', ');
            
            return res.status(400).json({ 
                error: "Validation error", 
                details: validationErrors 
            });
        }
        
        // Handle duplicate key errors
        if ((error.name === 'MongoError' || error.name === 'MongoServerError') && error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: "Duplicate value", 
                field,
                message: `The ${field} is already in use`
            });
        }
        
        res.status(500).json({ 
            error: "Server error", 
            details: error.message 
        });
    }
});

// Check if admin user exists
router.get("/check-admin-exists", async (req, res) => {
    try {
        const adminCount = await User.countDocuments({ role: 'admin' });
        res.json({ adminExists: adminCount > 0 });
    } catch (error) {
        console.error("Check admin error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

module.exports = router;