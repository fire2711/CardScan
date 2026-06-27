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

  const numMatch = set?.startsWith('promo-') 
  ? [null, set.replace('promo-', '')] 
  : set?.match(/^(\d+)/);
const collectorNumber = numMatch ? numMatch[1] : null;

  // Strategy 1: name + number
  if (collectorNumber) {
    const q = encodeURIComponent(`name:${cardName} number:${collectorNumber}`);
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=5`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        const result = buildResult(data.data[0]);
        if (result.prices) return result;
      }
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
      if (match) {
        const result = buildResult(match);
        if (result.prices) return result;
      }
    }
  }

  // Strategy 3: name only, most recent with prices
  const q = encodeURIComponent(`name:${cardName}`);
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20&orderBy=-set.releaseDate`, { headers });
  if (res.ok) {
    const data = await res.json();
    if (data.data?.length > 0) {
      const card = data.data.find(c => {
        const p = c.tcgplayer?.prices;
        return p && Object.keys(p).length > 0;
      }) || data.data[0];
      const result = buildResult(card);
      if (result.prices) return result;
    }
  }

  // Strategy 4: PriceCharting fallback
  console.log('Falling back to PriceCharting for:', cardName);
  return await lookupPriceCharting(cardName, 'pokemon');
}

async function lookupPriceCharting(cardName, category) {
  try {
    const q = encodeURIComponent(cardName);
    const res = await fetch(`https://www.pricecharting.com/api/products?q=${q}&status=in-stock&category=${category}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('PriceCharting error');
    const data = await res.json();
    const product = data.products?.[0];
    if (!product) return { prices: null, graded: null, cardDetails: null, source: 'Price not found' };

    const market = product['cib-price'] ? product['cib-price'] / 100 : null;
    const loose = product['loose-price'] ? product['loose-price'] / 100 : null;
    const graded = product['graded-price'] ? product['graded-price'] / 100 : null;

    const price = market || loose;
    return {
      prices: price ? {
        low: loose || price,
        market: price,
        high: graded || price * 1.5,
      } : null,
      graded: graded ? {
        psa9: Math.round(graded * 0.7 * 100) / 100,
        psa10: graded,
      } : null,
      cardDetails: {
        name: product['product-name'] || cardName,
        rarity: null,
        set: null,
        series: null,
        number: null,
        releaseDate: null,
      },
      source: `PriceCharting · ${product['product-name'] || cardName}`,
    };
  } catch (err) {
    console.error('PriceCharting error:', err.message);
    return { prices: null, graded: null, cardDetails: null, source: 'Price unavailable' };
  }
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
  if (!card) {
    // Fallback to PriceCharting for sports cards
    return await lookupPriceCharting(cardName, game === 'Sports' ? 'baseball' : 'magic-the-gathering');
  }
  return {
    prices: { low: card.prices?.low ?? null, market: card.prices?.market ?? null, high: card.prices?.high ?? null },
    graded: null,
    cardDetails: { name: card.name, rarity: card.rarity || null, set: card.set || null, series: null, number: null, releaseDate: null },
    source: 'tcgapi.dev · TCGPlayer',
  };
}

module.exports = { lookupPrice };