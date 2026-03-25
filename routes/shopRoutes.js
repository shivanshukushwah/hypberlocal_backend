const express = require('express');
const Shop = require('../models/Shop');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET nearby shops (Customer)
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, maxDistance = 5000 } = req.query; // 5km default
        if (!lat || !lng) return res.status(400).json({ message: 'Latitude and longitude required' });

        const shops = await Shop.find({
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(maxDistance)
                }
            },
            status: 'APPROVED' // Only show approved shops
        });
        res.json(shops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST register a new shop (Shopkeeper)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'SHOPKEEPER') return res.status(403).json({ message: 'Access denied. Must be a SHOPKEEPER.' });
        
        const { shopName, description, address, latitude, longitude } = req.body;
        
        const newShop = new Shop({
            ownerId: req.user.id,
            shopName,
            description,
            address,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            status: 'APPROVED' // Auto-approve for MVP testing
        });
        
        await newShop.save();
        res.status(201).json(newShop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET My Shop
router.get('/my-shop', auth, async (req, res) => {
    try {
        const shop = await Shop.findOne({ ownerId: req.user.id });
        if (!shop) return res.status(404).json({ message: 'Shop not found' });
        res.json(shop);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
