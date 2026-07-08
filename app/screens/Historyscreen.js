import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    try {
      const data = await AsyncStorage.getItem('scan_history');
      if (data) setHistory(JSON.parse(data));
    } catch (err) {
      console.log('History load error:', err);
    }
  }

  async function clearHistory() {
    Alert.alert('Clear History', 'Are you sure you want to delete all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('scan_history');
          setHistory([]);
        }
      }
    ]);
  }

  async function deleteItem(id) {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    await AsyncStorage.setItem('scan_history', JSON.stringify(updated));
  }

  const fmt = (val) => val != null ? `$${Number(val).toFixed(2)}` : '—';

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptyText}>Cards you scan will appear here</Text>
        <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('Scan')}>
          <Text style={styles.scanButtonText}>📷 Scan a Card</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListHeaderComponent={
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => {
              Alert.alert('Delete', `Remove ${item.cardName} from history?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteItem(item.id) }
              ]);
            }}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.cardImage}
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>{item.cardName}</Text>
              {item.set && (
                <Text style={styles.cardSet} numberOfLines={1}>
                  {item.set}{item.number ? ` #${item.number}` : ''}
                </Text>
              )}
              {item.rarity && (
                <Text style={styles.cardRarity} numberOfLines={1}>{item.rarity}</Text>
              )}
              <View style={styles.priceRow}>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeLabel}>Market</Text>
                  <Text style={styles.priceBadgeValue}>{fmt(item.market)}</Text>
                </View>
                {item.psa10 && (
                  <View style={[styles.priceBadge, styles.priceBadgeGreen]}>
                    <Text style={styles.priceBadgeLabel}>PSA 10</Text>
                    <Text style={[styles.priceBadgeValue, { color: '#3ecf8e' }]}>{fmt(item.psa10)}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDate}>{formatDate(item.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  empty: { flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: '#666', fontSize: 15, marginBottom: 32 },
  scanButton: { backgroundColor: '#6c47ff', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  clearButton: { alignSelf: 'flex-end', marginBottom: 8, padding: 8 },
  clearText: { color: '#555', fontSize: 13 },
  card: {
    backgroundColor: '#1a1a1a', borderRadius: 14, padding: 12,
    flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#2a2a2a',
  },
  cardImage: { width: 70, height: 98, borderRadius: 6, resizeMode: 'cover', backgroundColor: '#222' },
  cardInfo: { flex: 1, justifyContent: 'space-between' },
  cardName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardSet: { color: '#666', fontSize: 12, marginTop: 2 },
  cardRarity: { color: '#555', fontSize: 11, marginTop: 1 },
  priceRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  priceBadge: { backgroundColor: '#222', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8 },
  priceBadgeGreen: { backgroundColor: '#0d1f16' },
  priceBadgeLabel: { color: '#555', fontSize: 10 },
  priceBadgeValue: { color: '#6c47ff', fontSize: 14, fontWeight: '700' },
  cardDate: { color: '#444', fontSize: 11, marginTop: 4 },
});