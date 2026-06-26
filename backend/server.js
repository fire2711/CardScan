const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.post('/scan', async (req, res) => {
  res.json({ test: 'NEW CODE WORKING', received: !!req.body.image });
});
app.get('/health', (_, res) => res.json({ status: 'ok', version: 2 }));
app.listen(process.env.PORT || 3000, () => console.log('running'));