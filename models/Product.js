const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['MEN', 'WOMEN', 'KIDS'], required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrls: { 
        type: [String], 
        validate: {
            validator: function(v) {
                return v && v.length >= 1 && v.length <= 5;
            },
            message: 'A product must have between 1 to 5 images'
        },
        required: true
    },
    sizesAvailable: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
