async function lookupPrice(cardName, game, set) {
  if (!cardName) return { prices: null, graded: null, cardDetails: null, source: null };
  try {
    if (game === 'Pokemon') return await lookupPokemon(cardName, set);
    if (game === 'Magic' || game === 'Sports') return await lookupTcgApi(cardName, game);
    try { return await lookupTcgApi(cardName, game); } catch { return await lookupPokemon(cardName, set); }
  } catch (err) {
    console.error('Price lookup error:', err.message);
    return { prices: null, graded: null, cardDetails: null, source: 'Price unavailable' };
  }
}

async function lookupPokemon(cardName, set) {
  const headers = {};
  if (process.env.POKEMON_TCG_API_KEY) headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;

  const numMatch = set?.match(/^(\d+)/);
  const collectorNumber = numMatch ? numMatch[1] : null;

  // Strategy 1: name + number
  if (collectorNumber) {
    const q = encodeURIComponent(`name:${cardName} number:${collectorNumber}`);
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=5`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return buildResult(data.data[0]);
    }
  }

  // Strategy 2: number only, match name loosely
  if (collectorNumber) {
    const q = encodeURIComponent(`number:${collectorNumber}`);
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20`, { headers });
    if (res.ok) {
      const data = await res.json();
      const first = cardName.split(' ')[0].toLowerCase();
      const match = data.data?.find(c => c.name.toLowerCase().includes(first));
      if (match) return buildResult(match);
    }
  }

  // Strategy 3: name only, most recent with prices
  const q = encodeURIComponent(`name:${cardName}`);
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20&orderBy=-set.releaseDate`, { headers });
  if (!res.ok) throw new Error(`Pokémon TCG API error: ${res.status}`);
  const data = await res.json();
  if (!data.data?.length) return { prices: null, graded: null, cardDetails: null, source: 'Card not found' };

  const card = data.data.find(c => {
    const p = c.tcgplayer?.prices;
    return p && Object.keys(p).length > 0;
  }) || data.data[0];

  return buildResult(card);
}

function buildResult(card) {
  const tcg = card.tcgplayer?.prices;
  const priceData = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || tcg?.['1stEditionHolofoil'] || null;
  const market = priceData?.market || priceData?.mid || null;
  return {
    prices: priceData ? { low: priceData.low, market, high: priceData.high } : null,
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
  if (!apiKey) throw new Error('TCGAPI_KEY not set.');
  const gameMap = { Magic: 'magic-the-gathering', Sports: 'sports', Unknown: 'magic-the-gathering' };
  const q = encodeURIComponent(cardName);
  const res = await fetch(
    `https://api.tcgapi.dev/v1/cards?name=${q}&game=${gameMap[game] || 'magic-the-gathering'}&limit=5`,
    { headers: { 'x-api-key': apiKey } }
  );
  if (!res.ok) throw new Error(`TCGAPI error: ${res.status}`);
  const data = await res.json();
  const card = data.cards?.[0];
  if (!card) return { prices: null, graded: null, cardDetails: null, source: 'Card not found' };
  return {
    prices: { low: card.prices?.low ?? null, market: card.prices?.market ?? null, high: card.prices?.high ?? null },
    graded: null,
    cardDetails: { name: card.name, rarity: card.rarity || null, set: card.set || null, series: null, number: null, releaseDate: null },
    source: 'tcgapi.dev · TCGPlayer',
  };
}

module.exports = { lookupPrice };