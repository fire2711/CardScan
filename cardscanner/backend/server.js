const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { scanCard } = require('./scanCard');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limit: 60 requests per hour per IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { error: 'Too many scans. Please wait a while before trying again.' },
});
app.use('/scan', limiter);

app.post('/scan', async (req, res) => {
  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided.' });

  try {
    const result = await scanCard(image, mimeType || 'image/jpeg');
    res.json(result);
  } catch (err) {
    console.error('Scan error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to scan card.' });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`CardScan backend running on port ${PORT}`));
