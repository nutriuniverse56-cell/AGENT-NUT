require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const SYSTEM_PROMPT = require('./src/prompt');
const products = require('./src/products');

const app = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Per-session conversation memory
const sessions = new Map();
const MAX_HISTORY = 20;

// In-memory cart storage: sessionId → [{productId, qty}]
const carts = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Chat ──────────────────────────────────────────────────────────────────────

app.post('/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'Missing sessionId or message' });
  }

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }

  const history = sessions.get(sessionId);

  if (message.trim().toLowerCase() === '/reset') {
    sessions.delete(sessionId);
    return res.json({ reply: 'Conversation reset. Ready for a new creator analysis.' });
  }

  history.push({ role: 'user', content: message });

  const trimmed = history.slice(-MAX_HISTORY);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: trimmed,
    });

    const reply = response.content[0].text;
    history.push({ role: 'assistant', content: reply });

    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    res.json({ reply });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: 'Agent error. Check your ANTHROPIC_API_KEY in .env' });
  }
});

// ── Shop API ──────────────────────────────────────────────────────────────────

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/cart/:sessionId', (req, res) => {
  const cart = carts.get(req.params.sessionId) || [];
  const items = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...product, qty: item.qty, subtotal: +(product.price * item.qty).toFixed(2) };
  });
  const total = +items.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);
  res.json({ items, total });
});

app.post('/api/cart/add', (req, res) => {
  const { sessionId, productId, qty = 1 } = req.body;
  if (!sessionId || !productId) return res.status(400).json({ error: 'Missing sessionId or productId' });

  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  if (!carts.has(sessionId)) carts.set(sessionId, []);
  const cart = carts.get(sessionId);

  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ productId, qty });
  }

  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  res.json({ success: true, cartCount: count });
});

app.post('/api/cart/remove', (req, res) => {
  const { sessionId, productId } = req.body;
  if (!sessionId || !productId) return res.status(400).json({ error: 'Missing sessionId or productId' });

  if (carts.has(sessionId)) {
    const cart = carts.get(sessionId).filter(i => i.productId !== productId);
    carts.set(sessionId, cart);
  }

  const cart = carts.get(sessionId) || [];
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  res.json({ success: true, cartCount: count });
});

app.post('/api/cart/update', (req, res) => {
  const { sessionId, productId, qty } = req.body;
  if (!sessionId || !productId || qty === undefined) return res.status(400).json({ error: 'Missing fields' });

  if (!carts.has(sessionId)) return res.status(404).json({ error: 'Cart not found' });

  const cart = carts.get(sessionId);
  const item = cart.find(i => i.productId === productId);
  if (!item) return res.status(404).json({ error: 'Item not in cart' });

  if (qty <= 0) {
    carts.set(sessionId, cart.filter(i => i.productId !== productId));
  } else {
    item.qty = qty;
  }

  const updated = carts.get(sessionId) || [];
  const count = updated.reduce((sum, i) => sum + i.qty, 0);
  res.json({ success: true, cartCount: count });
});

app.post('/api/order', (req, res) => {
  const { sessionId, name, email, address, city, zip } = req.body;
  if (!sessionId || !name || !email) return res.status(400).json({ error: 'Missing required fields' });

  const cart = carts.get(sessionId) || [];
  if (cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  const orderId = 'NU-' + Date.now().toString(36).toUpperCase();
  carts.delete(sessionId); // clear cart after order

  res.json({ success: true, orderId, message: `Order ${orderId} placed successfully!` });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ NutriUniverse is running!`);
  console.log(`🛍️  Shop:     http://localhost:${PORT}/shop.html`);
  console.log(`💬  Agent:   http://localhost:${PORT}/\n`);
});
