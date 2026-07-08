import { useState, useRef } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const BACKEND_URL = 'https://cardscan-production-a44e.up.railway.app';
const { width } = Dimensions.get('window');

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('camera');
  const [loadingStep, setLoadingStep] = useState('');
  const [capturedUri, setCapturedUri] = useState(null);

  const cameraRef = useRef(null);

  async function takePicture() {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      handleImage(photo.uri);
    } catch (err) {
      Alert.alert('Error', 'Could not take photo.');
    }
  }

  async function handleImage(uri) {
    try {
      setCapturedUri(uri);
      setMode('loading');
      setLoadingStep('Optimizing photo...');

      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) {
        throw new Error('No base64 image generated');
      }

      setLoadingStep('Reading card...');

      const res = await fetch(`${BACKEND_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: manipulated.base64, // same variable as old version
          mimeType: 'image/jpeg',
        }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned invalid JSON');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setLoadingStep('Fetching prices...');

      await saveToHistory(data, uri);

      navigation.navigate('Result', {
        result: data,
        imageUri: uri,
      });
    } catch (err) {
      Alert.alert('Scan failed', err.message);
    } finally {
      setMode('camera');
      setCapturedUri(null);
      setLoadingStep('');
    }
  }

  async function saveToHistory(result, imageUri) {
    try {
      const existing = await AsyncStorage.getItem('scan_history');
      const history = existing ? JSON.parse(existing) : [];

      const entry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageUri,
        cardName: result.cardDetails?.name || result.cardName,
        game: result.game,
        set: result.cardDetails?.set,
        number: result.cardDetails?.number,
        rarity: result.cardDetails?.rarity,
        market: result.prices?.market,
        psa10: result.graded?.psa10,
      };

      history.unshift(entry);

      await AsyncStorage.setItem(
        'scan_history',
        JSON.stringify(history.slice(0, 50))
      );
    } catch (err) {
      console.log('History save error:', err);
    }
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>
          Camera access is needed to scan cards
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            Grant Camera Access
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'loading') {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          {capturedUri && (
            <Image source={{ uri: capturedUri }} style={styles.preview} />
          )}

          <ActivityIndicator
            size="large"
            color="#6c47ff"
            style={{ marginTop: 24 }}
          />

          <Text style={styles.loadingText}>{loadingStep}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        <View style={styles.overlay}>
          <View style={styles.cardFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.hint}>
            Align card within the frame
          </Text>
        </View>
      </CameraView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyIcon}>📋</Text>
          <Text style={styles.historyLabel}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <View style={{ width: 64 }} />
      </View>
    </View>
  );
}

const FRAME_WIDTH = width * 0.75;
const FRAME_HEIGHT = FRAME_WIDTH * 1.4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
  },

  camera: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#6c47ff',
    borderWidth: 3,
  },

  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },

  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },

  hint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 32,
    backgroundColor: '#0f0f0f',
  },

  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  historyButton: {
    width: 64,
    alignItems: 'center',
  },

  historyIcon: {
    fontSize: 28,
  },

  historyLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },

  permText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },

  primaryButton: {
    backgroundColor: '#6c47ff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginHorizontal: 32,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  loadingBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  preview: {
    width: 200,
    height: 280,
    borderRadius: 12,
    resizeMode: 'contain',
  },

  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
});