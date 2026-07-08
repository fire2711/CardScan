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


export default function ResultScreen({ route, navigation }) {

  const { result, imageUri } = route.params;

  const {
    cardName,
    game,
    prices,
    graded,
    cardDetails,
    source,
  } = result;


  const displayName =
    cardDetails?.name || cardName;



  const fmt = (value) => {
    return value != null
      ? `$${Number(value).toFixed(2)}`
      : '—';
  };

  const tcgUrl =
    `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(
      `${displayName} ${cardDetails?.set || ''}`
    )}&view=grid`;

  const priceChartUrl =
    `https://www.pricecharting.com/search-products?q=${encodeURIComponent(
      `${displayName} ${cardDetails?.number || ''} pokemon`
    )}&type=prices`;

  async function addToCollection() {

    try {

      const saved =
        await AsyncStorage.getItem(
          'card_collection'
        );


      const collection =
        saved
          ? JSON.parse(saved)
          : [];

      const exists =
        collection.some(card =>
          card.cardName === displayName &&
          card.set === cardDetails?.set &&
          card.number === cardDetails?.number
        );

      if (exists) {

        Alert.alert(
          'Already Added',
          'This card is already in your collection.'
        );

        return;
      }

      const card = {

        id: Date.now().toString(),

        imageUri,

        cardName: displayName,

        game,

        set: cardDetails?.set,

        number: cardDetails?.number,

        rarity: cardDetails?.rarity,

        series: cardDetails?.series,

        releaseDate: cardDetails?.releaseDate,


        low: prices?.low,

        market: prices?.market,

        high: prices?.high,


        psa9: graded?.psa9,

        psa10: graded?.psa10,


        purchasePrice: '',

        condition: '',

        notes: '',


        added:
          new Date().toISOString(),

      };



      collection.unshift(card);



      await AsyncStorage.setItem(
        'card_collection',
        JSON.stringify(collection)
      );

      Alert.alert(
        'Added!',
        'Card added to your collection.'
      );


    } catch (err) {

      console.log(
        'Collection save error:',
        err
      );

    }

  }

  return (

    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >


      <Image
        source={{ uri: imageUri }}
        style={styles.cardImage}
      />



      <Text style={styles.game}>
        {game || 'Unknown'}
      </Text>



      <Text style={styles.cardName}>
        {displayName}
      </Text>



      {
        cardDetails?.set &&

        <Text style={styles.set}>
          {cardDetails.set}
          {cardDetails.number &&
            ` #${cardDetails.number}`
          }
        </Text>
      }

      <Section title="RAW CARD PRICES" />


      <View style={styles.row}>

        <PriceBox
          label="Low"
          value={fmt(prices?.low)}
        />

        <PriceBox
          label="Market"
          value={fmt(prices?.market)}
          highlight
        />

        <PriceBox
          label="High"
          value={fmt(prices?.high)}
        />

      </View>

      {
        graded &&

        <>

        <Section title="GRADED ESTIMATES" />


        <View style={styles.row}>

          <PriceBox
            label="PSA 9"
            value={fmt(graded.psa9)}
            green
          />


          <PriceBox
            label="PSA 10"
            value={fmt(graded.psa10)}
            green
          />

        </View>


        <Text style={styles.disclaimer}>
          Estimated grading values. Actual prices vary based on condition.
        </Text>


        </>
      }

      <Section title="CARD DETAILS" />


      <View style={styles.details}>


        <Detail
          label="Rarity"
          value={cardDetails?.rarity}
        />


        <Detail
          label="Series"
          value={cardDetails?.series}
        />


        <Detail
          label="Number"
          value={cardDetails?.number}
        />


        <Detail
          label="Released"
          value={cardDetails?.releaseDate}
        />


      </View>

      {
        source &&

        <Text style={styles.source}>
          {source}
        </Text>

      }

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={addToCollection}
      >

        <Text style={styles.primaryText}>
          ⭐ Add To Collection
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          Linking.openURL(tcgUrl)
        }
      >

        <Text style={styles.secondaryText}>
          🔗 Search TCGPlayer
        </Text>

      </TouchableOpacity>


      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          Linking.openURL(priceChartUrl)
        }
      >

        <Text style={styles.secondaryText}>
          🔗 Search PriceCharting
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={() =>
          navigation.navigate('Scan')
        }
      >

        <Text style={styles.primaryText}>
          📷 Scan Another Card
        </Text>

      </TouchableOpacity>



    </ScrollView>

  );

}


function Section({title}) {

return (

<Text style={styles.section}>
{title}
</Text>

);

}

function PriceBox({
  label,
  value,
  highlight,
  green
}) {


return (

<View
style={[
styles.priceBox,
highlight && styles.highlight
]}
>


<Text style={styles.label}>
{label}
</Text>


<Text
style={[
styles.price,
green && {
color: COLORS.success
}
]}
>
{value}
</Text>


</View>

);

}

function Detail({
label,
value
}) {

return (

<View style={styles.detail}>

<Text style={styles.label}>
{label}
</Text>


<Text style={styles.detailValue}>
{value || '—'}
</Text>


</View>

);

}

const styles = StyleSheet.create({

scroll:{
flex:1,
backgroundColor:COLORS.background,
},


container:{
padding:24,
alignItems:'center',
},

cardImage:{
width:190,
height:265,
borderRadius:14,
marginBottom:20,
},

game:{
color:COLORS.textSecondary,
fontSize:14,
fontWeight:'600',
},

cardName:{
color:COLORS.text,
fontSize:26,
fontWeight:'800',
textAlign:'center',
marginTop:6,
},

set:{
color:COLORS.textSecondary,
marginTop:6,
},

section:{
alignSelf:'flex-start',
marginTop:28,
marginBottom:10,
fontSize:12,
fontWeight:'800',
letterSpacing:1,
color:COLORS.textSecondary,
},

row:{
flexDirection:'row',
gap:10,
width:'100%',
},

priceBox:{
flex:1,
backgroundColor:COLORS.surface,
borderRadius:16,
padding:15,
alignItems:'center',
},

highlight:{
borderWidth:1,
borderColor:COLORS.primary,
},

label:{
color:COLORS.textSecondary,
fontSize:12,
},

price:{
color:COLORS.primaryLight,
fontSize:18,
fontWeight:'800',
marginTop:5,
},

details:{
width:'100%',
gap:8,
},

detail:{
backgroundColor:COLORS.surface,
padding:14,
borderRadius:12,
},

detailValue:{
color:COLORS.text,
marginTop:5,
fontWeight:'600',
},

disclaimer:{
color:COLORS.textSecondary,
fontSize:11,
marginTop:8,
},

source:{
color:COLORS.textSecondary,
fontSize:11,
marginTop:20,
textAlign:'center',
},

primaryButton:{
backgroundColor:COLORS.primary,
width:'100%',
padding:16,
borderRadius:16,
marginTop:30,
alignItems:'center',
},

scanButton:{
backgroundColor:COLORS.success,
width:'100%',
padding:16,
borderRadius:16,
marginTop:20,
alignItems:'center',
},

secondaryButton:{
backgroundColor:COLORS.surface,
width:'100%',
padding:15,
borderRadius:14,
marginTop:12,
alignItems:'center',
},

primaryText:{
color:'#fff',
fontWeight:'800',
fontSize:16,
},

secondaryText:{
color:COLORS.primaryLight,
fontWeight:'700',
},

});