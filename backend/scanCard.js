const { detectCardText } = require('./ocr');
const { lookupPrice } = require('./prices');

async function scanCard(base64Image, mimeType) {
  const rawText = await detectCardText(base64Image, mimeType);
  if (!rawText || rawText.trim().length < 3) {
    throw new Error('Could not read any text from the card. Try a clearer photo.');
  }
  const { cardName, game, set } = parseCardIdentity(rawText);
  if (!cardName) {
    throw new Error('Could not identify the card name.');
  }
  const { prices, graded, cardDetails, source } = await lookupPrice(cardName, game, set);
  return { cardName, game, set, prices, graded, cardDetails, source };
}

function parseCardIdentity(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1 && !/^[\d\W]+$/.test(l));

  let game = 'Unknown';
  let cardName = null;
  let set = null;
  const fullText = rawText.toLowerCase();

  if (fullText.includes('hp') && (
    fullText.includes('pokémon') || fullText.includes('pokemon') ||
    fullText.includes('trainer') || fullText.includes('energy')
  )) {
    game = 'Pokemon';
  } else if (
    fullText.includes('mana cost') || fullText.includes('legendary') ||
    fullText.includes('creature —') || fullText.includes('instant') ||
    fullText.includes('sorcery') || fullText.includes('enchantment') ||
    fullText.includes('planeswalker')
  ) {
    game = 'Magic';
  } else if (
    fullText.includes('nba') || fullText.includes('nfl') ||
    fullText.includes('mlb') || fullText.includes('nhl') ||
    fullText.includes('rookie')
  ) {
    game = 'Sports';
  }

  if (game === 'Pokemon') {
    for (const line of lines) {
      if (
        /^[A-Z][a-zA-Z\s\-éÉ]+$/.test(line) &&
        line.length > 2 &&
        !line.toLowerCase().includes('pokémon') &&
        !line.toLowerCase().includes('pokemon') &&
        !line.toLowerCase().includes('stage') &&
        !line.toLowerCase().includes('basic') &&
        !line.toLowerCase().includes('evolves')
      ) {
        cardName = line
          .replace(/[^a-zA-Z\s\-éÉ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        // Fix OCR artifact: 'ex' logo merges as letter 'e' at end of name
        // "Charizarde" → "Charizard", but keep "Venusaur", "Articuno" etc
        const keepE = ['tle', 'rtle', 'irl', 'ble', 'gle', 'nce', 'ase', 'ose', 'use', 'ise'];
const lower = cardName.toLowerCase();
if (!keepE.some(e => lower.endsWith(e))) {
  cardName = cardName.replace(/([^aeiou\s])e$/i, '$1');
}
        break;
      }
    }

    // Find collector number like "199/165" anywhere in text
    const setMatch = rawText.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (setMatch) {
      set = `${setMatch[1]}/${setMatch[2]}`;
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

  if (!cardName && lines.length > 0) cardName = lines[0].slice(0, 60);
  return { cardName, game, set };
}

module.exports = { scanCard };