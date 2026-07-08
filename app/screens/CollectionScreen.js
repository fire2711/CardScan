import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { COLORS } from '../constants/theme';


export default function CollectionScreen({ navigation }) {

  const [cards, setCards] = useState([]);
  const [totalValue, setTotalValue] = useState(0);


  useFocusEffect(
    useCallback(() => {
      loadCollection();
    }, [])
  );


  async function loadCollection() {
    try {

      const data = await AsyncStorage.getItem(
        'card_collection'
      );


      const collection = data
        ? JSON.parse(data)
        : [];


      setCards(collection);


      const value = collection.reduce(
        (sum, card) =>
          sum + (Number(card.market) || 0),
        0
      );


      setTotalValue(value);


    } catch (err) {

      console.log(
        'Collection load error:',
        err
      );

    }
  }



  async function deleteCard(id) {

    Alert.alert(
      'Delete Card',
      'Remove this card from your collection?',
      [
        {
          text:'Cancel',
          style:'cancel'
        },

        {
          text:'Delete',
          style:'destructive',

          onPress: async()=>{

            const updated =
              cards.filter(
                card=>card.id !== id
              );


            await AsyncStorage.setItem(
              'card_collection',
              JSON.stringify(updated)
            );


            setCards(updated);


            const value = updated.reduce(
              (sum, card)=>
                sum + (Number(card.market) || 0),
              0
            );


            setTotalValue(value);

          }
        }
      ]
    );

  }



  function formatPrice(value){

    return `$${Number(value || 0).toFixed(2)}`;

  }




  return (

    <View style={styles.container}>


      <View style={styles.header}>

        <Text style={styles.title}>
          Collection
        </Text>


        <Text style={styles.subtitle}>
          {cards.length} {cards.length === 1 ? 'card' : 'cards'} saved
        </Text>


        <View style={styles.valueCard}>

          <Text style={styles.valueLabel}>
            Total Collection Value
          </Text>


          <Text style={styles.value}>
            {formatPrice(totalValue)}
          </Text>

        </View>

      </View>



      <FlatList

        data={cards}

        keyExtractor={
          item=>item.id
        }


        showsVerticalScrollIndicator={false}


        ListEmptyComponent={

          <View style={styles.empty}>

            <Text style={styles.emptyIcon}>
              📦
            </Text>


            <Text style={styles.emptyTitle}>
              Your collection is empty
            </Text>


            <Text style={styles.emptyText}>
              Add cards from scans to start building your collection.
            </Text>

          </View>

        }



        renderItem={({item})=>(


          <View style={styles.card}>


            <Image

              source={{
                uri:item.imageUri
              }}

              style={styles.image}

            />



            <View style={styles.info}>


              <Text
                style={styles.name}
                numberOfLines={2}
              >
                {item.cardName || 'Unknown Card'}
              </Text>



              {
                item.set &&

                <Text style={styles.set}>
                  {item.set}
                  {item.number ? ` #${item.number}` : ''}
                </Text>

              }



              {
                item.rarity &&

                <Text style={styles.rarity}>
                  {item.rarity}
                </Text>

              }



              <View style={styles.priceRow}>


                <View style={styles.priceBox}>

                  <Text style={styles.priceLabel}>
                    Market
                  </Text>


                  <Text style={styles.price}>
                    {formatPrice(item.market)}
                  </Text>

                </View>



                {
                  item.psa10 > 0 &&

                  <View style={[
                    styles.priceBox,
                    styles.psaBox
                  ]}>

                    <Text style={styles.priceLabel}>
                      PSA 10
                    </Text>


                    <Text style={styles.psa}>
                      {formatPrice(item.psa10)}
                    </Text>

                  </View>

                }


              </View>



              <View style={styles.actions}>


                <TouchableOpacity

                  style={styles.editButton}

                  onPress={() =>
                    navigation.navigate(
                      'EditCard',
                      {
                        card:item
                      }
                    )
                  }

                >

                  <Text style={styles.editText}>
                    Edit
                  </Text>

                </TouchableOpacity>



                <TouchableOpacity

                  style={styles.deleteButton}

                  onPress={() =>
                    deleteCard(item.id)
                  }

                >

                  <Text style={styles.deleteText}>
                    Delete
                  </Text>

                </TouchableOpacity>


              </View>


            </View>


          </View>


        )}

      />


    </View>

  );

}




const styles = StyleSheet.create({

container:{
  flex:1,
  backgroundColor:COLORS.background,
  paddingHorizontal:20
},


header:{
  paddingTop:20,
  marginBottom:18
},


title:{
  color:COLORS.text,
  fontSize:30,
  fontWeight:'800'
},


subtitle:{
  color:COLORS.textSecondary,
  marginTop:5
},


valueCard:{
  backgroundColor:COLORS.surface,
  padding:16,
  borderRadius:16,
  marginTop:16
},


valueLabel:{
  color:COLORS.textSecondary,
  fontSize:13
},


value:{
  color:COLORS.success,
  fontSize:24,
  fontWeight:'800',
  marginTop:4
},


card:{
  backgroundColor:COLORS.surface,
  borderRadius:18,
  padding:12,
  flexDirection:'row',
  marginBottom:14
},


image:{
  width:85,
  height:120,
  borderRadius:10
},


info:{
  flex:1,
  marginLeft:14
},


name:{
  color:COLORS.text,
  fontSize:17,
  fontWeight:'800'
},


set:{
  color:COLORS.textSecondary,
  marginTop:5,
  fontSize:13
},


rarity:{
  color:'#777',
  fontSize:12,
  marginTop:3
},


priceRow:{
  flexDirection:'row',
  marginTop:12,
  gap:8
},


priceBox:{
  backgroundColor:'#202027',
  paddingVertical:7,
  paddingHorizontal:10,
  borderRadius:10
},


psaBox:{
  backgroundColor:'#151c20'
},


priceLabel:{
  color:COLORS.textSecondary,
  fontSize:10
},


price:{
  color:COLORS.success,
  fontWeight:'800'
},


psa:{
  color:COLORS.primaryLight,
  fontWeight:'800'
},


actions:{
  flexDirection:'row',
  marginTop:12,
  gap:8
},


editButton:{
  backgroundColor:'#202027',
  paddingVertical:8,
  paddingHorizontal:16,
  borderRadius:10
},


editText:{
  color:COLORS.primaryLight,
  fontWeight:'700',
  fontSize:12
},


deleteButton:{
  backgroundColor:'#321818',
  paddingVertical:8,
  paddingHorizontal:16,
  borderRadius:10
},


deleteText:{
  color:'#ff6b6b',
  fontWeight:'700',
  fontSize:12
},


empty:{
  alignItems:'center',
  marginTop:100,
  paddingHorizontal:30
},


emptyIcon:{
  fontSize:60
},


emptyTitle:{
  color:COLORS.text,
  fontSize:22,
  fontWeight:'800',
  marginTop:20
},


emptyText:{
  color:COLORS.textSecondary,
  textAlign:'center',
  marginTop:10
}

});