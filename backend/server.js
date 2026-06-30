const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { scanCard } = require('./scanCard');

const app = express();

app.set('trust proxy', 1);
app.use(cors());

// IMPORTANT: only JSON needed
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
});

app.use('/scan', limiter);

app.post('/scan', async (req, res) => {
  try {
    console.log('Incoming request');

    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const result = await scanCard(image, mimeType || 'image/jpeg');

    res.json(result);
  } catch (err) {
    console.error('SCAN ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 3000, () =>
  console.log('CardScan running')
);