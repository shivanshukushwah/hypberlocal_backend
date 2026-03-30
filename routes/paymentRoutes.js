const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

let razorpayInstance = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    } else {
        console.warn("Razorpay keys missing from .env, online payments will fail until configured.");
    }
} catch (e) {
    console.error("Razorpay initialization error", e);
}

// POST: Create a Razorpay Order
router.post('/create-order', auth, async (req, res) => {
    try {
        if (!razorpayInstance) {
            return res.status(500).json({ error: 'Razorpay is not configured on the server. Please check .env' });
        }

        const { amount } = req.body; // Amount in rupees
        
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `rcpt_${req.user.id.substring(0, 10)}_${Date.now()}`
        };

        const razorpayOrder = await razorpayInstance.orders.create(options);
        res.status(200).json(razorpayOrder);
    } catch (err) {
        console.error('Razorpay Create Error:', err);
        res.status(500).json({ error: err.message || 'Failed to initialize payment' });
    }
});

// POST: Verify a Razorpay Payment
router.post('/verify', auth, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, _dbOrderId } = req.body;

        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            // Unsuccessful payment or tampering
            if (_dbOrderId) {
                await Order.findByIdAndUpdate(_dbOrderId, { paymentStatus: 'FAILED' });
            }
            return res.status(400).json({ error: "Transaction not legit!" });
        }

        // Signature is valid
        if (_dbOrderId) {
            await Order.findByIdAndUpdate(_dbOrderId, { 
                paymentStatus: 'PAID',
                razorpayOrderId: razorpayOrderId,
                razorpayPaymentId: razorpayPaymentId 
            });
        }
        res.status(200).json({ message: "Payment Verified successfully", success: true });
    } catch (err) {
        console.error('Verify Payment Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
