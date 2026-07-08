import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../constants/theme';

export default function HomeScreen({ navigation }) {

  const [recent, setRecent] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);


  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );


  async function loadData() {
    try {

      const historyData = await AsyncStorage.getItem('scan_history');
      const collectionData = await AsyncStorage.getItem('card_collection');


      if (historyData) {

        const history = JSON.parse(historyData);

        setRecent(history.slice(0,3));

      } else {
        setRecent([]);
      }


      if (collectionData) {

        const collection = JSON.parse(collectionData);

        setCollectionCount(collection.length);

        const value = collection.reduce(
          (sum, card) =>
            sum + (Number(card.market) || 0),
          0
        );

        setTotalValue(value);

      } else {

        setCollectionCount(0);
        setTotalValue(0);

      }


    } catch(err) {
      console.log("Home load error:", err);
    }
  }



  return (

    <View style={styles.container}>


      <View style={styles.header}>

        <View>

          <Text style={styles.title}>
            CardScan
          </Text>

          <Text style={styles.subtitle}>
            Scan. Track. Collect.
          </Text>

        </View>

      </View>



      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('Scan')}
      >

        <Text style={styles.scanText}>
          📷 Scan a Card
        </Text>

      </TouchableOpacity>




      <View style={styles.stats}>


        <View style={styles.statCard}>

          <Text style={styles.statNumber}>
            {collectionCount}
          </Text>

          <Text style={styles.statLabel}>
            Collection Cards
          </Text>

        </View>



        <View style={styles.statCard}>

          <Text style={styles.statNumber}>
            ${totalValue.toFixed(2)}
          </Text>

          <Text style={styles.statLabel}>
            Collection Value
          </Text>

        </View>


      </View>





      <View style={styles.actions}>


        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('History')}
        >

          <Text style={styles.secondaryText}>
            📋 History
          </Text>

        </TouchableOpacity>




        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Collection')}
        >

          <Text style={styles.secondaryText}>
            🗂 Collection
          </Text>

        </TouchableOpacity>


      </View>





      <View style={styles.sectionHeader}>

        <Text style={styles.sectionTitle}>
          Recently Scanned
        </Text>


        <TouchableOpacity
          onPress={() => navigation.navigate('History')}
        >

          <Text style={styles.viewAll}>
            View All
          </Text>

        </TouchableOpacity>


      </View>





      {
        recent.length === 0 ? (

          <View style={styles.empty}>

            <Text style={styles.emptyText}>
              No scans yet. Scan your first card!
            </Text>

          </View>

        ) : (

          <FlatList

            horizontal

            showsHorizontalScrollIndicator={false}

            data={recent}

            keyExtractor={(item)=>item.id}


            renderItem={({item})=>(


              <View style={styles.card}>


                <Image
                  source={{uri:item.imageUri}}
                  style={styles.cardImage}
                />


                <Text
                  style={styles.cardName}
                  numberOfLines={1}
                >
                  {item.cardName}
                </Text>


                <Text style={styles.price}>

                  ${Number(item.market || 0).toFixed(2)}

                </Text>


              </View>


            )}

          />

        )
      }



    </View>

  );
}





const styles = StyleSheet.create({

container:{
  flex:1,
  backgroundColor:COLORS.background,
  padding:24,
},


header:{
  marginTop:20,
  marginBottom:35,
},


title:{
  color:COLORS.text,
  fontSize:34,
  fontWeight:'800',
},


subtitle:{
  color:COLORS.textSecondary,
  marginTop:5,
},



scanButton:{
  backgroundColor:COLORS.primary,
  padding:18,
  borderRadius:16,
  alignItems:'center',
},


scanText:{
  color:'#fff',
  fontSize:18,
  fontWeight:'700',
},



stats:{
  flexDirection:'row',
  gap:12,
  marginTop:24,
},



statCard:{
  flex:1,
  backgroundColor:COLORS.surface,
  padding:18,
  borderRadius:16,
},



statNumber:{
  color:'#fff',
  fontSize:22,
  fontWeight:'800',
},


statLabel:{
  color:COLORS.textSecondary,
  marginTop:5,
},



actions:{
  flexDirection:'row',
  gap:12,
  marginTop:20,
},



secondaryButton:{
  flex:1,
  backgroundColor:COLORS.surface,
  padding:15,
  borderRadius:14,
  alignItems:'center',
},


secondaryText:{
  color:COLORS.primaryLight,
  fontWeight:'700',
},




sectionHeader:{
  flexDirection:'row',
  justifyContent:'space-between',
  marginTop:32,
  marginBottom:15,
},


sectionTitle:{
  color:'#fff',
  fontSize:20,
  fontWeight:'700',
},


viewAll:{
  color:COLORS.primaryLight,
},



card:{
  width:120,
  backgroundColor:COLORS.surface,
  padding:10,
  borderRadius:14,
  marginRight:12,
},



cardImage:{
  width:100,
  height:140,
  borderRadius:8,
},



cardName:{
  color:'#fff',
  marginTop:8,
  fontWeight:'600',
},



price:{
  color:COLORS.success,
  marginTop:5,
},



empty:{
  backgroundColor:COLORS.surface,
  padding:20,
  borderRadius:14,
},


emptyText:{
  color:COLORS.textSecondary,
}

});