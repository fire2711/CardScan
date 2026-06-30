import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { result, imageUri } = route.params;
  const { cardName, game, prices, graded, cardDetails, source } = result;

  const fmt = (val) =>
    val != null ? `$${Number(val).toFixed(2)}` : '—';

  const gameEmoji = { Pokemon: '⚡', Magic: '🔮', Sports: '🏆' }[game] || '🃏';
  const displayName = cardDetails?.name || cardName;

  const tcgUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(
    `${displayName} ${cardDetails?.set || ''}`.trim()
  )}&view=grid`;
  const pcUrl = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(
    `${displayName} ${cardDetails?.number || ''} pokemon`.trim()
  )}&type=prices`;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Image source={{ uri: imageUri }} style={styles.cardImage} />

      <View style={styles.identity}>
        <Text style={styles.gameTag}>{gameEmoji} {game}</Text>
        <Text style={styles.cardName}>{displayName}</Text>
        {cardDetails?.set ? (
          <Text style={styles.setName}>{cardDetails.set} #{cardDetails.number}</Text>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>RAW CARD PRICES (UNGRADED)</Text>
      <View style={styles.priceGrid}>
        <PriceBox label="Low" value={fmt(prices?.low)} color="#6c47ff" />
        <PriceBox label="Market" value={fmt(prices?.market)} color="#6c47ff" large />
        <PriceBox label="High" value={fmt(prices?.high)} color="#6c47ff" />
      </View>

      {graded && (
        <>
          <Text style={styles.sectionTitle}>GRADED PRICE ESTIMATES</Text>
          <View style={styles.priceGrid}>
            <PriceBox label="PSA 9" value={fmt(graded.psa9)} color="#3ecf8e" />
            <PriceBox label="PSA 10" value={fmt(graded.psa10)} color="#3ecf8e" />
          </View>
          <Text style={styles.disclaimer}>
            * PSA estimates based on typical grading multipliers. Actual prices vary.
          </Text>
        </>
      )}

      {cardDetails && (
        <>
          <Text style={styles.sectionTitle}>CARD DETAILS</Text>
          <View style={styles.detailGrid}>
            <DetailBox label="Rarity" value={cardDetails.rarity} />
            <DetailBox label="Series" value={cardDetails.series} />
            <DetailBox label="Number" value={cardDetails.number} />
            <DetailBox label="Released" value={cardDetails.releaseDate} />
          </View>
        </>
      )}

      {source && <Text style={styles.sourceNote}>{source}</Text>}

      {!prices?.market && (
        <View style={styles.noPriceBox}>
          <Text style={styles.noPriceText}>
            ⚠️ No price data found for this exact print. Try the links below to search manually.
          </Text>
        </View>
      )}

      <View style={styles.linkRow}>
        <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(tcgUrl)}>
          <Text style={styles.linkButtonText}>🔗 TCGPlayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL(pcUrl)}>
          <Text style={styles.linkButtonText}>🔗 PriceCharting</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.scanAgainButton}
        onPress={() => navigation.navigate('Scan')}
        activeOpacity={0.85}
      >
        <Text style={styles.scanAgainText}>📷  Scan Another Card</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}
        activeOpacity={0.85}
      >
        <Text style={styles.homeButtonText}>Go Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PriceBox({ label, value, color, large }) {
  return (
    <View style={[styles.priceBox, large && styles.priceBoxLarge]}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={[styles.priceValue, { color }, large && styles.priceValueLarge]}>
        {value}
      </Text>
    </View>
  );
}

function DetailBox({ label, value }) {
  return (
    <View style={styles.detailBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0f0f0f' },
  container: { paddingHorizontal: 24, paddingVertical: 24, alignItems: 'center' },
  cardImage: { width: 180, height: 250, borderRadius: 12, resizeMode: 'contain', marginBottom: 24 },
  identity: { alignItems: 'center', marginBottom: 20, width: '100%' },
  gameTag: { color: '#888', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardName: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  setName: { color: '#555', fontSize: 14 },
  sectionTitle: {
    color: '#555', fontSize: 11, fontWeight: '700', letterSpacing: 1,
    alignSelf: 'flex-start', marginTop: 16, marginBottom: 8,
  },
  priceGrid: { flexDirection: 'row', gap: 10, width: '100%' },
  priceBox: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
  },
  priceBoxLarge: { borderColor: '#6c47ff', backgroundColor: '#1a1530' },
  priceLabel: { color: '#555', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  priceValue: { fontSize: 18, fontWeight: '700' },
  priceValueLarge: { fontSize: 22 },
  disclaimer: { color: '#444', fontSize: 11, fontStyle: 'italic', alignSelf: 'flex-start', marginTop: 6 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  detailBox: {
    backgroundColor: '#1a1a1a', borderRadius: 10, padding: 10,
    width: '48%', borderWidth: 1, borderColor: '#2a2a2a',
  },
  detailLabel: { color: '#555', fontSize: 11, marginBottom: 2 },
  detailValue: { color: '#ccc', fontSize: 13, fontWeight: '600' },
  sourceNote: { color: '#444', fontSize: 11, marginTop: 16, textAlign: 'center' },
  noPriceBox: {
    backgroundColor: '#1e1200', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#3a2800', marginTop: 16, width: '100%',
  },
  noPriceText: { color: '#a07020', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  linkRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 },
  linkButton: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2a',
  },
  linkButtonText: { color: '#6c47ff', fontSize: 13, fontWeight: '700' },
  scanAgainButton: {
    backgroundColor: '#6c47ff', paddingVertical: 16, borderRadius: 14,
    width: '100%', alignItems: 'center', marginTop: 24, marginBottom: 12,
  },
  scanAgainText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  homeButton: { paddingVertical: 14, width: '100%', alignItems: 'center' },
  homeButtonText: { color: '#555', fontSize: 15 },
});