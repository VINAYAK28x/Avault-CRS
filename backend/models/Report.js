const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    reportType: {
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
        required: false,
        default: Date.now
    },
    transactionHash: {
        type: String,
        required: false
    },
    evidenceHashes: [{
        type: String
    }],
    evidence: [{
        type: String
    }],
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Submitted', 'Pending', 'Under Investigation', 'Verified', 'Resolved', 'Closed'],
        default: 'Submitted'
    },
    blockchainTxHash: {
        type: String
    },
    blockchainReportId: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    assignedOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    adminComments: [{
        text: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['Submitted', 'Pending', 'Under Investigation', 'Verified', 'Resolved', 'Closed', 'Fake'],
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    blockchainStatusUpdateTxHash: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Report", reportSchema);
