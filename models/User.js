const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    supabaseId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
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
    walletBalance: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.index({ email: 1, role: 1 }, { unique: true });
userSchema.index({ phone: 1, role: 1 }, { unique: true });
userSchema.index({ location: '2dsphere' });

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
