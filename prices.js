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
  const cleanName = cardName.replace(/e$/i, '').trim(); // strip trailing 'e' OCR artifact
const query = encodeURIComponent(`name:"${cleanName}*"`);
  const url = `https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=5&select=name,set,tcgplayer`;

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Pokémon TCG API error: ${response.status}`);

  const data = await response.json();
  if (!data.data || data.data.length === 0) {
    return { prices: null, source: 'pokemontcg.io — card not found' };
  }

  // Try to match set if we have it, otherwise use first result
  let card = data.data[0];
  if (set) {
    const match = data.data.find(c => c.set?.ptcgoCode === set || c.set?.name?.toLowerCase().includes(set.toLowerCase()));
    if (match) card = match;
  }

  const tcg = card.tcgplayer?.prices;
  const priceData = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || tcg?.['1stEditionHolofoil'] || null;

  return {
    prices: priceData
      ? { low: priceData.low, market: priceData.market, high: priceData.high }
      : null,
    source: `pokemontcg.io · ${card.set?.name || ''}`,
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
