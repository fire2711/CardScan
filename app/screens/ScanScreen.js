import { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const BACKEND_URL = 'https://cardscan-production-a44e.up.railway.app';

export default function ScanScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

  const result = await ImagePicker.launchCameraAsync({
  mediaTypes: 'Images',
  quality: 0.6,
});

    if (!result.canceled) {
      handleImage(result.assets[0]);
    }
  }

  async function openGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: 'Images',
  quality: 1,
});

    if (!result.canceled) {
      handleImage(result.assets[0]);
    }
  }

async function handleImage(asset) {
  try {
    setImage(asset.uri);
    setLoading(true);

    console.log('Converting image to base64...');
    console.log(FileSystem);
    console.log(FileSystem.EncodingType);
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
  encoding: 'base64',
});

    console.log('Sending image to backend...');

    const response = await fetch(`${BACKEND_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: base64,
        mimeType: asset.mimeType || 'image/jpeg',
      }),
    });

    const text = await response.text();

console.log("STATUS:", response.status);
console.log("RAW RESPONSE:", text);

if (!response.ok) {
  throw new Error(text);
}

const data = JSON.parse(text);

    navigation.navigate('Result', {
      result: data,
      imageUri: asset.uri,
    });

  } catch (err) {
    console.log('SCAN ERROR:', err);

    Alert.alert(
      'Could not scan card',
      err.message || 'Try a clearer photo.'
    );

  } finally {
    setLoading(false);
    setImage(null);
  }
}

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingBox}>
          {image && (
            <Image source={{ uri: image }} style={styles.preview} />
          )}

          <ActivityIndicator size="large" color="#6c47ff" style={{ marginTop: 24 }} />

          <Text style={styles.loadingText}>Reading card text…</Text>
          <Text style={styles.loadingSubtext}>Looking up market price</Text>
        </View>
      ) : (
        <>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🃏</Text>
            <Text style={styles.placeholderText}>
              Point your camera at a card{"\n"}
              or choose a photo
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryButton} onPress={openCamera}>
              <Text style={styles.primaryButtonText}>📷 Use Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={openGallery}>
              <Text style={styles.secondaryButtonText}>🖼 Choose from Library</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.tip}>
            💡 Make sure the card name and number are clearly visible
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    marginBottom: 48,
  },
  placeholderEmoji: { fontSize: 72, marginBottom: 16 },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonGroup: { gap: 12 },
  primaryButton: {
    backgroundColor: '#6c47ff',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#1e1e1e',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  secondaryButtonText: { color: '#ccc', fontSize: 17, fontWeight: '600' },
  tip: {
    color: '#444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
  },
  loadingBox: {
    alignItems: 'center',
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
  },
  loadingSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
});