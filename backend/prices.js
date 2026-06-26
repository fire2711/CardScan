async function lookupPrice(cardName, game, set) {
  if (!cardName) return { prices: null, graded: null, cardDetails: null, source: null };

  try {
    if (game === 'Pokemon') return await lookupPokemon(cardName, set);
    if (game === 'Magic' || game === 'Sports') return await lookupTcgApi(cardName, game);
    try { return await lookupTcgApi(cardName, game); } catch { return await lookupPokemon(cardName, set); }
  } catch (err) {
    console.error('Price lookup error:', err.message);
    return { prices: null, graded: null, cardDetails: null, source: 'Price unavailable — card not found' };
  }
}

async function lookupPokemon(cardName, set) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.POKEMON_TCG_API_KEY) headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;

  const cleanName = cardName.replace(/e$/i, '').trim();

  // Search by name, get all results sorted by most recent
  const q = encodeURIComponent(`name:${cleanName}`);
  const res = await fetch(
    `https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20&orderBy=-set.releaseDate`,
    { headers }
  );
  if (!res.ok) throw new Error(`Pokémon TCG API error: ${res.status}`);
  const data = await res.json();
  if (!data.data?.length) return { prices: null, graded: null, cardDetails: null, source: 'Card not found' };

  // Pick the first card that actually HAS tcgplayer prices
  const card = data.data.find(c => {
    const p = c.tcgplayer?.prices;
    return p && (p.holofoil || p.normal || p.reverseHolofoil);
  }) || data.data[0];

  return buildResult(card);
}

function buildResult(card) {
  const tcg = card.tcgplayer?.prices;
  const priceData = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || tcg?.['1stEditionHolofoil'] || null;
  const market = priceData?.market || priceData?.mid || null;

  return {
    prices: priceData ? {
      low: priceData.low,
      market,
      high: priceData.high,
    } : null,
    graded: market ? {
      psa9: Math.round(market * 1.5 * 100) / 100,
      psa10: Math.round(market * 3.0 * 100) / 100,
    } : null,
    cardDetails: {
      name: card.name,
      rarity: card.rarity || null,
      set: card.set?.name || null,
      series: card.set?.series || null,
      number: card.number || null,
      releaseDate: card.set?.releaseDate || null,
    },
    source: `pokemontcg.io · ${card.set?.name} #${card.number} · Updated ${card.tcgplayer?.updatedAt || 'recently'}`,
  };
}

async function lookupTcgApi(cardName, game) {
  const apiKey = process.env.TCGAPI_KEY;
  if (!apiKey) throw new Error('TCGAPI_KEY not set in environment.');
  const gameMap = { Magic: 'magic-the-gathering', Sports: 'sports', Unknown: 'magic-the-gathering' };
  const q = encodeURIComponent(cardName);
  const res = await fetch(
    `https://api.tcgapi.dev/v1/cards?name=${q}&game=${gameMap[game] || 'magic-the-gathering'}&limit=5`,
    { headers: { 'x-api-key': apiKey } }
  );
  if (!res.ok) throw new Error(`TCGAPI error: ${res.status}`);
  const data = await res.json();
  const card = data.cards?.[0];
  if (!card) return { prices: null, graded: null, cardDetails: null, source: 'tcgapi.dev — card not found' };
  return {
    prices: { low: card.prices?.low ?? null, market: card.prices?.market ?? null, high: card.prices?.high ?? null },
    graded: null,
    cardDetails: { name: card.name, rarity: card.rarity || null, set: card.set || null, series: null, number: null, releaseDate: null },
    source: 'tcgapi.dev · TCGPlayer',
  };
}

module.exports = { lookupPrice };