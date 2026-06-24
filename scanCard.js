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
    .filter(l => l.length > 1 && !/^[\d\W]+$/.test(l)); // remove pure number/symbol lines

  let game = 'Unknown';
  let cardName = null;
  let set = null;

  // Detect game type from keywords in OCR text
  const fullText = rawText.toLowerCase();
  if (fullText.includes('hp') && (fullText.includes('pokémon') || fullText.includes('pokemon') || fullText.includes('trainer') || fullText.includes('energy'))) {
    game = 'Pokemon';
  } else if (fullText.includes('mana cost') || fullText.includes('legendary') || fullText.includes('creature —') || fullText.includes('instant') || fullText.includes('sorcery') || fullText.includes('enchantment') || fullText.includes('planeswalker')) {
    game = 'Magic';
  } else if (fullText.includes('nba') || fullText.includes('nfl') || fullText.includes('mlb') || fullText.includes('nhl') || fullText.includes('rookie')) {
    game = 'Sports';
  }

  // Extract card name based on game type
  if (game === 'Pokemon') {
    // Pokémon card name is always the first prominent line before "HP"
    for (const line of lines) {
      if (/^[A-Z][a-zA-Z\s\-éÉ]+$/.test(line) && line.length > 2 && !line.toLowerCase().includes('pokémon') && !line.toLowerCase().includes('pokemon')) {
        cardName = line;
        break;
      }
    }
    // Extract set code (e.g. "SV01/198" or "025/165")
    const setMatch = rawText.match(/\b([A-Z]{2,4})[\s\-]?(\d{3}\/\d{3}|\d+\/\d+)\b/);
    if (setMatch) set = setMatch[0];

  } else if (game === 'Magic') {
    // Magic card name is typically the first clean title-case line
    for (const line of lines) {
      if (/^[A-Z][a-zA-Z\s\-',]+$/.test(line) && line.length > 2 && line.split(' ').length <= 6) {
        cardName = line;
        break;
      }
    }
    // Set symbol number (e.g. "047/287" or collector number)
    const setMatch = rawText.match(/\b\d{1,4}\/\d{1,4}\b/);
    if (setMatch) set = setMatch[0];

  } else if (game === 'Sports') {
    // Sports card player name is the most prominent text
    // Usually a full name (First Last) in large print
    for (const line of lines) {
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && line.split(' ').length >= 2) {
        cardName = line;
        break;
      }
    }
    // Year often appears as 4-digit number
    const yearMatch = rawText.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) set = yearMatch[0];

  } else {
    // Generic fallback: first clean alphabetic line that looks like a name
    for (const line of lines) {
      if (/^[A-Z][a-zA-Z\s\-']+$/.test(line) && line.length > 3 && line.split(' ').length <= 5) {
        cardName = line;
        break;
      }
    }
  }

  // Fallback: just use the first substantial line
  if (!cardName && lines.length > 0) {
    cardName = lines[0].slice(0, 60);
  }

  return { cardName, game, set };
}

module.exports = { scanCard };
