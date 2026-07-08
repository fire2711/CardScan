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

      if (data) {
        setHistory(JSON.parse(data));
      }

    } catch (err) {
      console.log('History load error:', err);
    }
  }



  async function clearHistory() {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all scan history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
    const updated = history.filter(
      item => item.id !== id
    );

    setHistory(updated);

    await AsyncStorage.setItem(
      'scan_history',
      JSON.stringify(updated)
    );
  }



  function formatPrice(value) {
    if (value == null || value === '') {
      return '—';
    }

    return `$${Number(value).toFixed(2)}`;
  }



  function formatDate(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }



  if (history.length === 0) {
    return (
      <View style={styles.empty}>

        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>
            📋
          </Text>
        </View>


        <Text style={styles.emptyTitle}>
          No scans yet
        </Text>


        <Text style={styles.emptyText}>
          Cards you scan will appear here
        </Text>


        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.scanButtonText}>
            Scan a Card
          </Text>
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
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearHistory}
          >
            <Text style={styles.clearText}>
              Clear All
            </Text>
          </TouchableOpacity>
        }



        renderItem={({ item }) => (

          <TouchableOpacity

            style={styles.card}

            onLongPress={() => {

              Alert.alert(
                'Delete Scan',
                `Remove ${item.cardName} from history?`,
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteItem(item.id),
                  },
                ]
              );

            }}

          >

            <Image
              source={{
                uri: item.imageUri,
              }}
              style={styles.cardImage}
            />



            <View style={styles.cardInfo}>


              <Text
                style={styles.cardName}
                numberOfLines={1}
              >
                {item.cardName || 'Unknown Card'}
              </Text>



              {
                item.set && (
                  <Text
                    style={styles.cardSub}
                    numberOfLines={1}
                  >
                    {item.set}
                    {
                      item.number
                        ? ` #${item.number}`
                        : ''
                    }
                  </Text>
                )
              }



              {
                item.rarity && (
                  <Text
                    style={styles.cardSub}
                    numberOfLines={1}
                  >
                    {item.rarity}
                  </Text>
                )
              }



              <View style={styles.priceRow}>


                <View style={styles.priceBadge}>

                  <Text style={styles.priceLabel}>
                    Market
                  </Text>


                  <Text style={styles.marketPrice}>
                    {formatPrice(item.market)}
                  </Text>

                </View>



                {
                  item.psa10 && (

                    <View
                      style={[
                        styles.priceBadge,
                        styles.psaBadge
                      ]}
                    >

                      <Text style={styles.priceLabel}>
                        PSA 10
                      </Text>


                      <Text style={styles.psaPrice}>
                        {formatPrice(item.psa10)}
                      </Text>


                    </View>

                  )
                }


              </View>



              <Text style={styles.date}>
                {formatDate(item.timestamp)}
              </Text>


            </View>


          </TouchableOpacity>

        )}

      />

    </View>
  );
}



const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },


  list: {
    padding: 16,
    gap: 12,
  },


  empty: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },


  emptyIcon: {
    marginBottom: 16,
  },


  emptyIconText: {
    fontSize: 56,
  },


  emptyTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },


  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 28,
    textAlign: 'center',
  },


  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
  },


  scanButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },


  clearButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 4,
  },


  clearText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },


  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
  },


  cardImage: {
    width: 75,
    height: 105,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLight,
  },


  cardInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
  },


  cardName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },


  cardSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },


  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },


  priceBadge: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },


  psaBadge: {
    backgroundColor: '#10251B',
  },


  priceLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },


  marketPrice: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },


  psaPrice: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: '700',
  },


  date: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

});