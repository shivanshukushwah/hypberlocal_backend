const express = require('express');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// GET all products by shopId
router.get('/', async (req, res) => {
    try {
        const { shopId, category } = req.query;
        let query = {};
        if (shopId) query.shopId = shopId;
        if (category) query.category = category;

        const products = await Product.find(query);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single product details
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('shopId', 'shopName address');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST add a product (Shopkeeper)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'SHOPKEEPER') return res.status(403).json({ message: 'Access denied' });
        
        const shop = await Shop.findOne({ ownerId: req.user.id });
        if (!shop) return res.status(404).json({ message: 'Shop not found for this user' });

        const { name, category, description, price, imageUrl, sizesAvailable } = req.body;
        
        const newProduct = new Product({
            shopId: shop._id, name, category, description, price, imageUrl, sizesAvailable
        });
        
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
