async function lookupPrice(cardName, game, set) {
  if (!cardName) return { prices: null, source: null };

  try {
    if (game === 'Pokemon') {
      return await lookupPokemon(cardName, set);
    } else if (game === 'Magic' || game === 'Sports') {
      return await lookupTcgApi(cardName, game);
    } else {
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

async function lookupPokemon(cardName, set) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.POKEMON_TCG_API_KEY) {
    headers['X-Api-Key'] = process.env.POKEMON_TCG_API_KEY;
  }

  const cleanName = cardName.replace(/e$/i, '').trim();

  const numMatch = set?.match(/(\d+)\/\d+/);
  const collectorNumber = numMatch ? numMatch[1] : null;

  if (collectorNumber) {
    const q = encodeURIComponent(`name:${cleanName} number:${collectorNumber}`);
    const url = `https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=5`;
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        return extractPrices(data.data[0]);
      }
    }
  }

  const q2 = encodeURIComponent(`name:${cleanName}`);
  const url2 = `https://api.pokemontcg.io/v2/cards?q=${q2}&pageSize=10&orderBy=-set.releaseDate`;
  const res2 = await fetch(url2, { headers });
  if (!res2.ok) throw new Error(`Pokémon TCG API error: ${res2.status}`);

  const data2 = await res2.json();
  if (!data2.data || data2.data.length === 0) {
    return { prices: null, source: 'pokemontcg.io — card not found' };
  }

  return extractPrices(data2.data[0]);
}

function extractPrices(card) {
  const tcg = card.tcgplayer?.prices;
  const priceData = tcg?.holofoil || tcg?.normal || tcg?.reverseHolofoil || tcg?.['1stEditionHolofoil'] || null;
  return {
    prices: priceData ? {
      low: priceData.low,
      market: priceData.market || priceData.mid,
      high: priceData.high,
    } : null,
    source: `pokemontcg.io · ${card.set?.name || ''} #${card.number}`,
  };
}

async function lookupTcgApi(cardName, game) {
  const apiKey = process.env.TCGAPI_KEY;
  if (!apiKey) throw new Error('TCGAPI_KEY not set in environment.');

  const gameMap = { Magic: 'magic-the-gathering', Sports: 'sports', Unknown: 'magic-the-gathering' };
  const gameSlug = gameMap[game] || 'magic-the-gathering';
  const q = encodeURIComponent(cardName);
  const url = `https://api.tcgapi.dev/v1/cards?name=${q}&game=${gameSlug}&limit=5`;

  const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
  if (!res.ok) throw new Error(`TCGAPI error: ${res.status}`);

  const data = await res.json();
  const card = data.cards?.[0];
  if (!card) return { prices: null, source: 'tcgapi.dev — card not found' };

  return {
    prices: { low: card.prices?.low ?? null, market: card.prices?.market ?? null, high: card.prices?.high ?? null },
    source: 'tcgapi.dev · TCGPlayer',
  };
}

module.exports = { lookupPrice };