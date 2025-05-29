const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// "Database" user sederhana
const users = {};

// Model Produk untuk MongoDB
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // URL gambar produk
});
const Product = mongoose.model('Product', productSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware proteksi halaman dashboard
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/login.html');
};

// Rute halaman utama/dashboard, hanya untuk user login
app.get('/', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Rute login page (statik)
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// API untuk info user login
app.get('/user-info', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.json({ username: null });
  }
});

// Handle POST login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) {
    return res.send('Username tidak ditemukan. <a href="/login.html">Kembali</a>');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.send('Password salah. <a href="/login.html">Kembali</a>');
  }
  req.session.user = { username };
  res.redirect('/');
});

// Handle POST register
app.post('/register', async (req, res) => {
  const { username, password, password2 } = req.body;

  if (!username || !password || !password2) {
    return res.send('Mohon isi semua field. <a href="/login.html">Kembali</a>');
  }
  if (password !== password2) {
    return res.send('Password dan konfirmasi tidak sama. <a href="/login.html">Kembali</a>');
  }
  if (users[username]) {
    return res.send('Username sudah terdaftar. <a href="/login.html">Kembali</a>');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users[username] = { username, passwordHash };

  res.send('Registrasi berhasil! <a href="/login.html">Login sekarang</a>');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Webhook Discord kamu
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1377565022519033856/RXrFvem7v7F0WuNsU-ieXuQErKU-sbs7xyh-Mqqyn8t5XWr2XfbnMMVRwcp8orJeLbDs';

// Endpoint webhook untuk menerima data dan kirim ke Discord
app.post('/webhook', async (req, res) => {
  const data = req.body;

  if (!data) {
    return res.status(400).send('Bad request');
  }

  const { order_id, status, amount, user, produk } = data;

  if (!order_id || !status || !amount || !user || !produk) {
    return res.status(400).send('Data tidak lengkap');
  }

  const message = {
    content: `**Notifikasi Pembayaran Saweria**\n` +
             `Order ID: ${order_id}\n` +
             `Produk: ${produk}\n` +
             `Status: ${status}\n` +
             `Jumlah Pembayaran: Rp ${amount.toLocaleString('id-ID')}\n` +
             `User: ${user}`
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, message);
    console.log('Webhook diteruskan ke Discord');
    res.status(200).send('OK');
  } catch (error) {
    console.error('Gagal kirim ke Discord:', error.message);
    res.status(500).send('Error mengirim ke Discord');
  }
});

// Rute Admin: Menambahkan Produk
app.post('/admin/add-product', async (req, res) => {
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

// Rute Admin: Melihat Produk
app.get('/admin/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mendapatkan produk.' });
  }
});

// Menghubungkan ke MongoDB
mongoose.connect('mongodb://localhost:27017/vanness-store', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
