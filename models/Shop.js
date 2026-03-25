const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopName: { type: String, required: true },
    description: { type: String },
    location: {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: { type: [Number], default: [77.2090, 28.6139] } // [longitude, latitude]
    },
    address: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

shopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shop', shopSchema);
