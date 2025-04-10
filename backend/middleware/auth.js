const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware checking authorization...');
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            console.log('No Authorization header found');
            return res.status(401).json({ error: 'Authentication required - No token provided' });
        }
        
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.replace('Bearer ', '')
            : authHeader;
        
        if (!token) {
            console.log('Token is empty after Bearer prefix removal');
            return res.status(401).json({ error: 'Authentication required - Invalid token format' });
        }

        try {
            // Attempt to verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token verified, user ID:', decoded.userId);
            
            // Look up the user in the database
            const user = await User.findOne({ _id: decoded.userId });

            if (!user) {
                console.log('User not found in database for ID:', decoded.userId);
                return res.status(401).json({ error: 'User not found or no longer active' });
            }

            // Add user and token to request object
            req.user = user;
            req.token = token;
            console.log('Authentication successful for user:', user.username || user.email || user._id);
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);
            return res.status(401).json({ 
                error: 'Please authenticate', 
                details: jwtError.message === 'jwt expired' ? 'Token expired' : 'Invalid token' 
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication failed due to server error' });
    }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        console.log('Checking admin privileges for user:', req.user._id);
        if (req.user.role !== 'admin') {
            console.log('Access denied - user is not admin, role:', req.user.role);
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        console.log('Admin access granted');
        next();
    } catch (error) {
        console.error('Admin check error:', error);
        res.status(500).json({ error: 'Server error during admin check' });
    }
};

module.exports = {
    auth,
    isAdmin
}; 