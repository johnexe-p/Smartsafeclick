// backend/src/index.cjs
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Models
const Feedback = require('./models/feedback.cjs');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartsafeclick';
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// --- Scan Schema ---
const scanSchema = new mongoose.Schema({
  url: { type: String, required: true },
  risk: Number,
  verdict: String,
  reason: String,
  feedback: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const Scan = mongoose.model('Scan', scanSchema);

// --- Simple Analyzer (AI Placeholder) ---
function analyzeURL(url) {
  const s = (url || '').toLowerCase();
  if (/login|verify|free|urgent|password|claim|prize/.test(s)) {
    return { risk: 90, verdict: '⚠️ Suspicious link detected', reason: 'Contains phishing keywords' };
  }
  if (/bank|paypal|account|secure/.test(s)) {
    return { risk: 65, verdict: '⚠️ Potentially sensitive', reason: 'Financial or account-related' };
  }
  return { risk: 5, verdict: '✅ This link appears safe', reason: 'No risky patterns found' };
}

// --- API ROUTES ---

// GET /score?url=...
app.get('/score', async (req, res) => {
  try {
    const url = req.query.url || '';
    if (!url) return res.status(400).json({ error: 'Missing url' });

    const result = analyzeURL(url);
    const saved = await Scan.create({
      url,
      risk: result.risk,
      verdict: result.verdict,
      reason: result.reason,
    });

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /feedback — handles new feedback creation
app.post('/feedback', async (req, res) => {
  try {
    const { scanId, name, email, message, rating, category } = req.body;
    if (!scanId || !name || !email || !message)
      return res.status(400).json({ error: 'Missing required fields' });

    const scan = await Scan.findById(scanId);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const feedback = await Feedback.create({
      scanId,
      name,
      email,
      message,
      rating,
      category,
    });

    res.json({ success: true, feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /feedback — list all feedback entries
app.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().populate('scanId').sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /scans — view recent scans
app.get('/scans', async (req, res) => {
  const rows = await Scan.find().sort({ createdAt: -1 }).limit(50);
  res.json(rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
