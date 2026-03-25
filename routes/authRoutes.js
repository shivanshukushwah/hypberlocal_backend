const express = require('express');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Configure SendGrid (Make sure these are in .env)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST: Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Find or create user to store OTP
        let user = await User.findOne({ email });
        if (!user) {
            // For registration flow, we create a partial user record
            user = new User({ email, name: 'Pending' }); 
        }
        
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        // Send Email via SendGrid
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: 'Your HyperLocal Verification Code',
            text: `Your verification code is ${otp}. It expires in 10 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #0d9488;">HyperLocal Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="background: #f0fdfa; padding: 10px; text-align: center; letter-spacing: 5px; color: #0f172a; border-radius: 8px;">${otp}</h1>
                    <p style="color: #64748b; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                   </div>`,
        };

        await sgMail.send(msg);
        res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (err) {
        console.error('SendGrid Error:', err.response?.body || err.message);
        res.status(500).json({ error: 'Failed to send OTP. Please check server logs.' });
    }
});

// POST: Verify OTP & Login/Register
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp, registrationData } = req.body;
        
        const user = await User.findOne({ email });
        if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;

        // If it's a new registration, update user details
        if (registrationData) {
            user.name = registrationData.name || user.name;
            user.phone = registrationData.phone || user.phone;
            user.role = registrationData.role || 'CUSTOMER';
            user.address = registrationData.address || user.address;
            user.country = registrationData.country || user.country;
            user.state = registrationData.state || user.state;
            
            if (registrationData.latitude && registrationData.longitude) {
                user.location = {
                    type: 'Point',
                    coordinates: [parseFloat(registrationData.longitude), parseFloat(registrationData.latitude)]
                };
            }
        }

        await user.save();

        // Generate local JWT
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'your_default_jwt_secret',
            { expiresIn: '7d' }
        );

        res.status(200).json({ 
            token, 
            user: { id: user._id, name: user.name, role: user.role, email: user.email } 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Profile (Protected)
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Sync/Update Profile (Protected)
router.post('/sync-profile', auth, async (req, res) => {
    try {
        const { name, phone, role, address, country, state, latitude, longitude } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = name || user.name;
        user.phone = phone || user.phone;
        user.role = role || user.role;
        user.address = address || user.address;
        user.country = country || user.country;
        user.state = state || user.state;

        if (latitude && longitude) {
            user.location = {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            };
        }

        await user.save();
        res.status(200).json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
