const { detectCardText } = require('./ocr');
const { lookupPrice } = require('./prices');

/**
 * Main scan pipeline:
 * 1. Run Google Vision OCR on the card image
 * 2. Parse out card name, set, and game type from the text
 * 3. Look up live market price
 */
async function scanCard(base64Image, mimeType) {
  // Step 1: OCR
  const rawText = await detectCardText(base64Image, mimeType);
  console.log('RAW OCR TEXT:', rawText);
  if (!rawText || rawText.trim().length < 3) {
    throw new Error('Could not read any text from the card. Try a clearer photo.');
  }

  // Step 2: Parse card identity from OCR text
  const { cardName, game, set } = parseCardIdentity(rawText);
  if (!cardName) {
    throw new Error('Could not identify the card name. Make sure the card name is clearly visible.');
  }

  // Step 3: Price lookup
  const { prices, source } = await lookupPrice(cardName, game, set);

  return { cardName, game, set, prices, source };
}

/**
 * Parse OCR text to extract card name, game type, and set info.
 * Trading cards have consistent layouts:
 *   - Pokémon: Name is the largest text, often has HP value nearby
 *   - Magic: Card name is first line, then type line below
 *   - Sports: Player name is prominent, team/year visible
 */
function parseCardIdentity(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1 && !/^[\d\W]+$/.test(l));

  let game = 'Unknown';
  let cardName = null;
  let set = null;

  const fullText = rawText.toLowerCase();
  if (fullText.includes('hp') && (fullText.includes('pokémon') || fullText.includes('pokemon') || fullText.includes('trainer') || fullText.includes('energy'))) {
    game = 'Pokemon';
  } else if (fullText.includes('mana cost') || fullText.includes('legendary') || fullText.includes('creature —') || fullText.includes('instant') || fullText.includes('sorcery') || fullText.includes('enchantment') || fullText.includes('planeswalker')) {
    game = 'Magic';
  } else if (fullText.includes('nba') || fullText.includes('nfl') || fullText.includes('mlb') || fullText.includes('nhl') || fullText.includes('rookie')) {
    game = 'Sports';
  }

  if (game === 'Pokemon') {
    for (const line of lines) {
      if (/^[A-Z][a-zA-Z\s\-éÉ]+$/.test(line) && line.length > 2 && !line.toLowerCase().includes('pokémon') && !line.toLowerCase().includes('pokemon')) {
        // Clean up common OCR errors on Pokemon names
        cardName = line
  .replace(/[^a-zA-Z\s\-éÉ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();
// Remove trailing OCR artifacts like 'e', 'ex', 'gx', 'v', 'vmax' that got merged
cardName = cardName.replace(/\s+(ex|gx|vmax|vstar|v)$/i, ' $1').trim();
// Fix common single-letter OCR suffix errors (e.g. "Charizarde" → "Charizard")
cardName = cardName.replace(/([a-z])e$/, (match, p1) => {
  const knownSuffixes = ['e', 'le', 'se', 're', 'ne', 'te', 've'];
  return knownSuffixes.some(s => match.endsWith(s)) ? match : p1;
});
        break;
      }
    }
    // Only use set numbers that make sense (e.g. 025/165, not 199/165)
    const setMatch = rawText.match(/\b(\d{1,3})\/(\d{3})\b/);
    if (setMatch && parseInt(setMatch[1]) <= parseInt(setMatch[2])) {
      set = setMatch[0];
    }

  } else if (game === 'Magic') {
    for (const line of lines) {
      if (/^[A-Z][a-zA-Z\s\-',]+$/.test(line) && line.length > 2 && line.split(' ').length <= 6) {
        cardName = line;
        break;
      }
    }
    const setMatch = rawText.match(/\b\d{1,4}\/\d{1,4}\b/);
    if (setMatch) set = setMatch[0];

  } else if (game === 'Sports') {
    for (const line of lines) {
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && line.split(' ').length >= 2) {
        cardName = line;
        break;
      }
    }
    const yearMatch = rawText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) set = yearMatch[0];

  } else {
    for (const line of lines) {
      if (/^[A-Z][a-zA-Z\s\-']+$/.test(line) && line.length > 3 && line.split(' ').length <= 5) {
        cardName = line;
        break;
      }
    }
  }

  if (!cardName && lines.length > 0) {
    cardName = lines[0].slice(0, 60);
  }

  return { cardName, game, set };
}

module.exports = { scanCard };
