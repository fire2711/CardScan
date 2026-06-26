import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { result, imageUri } = route.params;
  const { cardName, game, set, prices, source } = result;

  const fmt = (val) =>
    val != null ? `$${Number(val).toFixed(2)}` : '—';

  const gameEmoji = { Pokemon: '⚡', Magic: '🔮', Sports: '🏆' }[game] || '🃏';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Card image */}
      <Image source={{ uri: imageUri }} style={styles.cardImage} />

      {/* Card identity */}
      <View style={styles.identity}>
        <Text style={styles.gameTag}>{gameEmoji} {game}</Text>
        <Text style={styles.cardName}>{cardName}</Text>
        {set ? <Text style={styles.setName}>{set}</Text> : null}
      </View>

      {/* Price cards */}
      <View style={styles.priceGrid}>
        <PriceBox label="Low" value={fmt(prices?.low)} color="#3ecf8e" />
        <PriceBox label="Market" value={fmt(prices?.market)} color="#6c47ff" large />
        <PriceBox label="High" value={fmt(prices?.high)} color="#f0a500" />
      </View>

      {/* Source note */}
      {source && (
        <Text style={styles.sourceNote}>
          📊 Prices from {source} · Updated daily
        </Text>
      )}

      {/* No prices fallback */}
      {!prices?.market && (
        <View style={styles.noPriceBox}>
          <Text style={styles.noPriceText}>
            ⚠️ No price data found for this card. Try retaking the photo with better lighting so the card name is fully visible.
          </Text>
        </View>
      )}

      {/* Actions */}
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

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0f0f0f' },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  cardImage: {
    width: 180,
    height: 250,
    borderRadius: 12,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  identity: { alignItems: 'center', marginBottom: 28, width: '100%' },
  gameTag: { color: '#888', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  cardName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  setName: { color: '#555', fontSize: 14 },
  priceGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  priceBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  priceBoxLarge: {
    borderColor: '#6c47ff',
    backgroundColor: '#1a1530',
  },
  priceLabel: { color: '#555', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  priceValue: { fontSize: 18, fontWeight: '700' },
  priceValueLarge: { fontSize: 22 },
  sourceNote: {
    color: '#444',
    fontSize: 12,
    marginBottom: 32,
  },
  noPriceBox: {
    backgroundColor: '#1e1200',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a2800',
    marginBottom: 24,
    width: '100%',
  },
  noPriceText: {
    color: '#a07020',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#6c47ff',
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanAgainText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  homeButton: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  homeButtonText: { color: '#555', fontSize: 15 },
});
