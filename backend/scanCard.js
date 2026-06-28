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
  return { cardName, game, set: set || null, prices, graded, cardDetails, source };
}

const EXCLUDED_WORDS = [
  'pokemon', 'pokémon', 'stage', 'basic', 'evolves', 'evolution',
  'ability', 'attack', 'trainer', 'supporter', 'stadium', 'item',
  'discard', 'damage', 'energy', 'retreat', 'weakness', 'resistance',
  'during', 'your turn', 'when your', 'this pokemon', 'opponent',
  'mega-evolved', 'mega evolved', 'form of', 'prize card',
  'knocked out', 'paralyzed', 'confused', 'asleep', 'burned',
  'poisoned', 'switch', 'attach', 'search', 'shuffle', 'draw',
  'flip a coin', 'heads', 'tails', 'benched', 'active',
  'once during', 'may use', 'rule box', 'regulation',
  'illustrated', 'copyright', 'nintendo', 'creatures', 'game freak',
  'special condition', 'ancient trait', 'held item',
];

function isExcludedLine(line) {
  const lower = line.toLowerCase();
  return EXCLUDED_WORDS.some(w => lower.includes(w));
}

const NAME_SUFFIXES = [' ex', ' gx', ' v', ' vmax', ' vstar', ' mega', ' break'];

function cleanPokemonName(name) {
  const lowerName = name.toLowerCase();
  const suffix = NAME_SUFFIXES.find(s => lowerName.endsWith(s));
  if (suffix) return name.trim();

  const naturalEndings = ['le', 're', 'se', 'ne', 've', 'ke', 'ze', 'ce', 'ge', 'me', 'pe', 'be', 'fe'];
  const lower = name.toLowerCase();
  if (!naturalEndings.some(e => lower.endsWith(e))) {
    name = name.replace(/([^aeiou\s])e$/i, '$1');
  }
  return name.trim();
}

function parseCardIdentity(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1);

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
      const trimmed = line.trim();
      if (trimmed.length < 2) continue;
      if (/^[\d\W]+$/.test(trimmed)) continue;
      if (isExcludedLine(trimmed)) continue;
      if (/^\d+$/.test(trimmed)) continue;
      if (/^hp\s*\d+$/i.test(trimmed)) continue;
      if (trimmed.split(/\s+/).length > 5) continue;
      if (!/^[A-ZÀ-Ö]/.test(trimmed)) continue;

      let candidate = trimmed
        .replace(/[^a-zA-Z\s\-éÉàÀ]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (candidate.length < 2) continue;
      candidate = cleanPokemonName(candidate);
      if (candidate.length >= 2) {
        cardName = candidate;
        break;
      }
    }

    // Standard collector number e.g. 199/165
    const setMatch = rawText.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (setMatch) {
      set = `${setMatch[1]}/${setMatch[2]}`;
    } else {
      // Promo patterns — handles GSVP, SVP, G SVP etc
      const promoPatterns = [
        { regex: /G?SVP\s*(?:EN|JP|en|jp)?\s*(\d{2,3})/i, group: 1 },
        { regex: /GSVP\s*(\d{2,3})/i, group: 1 },
        { regex: /\bSWSH\s*(\d{2,3})\b/i, group: 1 },
        { regex: /\bSM\s*(\d{2,3})\b/i, group: 1 },
        { regex: /\bXY\s*(\d{2,3})\b/i, group: 1 },
        { regex: /\bBW\s*(\d{2,3})\b/i, group: 1 },
        { regex: /PR-SV\s*(\d{2,3})/i, group: 1 },
      ];

      for (const { regex, group } of promoPatterns) {
        const match = rawText.match(regex);
        if (match) {
          set = `promo-${match[group]}`;
          break;
        }
      }
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
  return { cardName, game, set: set || null };
}

module.exports = { scanCard };