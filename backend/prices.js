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

  const isPromo = set?.startsWith('promo-');
  const rawNumber = isPromo ? set.replace('promo-', '') : set?.match(/^(\d+)/)?.[1];
  const collectorNumber = rawNumber ? String(parseInt(rawNumber)) : null; // strips leading zeros: "048" → "48"

  console.log(`Lookup: name="${cardName}" set="${set}" isPromo=${isPromo} number="${collectorNumber}"`);

  // PROMO PATH: search svp set directly first
  if (isPromo && collectorNumber) {
    const promoSets = ['svp', 'swsh35', 'sm35', 'xy35', 'bwp'];
    for (const setId of promoSets) {
      const q = encodeURIComponent(`name:${cardName} set.id:${setId}`);
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20`, { headers });
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.data?.length) continue;
      // Find by number
      const match = data.data.find(c => String(parseInt(c.number)) === collectorNumber);
      if (match) {
        console.log(`Found promo: ${match.name} #${match.number} in ${setId}`);
        return buildResult(match);
      }
    }
    // Fallback: just return first result from svp with that name
    const q = encodeURIComponent(`name:${cardName} set.id:svp`);
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=5`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return buildResult(data.data[0]);
    }
  }

  // STANDARD PATH: name + number
  if (collectorNumber && !isPromo) {
    const q = encodeURIComponent(`name:${cardName} number:${collectorNumber}`);
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=5`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        const result = buildResult(data.data[0]);
        if (result.prices) return result;
      }
    }

    // Number only, match name loosely
    const q2 = encodeURIComponent(`number:${collectorNumber}`);
    const res2 = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q2}&pageSize=20`, { headers });
    if (res2.ok) {
      const data2 = await res2.json();
      const first = cardName.split(' ')[0].toLowerCase();
      const match = data2.data?.find(c => c.name.toLowerCase().includes(first));
      if (match) {
        const result = buildResult(match);
        if (result.prices) return result;
      }
    }
  }

  // NAME ONLY fallback — most recent with prices
  const q = encodeURIComponent(`name:${cardName}`);
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=20&orderBy=-set.releaseDate`, { headers });
  if (res.ok) {
    const data = await res.json();
    if (data.data?.length > 0) {
      const card = data.data.find(c => {
        const p = c.tcgplayer?.prices;
        return p && Object.keys(p).length > 0;
      }) || data.data[0];
      return buildResult(card);
    }
  }

  return { prices: null, graded: null, cardDetails: null, source: 'Card not found' };
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