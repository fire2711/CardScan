import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

export default function HistoryDetailScreen({ route, navigation }) {
  const { item } = route.params;

  const fmt = (value) =>
    value != null ? `$${Number(value).toFixed(2)}` : '—';

  const formatDate = (timestamp) =>
    new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });

  const tcgUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(
    `${item.cardName} ${item.set || ''}`
  )}&view=grid`;

  const priceChartUrl = `https://www.pricecharting.com/search-products?q=${encodeURIComponent(
    `${item.cardName} ${item.number || ''} pokemon`
  )}&type=prices`;

  async function addToCollection() {
    try {
      const saved = await AsyncStorage.getItem('card_collection');
      const collection = saved ? JSON.parse(saved) : [];

      const exists = collection.some(c =>
        c.cardName === item.cardName &&
        c.set === item.set &&
        c.number === item.number
      );

      if (exists) {
        Alert.alert('Already Added', 'This card is already in your collection.');
        return;
      }

      collection.unshift({
        id: Date.now().toString(),
        imageUri: item.imageUri,
        cardName: item.cardName,
        game: item.game,
        set: item.set,
        number: item.number,
        rarity: item.rarity,
        market: item.market,
        psa10: item.psa10,
        purchasePrice: '',
        condition: '',
        notes: '',
        added: new Date().toISOString(),
      });

      await AsyncStorage.setItem('card_collection', JSON.stringify(collection));
      Alert.alert('Added!', 'Card added to your collection.');
    } catch (err) {
      console.log('Add to collection error:', err);
    }
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

      <Image source={{ uri: item.imageUri }} style={styles.cardImage} />

      <Text style={styles.game}>{item.game || 'Unknown'}</Text>
      <Text style={styles.cardName}>{item.cardName}</Text>

      {item.set && (
        <Text style={styles.set}>
          {item.set}{item.number ? ` #${item.number}` : ''}
        </Text>
      )}

      <Text style={styles.scannedOn}>
        Scanned {formatDate(item.timestamp)}
      </Text>

      <Section title="RAW CARD PRICES" />
      <View style={styles.row}>
        <PriceBox label="Market" value={fmt(item.market)} highlight />
      </View>

      {item.psa10 && (
        <>
          <Section title="GRADED ESTIMATES" />
          <View style={styles.row}>
            <PriceBox label="PSA 9" value={fmt(item.psa9)} green />
            <PriceBox label="PSA 10" value={fmt(item.psa10)} green />
          </View>
          <Text style={styles.disclaimer}>
            Estimated grading values. Actual prices vary based on condition.
          </Text>
        </>
      )}

      {item.rarity && (
        <>
          <Section title="CARD DETAILS" />
          <View style={styles.details}>
            {item.rarity && <Detail label="Rarity" value={item.rarity} />}
            {item.game && <Detail label="Game" value={item.game} />}
            {item.set && <Detail label="Set" value={item.set} />}
            {item.number && <Detail label="Number" value={item.number} />}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={addToCollection}>
        <Text style={styles.primaryText}>⭐ Add To Collection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(tcgUrl)}>
        <Text style={styles.secondaryText}>🔗 Search TCGPlayer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(priceChartUrl)}>
        <Text style={styles.secondaryText}>🔗 Search PriceCharting</Text>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.actionText}>📷 Scan Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.homeButton]}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.actionText}>🏠 Home</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

function Section({ title }) {
  return <Text style={styles.section}>{title}</Text>;
}

function PriceBox({ label, value, highlight, green }) {
  return (
    <View style={[styles.priceBox, highlight && styles.highlight]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.price, green && { color: COLORS.success }]}>{value}</Text>
    </View>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 24, alignItems: 'center' },
  cardImage: { width: 190, height: 265, borderRadius: 14, marginBottom: 20 },
  game: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  cardName: { color: COLORS.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  set: { color: COLORS.textSecondary, marginTop: 6 },
  scannedOn: { color: COLORS.textMuted, fontSize: 12, marginTop: 8 },
  section: {
    alignSelf: 'flex-start', marginTop: 28, marginBottom: 10,
    fontSize: 12, fontWeight: '800', letterSpacing: 1, color: COLORS.textSecondary,
  },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  priceBox: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 15, alignItems: 'center' },
  highlight: { borderWidth: 1, borderColor: COLORS.primary },
  label: { color: COLORS.textSecondary, fontSize: 12 },
  price: { color: COLORS.primaryLight, fontSize: 18, fontWeight: '800', marginTop: 5 },
  details: { width: '100%', gap: 8 },
  detail: { backgroundColor: COLORS.surface, padding: 14, borderRadius: 12 },
  detailValue: { color: COLORS.text, marginTop: 5, fontWeight: '600' },
  disclaimer: { color: COLORS.textSecondary, fontSize: 11, marginTop: 8 },
  primaryButton: {
    backgroundColor: COLORS.primary, width: '100%', padding: 16,
    borderRadius: 16, marginTop: 30, alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: COLORS.surface, width: '100%', padding: 15,
    borderRadius: 14, marginTop: 12, alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryText: { color: COLORS.primaryLight, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 20 },
  actionButton: {
    flex: 1, backgroundColor: COLORS.success, padding: 16,
    borderRadius: 16, alignItems: 'center',
  },
  homeButton: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});