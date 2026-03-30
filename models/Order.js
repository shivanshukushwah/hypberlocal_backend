const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['PLACED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'], default: 'PLACED' },
    paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    deliveryAddress: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
