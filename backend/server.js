const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { scanCard } = require('./scanCard');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.raw({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 60*60*1000, max: 60 });
app.use('/scan', limiter);

app.post('/scan', async (req, res) => {
  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided.' });
  try {
    const result = await scanCard(image, mimeType || 'image/jpeg');
    res.json({ ...result, _debug: { set: result.set, cardName: result.cardName } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.listen(process.env.PORT || 3000, () => console.log('CardScan running'));