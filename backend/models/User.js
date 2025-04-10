const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    username: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true
    },
    email: {
        type: String,
        sparse: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    walletAddress: {
        type: String,
        required: [true, 'Wallet address is required'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                // Allow the admin placeholder address format or a valid Ethereum address
                return v === '0x0000000000000000000000000000000000000000' || 
                       /^0x[a-fA-F0-9]{40}$/i.test(v);
            },
            message: props => `${props.value} is not a valid Ethereum address!`
        }
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function(v) {
                return v instanceof Date && !isNaN(v) && v <= new Date();
            },
            message: 'Please provide a valid date of birth in the past'
        }
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                // More lenient phone validation
                return /^[+\d\s-()]+$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true
        },
        postalCode: {
            type: String,
            required: [true, 'Postal code is required'],
            trim: true
        }
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'admin'],
            message: '{VALUE} is not a valid role'
        },
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Create indexes
userSchema.index({ walletAddress: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
    try {
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        // Generate username if not provided
        if (!this.username && this.email) {
            this.username = this.email.split('@')[0];
        }
        next();
    } catch (error) {
        console.error('Pre-save error:', error);
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        throw error;
    }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
