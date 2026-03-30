const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET user's orders (Customer or Shopkeeper)
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'CUSTOMER') query.customerId = req.user.id;
        if (req.user.role === 'SHOPKEEPER') {
            const Shop = require('../models/Shop');
            const shop = await Shop.findOne({ ownerId: req.user.id });
            if (shop) query.shopId = shop._id;
        }
        if (req.user.role === 'DELIVERY') query.deliveryPartnerId = req.user.id;

        const orders = await Order.find(query)
            .populate('customerId', 'name phone')
            .populate('shopId', 'shopName address')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST place a new order (Customer)
router.post('/', auth, async (req, res) => {
    try {
        const { shopId, items, totalAmount, deliveryAddress, paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId } = req.body;
        
        const newOrder = new Order({
            customerId: req.user.id, shopId, items, totalAmount, deliveryAddress, paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId
        });
        
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update order status
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET available orders for Delivery partners
router.get('/delivery/available', auth, async (req, res) => {
    try {
        if (req.user.role !== 'DELIVERY') return res.status(403).json({ message: 'Access denied' });
        
        const orders = await Order.find({ status: 'PLACED', deliveryPartnerId: { $exists: false } })
            .populate('shopId', 'shopName address')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT Assign Delivery Partner
router.put('/:id/assign', auth, async (req, res) => {
    try {
        if (req.user.role !== 'DELIVERY') return res.status(403).json({ message: 'Access denied' });
        const order = await Order.findByIdAndUpdate(req.params.id, { deliveryPartnerId: req.user.id }, { new: true });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
