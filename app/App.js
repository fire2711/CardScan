import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#0f0f0f' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CardScan' }} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan Card' }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Market Price' }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Scan History' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);