/**
 * Price lookup module
 * Routes to the best price API based on detected game type.
 *
 * APIs used:
 *   - Pokémon: pokemontcg.io (free, no key needed for basic use)
 *   - Magic:   tcgapi.dev (requires TCGAPI_KEY)
 *   - Sports:  tcgapi.dev (requires TCGAPI_KEY)
 *   - Unknown: tries tcgapi.dev first, then pokemontcg.io
 */

async function lookupPrice(cardName, game, set) {
  if (!cardName) return { prices: null, source: null };

  try {
    if (game === 'Pokemon') {
      return await lookupPokemon(cardName, set);
    } else if (game === 'Magic' || game === 'Sports') {
      return await lookupTcgApi(cardName, game);
    } else {
      // Try both, return whichever succeeds first
      try {
        return await lookupTcgApi(cardName, game);
      } catch {
        return await lookupPokemon(cardName, set);
      }
    }
  } catch (err) {
    console.error('Price lookup error:', err.message);
    return { prices: null, source: 'Price unavailable — card not found in database' };
  }
}

/**
 * Pokémon TCG API — free, no key needed for basic requests
 * Docs: https://pokemontcg.io
 */
async function lookupPokemon(cardName, set) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
  }

  // Clean name - strip trailing OCR artifact 'e', keep ex/gx/v suffixes
  let cleanName = cardName
    .replace(/e$/i, '')
    .trim();

  // Extract collector number from set string
  const numMatch = set?.match(/(\d+)\/\d+/);
  const collectorNumber = numMatch ? numMatch[1] : null;

  // If we have a collector number, search by name + number (most precise)
  if (collectorNumber) {
    const query = encodeURIComponent(`name:"${cleanName}*" number:"${collectorNumber}"`);
    const url = `https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=5&select=name,set,number,tcgplayer`;
    
    const response = await fetch(url, { headers });
    if (response.ok) {
      const data = await response.json();
      if (data.data?.length > 0) {
        const card = data.data[0];
        const tcg = card.tcgplayer?.prices;
        const priceData = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || tcg?.['1stEditionHolofoil'] || null;
        return {
          prices: priceData ? { low: priceData.low, market: priceData.market, high: priceData.high } : null,
          source: `pokemontcg.io · ${card.set?.name || ''} #${card.number}`,
        };
      }
    }
  }

  // Fallback: search by name only, pick most recent set
  const query = encodeURIComponent(`name:"${cleanName}*"`);
  const url = `https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=10&orderBy=-set.releaseDate&select=name,set,number,tcgplayer`;
  
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Pokémon TCG API error: ${response.status}`);
  
  const data = await response.json();
  if (!data.data || data.data.length === 0) {
    return { prices: null, source: 'pokemontcg.io — card not found' };
  }

  const card = data.data[0];
  const tcg = card.tcgplayer?.prices;
  const priceData = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || null;

  return {
    prices: priceData ? { low: priceData.low, market: priceData.market, high: priceData.high } : null,
    source: `pokemontcg.io · ${card.set?.name || ''} #${card.number}`,
  };
}

/**
 * TCGAPI.dev — covers Magic, Sports, Yu-Gi-Oh and 85+ games
 * Docs: https://tcgapi.dev
 */
async function lookupTcgApi(cardName, game) {
  const apiKey = process.env.TCGAPI_KEY;
  if (!apiKey) throw new Error('TCGAPI_KEY not set in environment.');

  const gameMap = {
    Magic: 'magic-the-gathering',
    Sports: 'sports',
    Unknown: 'magic-the-gathering',
  };

  const gameSlug = gameMap[game] || 'magic-the-gathering';
  const query = encodeURIComponent(cardName);
  const url = `https://api.tcgapi.dev/v1/cards?name=${query}&game=${gameSlug}&limit=5`;

  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
  });

  if (!response.ok) throw new Error(`TCGAPI error: ${response.status}`);
  const data = await response.json();

  const card = data.cards?.[0];
  if (!card) return { prices: null, source: 'tcgapi.dev — card not found' };

  return {
    prices: {
      low: card.prices?.low ?? null,
      market: card.prices?.market ?? null,
      high: card.prices?.high ?? null,
    },
    source: `tcgapi.dev · TCGPlayer`,
  };
}

module.exports = { lookupPrice };
