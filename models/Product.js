const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['MEN', 'WOMEN', 'KIDS'], required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    sizesAvailable: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
