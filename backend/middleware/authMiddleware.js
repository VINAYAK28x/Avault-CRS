const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

const authMiddleware = async (req, res, next) => {
    console.log('=== Auth Middleware ===');
    console.log('Headers:', req.headers);
    
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        // Extract token from Bearer format
        const token = authHeader.replace("Bearer ", "");
        console.log('Token found:', token.substring(0, 20) + '...');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        // Get userId from either field
        const userId = decoded.userId || decoded.id;
        if (!userId) {
            console.error('No user ID found in token');
            return res.status(401).json({ error: 'Invalid token format' });
        }

        // Convert string ID to MongoDB ObjectId
        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
            console.log('Converted userId to ObjectId:', userObjectId);
        } catch (error) {
            console.error('Invalid userId format:', userId);
            return res.status(401).json({ error: 'Invalid user ID format' });
        }

        // Find user in database using userId from token
        const user = await User.findById(userObjectId);
        if (!user) {
            console.log('User not found in database for userId:', userObjectId);
            return res.status(401).json({ error: 'User not found' });
        }

        // Verify wallet address matches (if present in token)
        if (decoded.walletAddress && user.walletAddress.toLowerCase() !== decoded.walletAddress.toLowerCase()) {
            console.log('Wallet address mismatch:', {
                tokenWallet: decoded.walletAddress,
                userWallet: user.walletAddress
            });
            return res.status(401).json({ error: 'Invalid wallet address' });
        }

        console.log('User authenticated successfully:', {
            id: user._id,
            walletAddress: user.walletAddress,
            name: user.name
        });

        // Add user and wallet address to request
        req.user = user;
        req.walletAddress = user.walletAddress;
        next();
    } catch (error) {
        console.error('Authentication error:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }

        res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = authMiddleware;
