const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    supabaseId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String }, // No longer strictly needed
    phone: { type: String },
    role: { type: String, enum: ['CUSTOMER', 'SHOPKEEPER', 'DELIVERY', 'ADMIN'], default: 'CUSTOMER' },
    location: {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: { type: [Number], default: [77.2090, 28.6139] }
    },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    otp: { type: String },
    otpExpires: { type: Date },
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
