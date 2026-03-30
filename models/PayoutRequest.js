const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    bankDetails: {
        accountName: { type: String, required: true },
        accountNumber: { type: String, required: true },
        ifscCode: { type: String, required: true }
    },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'REJECTED'], default: 'PENDING' },
    transactionRef: { type: String } // To be filled by Admin artificially or via razorpay manual payout
}, { timestamps: true });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
