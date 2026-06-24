/**
 * Google Cloud Vision OCR
 * Sends the card image to Google Vision and returns all detected text.
 */
async function detectCardText(base64Image, mimeType) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY not set in environment.');

  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
        imageContext: { languageHints: ['en'] },
      },
    ],
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Google Vision error: ${err.error?.message || response.status}`);
  }

  const data = await response.json();
  const annotation = data.responses?.[0]?.fullTextAnnotation;
  return annotation?.text || '';
}

module.exports = { detectCardText };
