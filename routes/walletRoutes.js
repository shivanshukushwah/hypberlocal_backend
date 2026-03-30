const express = require('express');
const User = require('../models/User');
const PayoutRequest = require('../models/PayoutRequest');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET: Fetch authenticated user's wallet balance
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        // Also fetch pending withdrawal amount to inform the user
        const pendingRequests = await PayoutRequest.find({ userId: req.user.id, status: 'PENDING' });
        const pendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);

        res.status(200).json({ 
            balance: user.walletBalance || 0,
            pendingWithdrawal: pendingAmount 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Request a withdrawal (transfers walletBalance to PENDING PayoutRequest)
router.post('/withdraw', auth, async (req, res) => {
    try {
        const { amount, bankDetails } = req.body;

        if (amount < 100) {
            return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
        }
        if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountName) {
            return res.status(400).json({ error: 'Incomplete bank details provided' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.walletBalance < amount) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        // Deduct from wallet
        user.walletBalance -= amount;
        await user.save();

        // Create the Payout Request
        const payoutRequest = new PayoutRequest({
            userId: user._id,
            amount: amount,
            bankDetails: {
                accountName: bankDetails.accountName,
                accountNumber: bankDetails.accountNumber,
                ifscCode: bankDetails.ifscCode
            },
            status: 'PENDING'
        });

        await payoutRequest.save();

        res.status(201).json({ message: 'Withdrawal request submitted successfully', request: payoutRequest });
    } catch (err) {
        console.error('Withdrawal error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET: Fetch withdrawal history
router.get('/history', auth, async (req, res) => {
    try {
        const history = await PayoutRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
