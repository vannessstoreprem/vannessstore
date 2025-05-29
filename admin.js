const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Menambahkan Produk
router.post('/add-product', async (req, res) => {
  try {
    const { name, description, price, image } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      image,
    });

    await newProduct.save();
    res.status(201).json({ message: 'Produk berhasil ditambahkan.' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambahkan produk.' });
  }
});

// Mendapatkan semua produk
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mendapatkan produk.' });
  }
});

module.exports = router;
