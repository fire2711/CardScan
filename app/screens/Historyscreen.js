import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

const HISTORY_LIMIT = 100;

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
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('scan_history');
            setHistory([]);
          },
        },
      ]
    );
  }

  async function deleteItem(id) {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    await AsyncStorage.setItem('scan_history', JSON.stringify(updated));
  }

  async function addToCollection(item) {
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
        psa9: item.psa9,
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

  function formatPrice(value) {
    if (value == null || value === '') return '—';
    return `$${Number(value).toFixed(2)}`;
  }

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIconText}>📋</Text>
        <Text style={styles.emptyTitle}>No scans yet</Text>
        <Text style={styles.emptyText}>Cards you scan will appear here</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.scanButtonText}>Scan a Card</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.countText}>{history.length} scans</Text>
            <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('HistoryDetail', { item })}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.imageUri }} style={styles.cardImage} />

            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.cardName || 'Unknown Card'}
              </Text>

              {item.set && (
                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.set}{item.number ? ` #${item.number}` : ''}
                </Text>
              )}

              {item.rarity && (
                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.rarity}
                </Text>
              )}

              <View style={styles.priceRow}>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceLabel}>Market</Text>
                  <Text style={styles.marketPrice}>{formatPrice(item.market)}</Text>
                </View>
                {item.psa10 && (
                  <View style={[styles.priceBadge, styles.psaBadge]}>
                    <Text style={styles.priceLabel}>PSA 10</Text>
                    <Text style={styles.psaPrice}>{formatPrice(item.psa10)}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.date}>{formatDate(item.timestamp)}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    addToCollection(item);
                  }}
                >
                  <Text style={styles.addText}>⭐ Add</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Delete Scan',
                      `Remove ${item.cardName} from history?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteItem(item.id),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, gap: 12 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  countText: { color: COLORS.textSecondary, fontSize: 13 },
  clearButton: { padding: 8 },
  clearText: { color: COLORS.textSecondary, fontSize: 13 },
  empty: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  emptyIconText: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { color: COLORS.text, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  emptyText: {
    color: COLORS.textSecondary, fontSize: 15,
    marginBottom: 28, textAlign: 'center',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14,
  },
  scanButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 12,
    flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border,
  },
  cardImage: {
    width: 75, height: 105, borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },
  cardInfo: { flex: 1, marginLeft: 14 },
  cardName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  cardSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  priceRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  priceBadge: {
    backgroundColor: COLORS.surfaceLight, borderRadius: 8,
    paddingVertical: 5, paddingHorizontal: 8,
  },
  psaBadge: { backgroundColor: '#10251B' },
  priceLabel: { color: COLORS.textSecondary, fontSize: 10 },
  marketPrice: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '700' },
  psaPrice: { color: COLORS.success, fontSize: 14, fontWeight: '700' },
  date: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  addButton: {
    backgroundColor: '#1a1a2e', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
  },
  addText: { color: COLORS.primaryLight, fontWeight: '700', fontSize: 12 },
  deleteButton: {
    backgroundColor: '#321818', paddingVertical: 8,
    paddingHorizontal: 14, borderRadius: 10,
  },
  deleteText: { color: '#ff6b6b', fontWeight: '700', fontSize: 12 },
});