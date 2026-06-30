import { useState } from 'react';
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

  async function pickImage(fromCamera) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission needed');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.7,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          base64: true,
        });

    if (!result.canceled) {
      handleImage(result.assets[0]);
    }
  }

  async function handleImage(asset) {
    try {
      setImage(asset.uri);
      setLoading(true);

      if (!asset.base64) {
        throw new Error('No base64 image returned from picker');
      }

      const res = await fetch(`${BACKEND_URL}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: asset.base64,   // IMPORTANT: must be "image"
          mimeType: asset.mimeType || 'image/jpeg',
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

      navigation.navigate('Result', {
        result: data,
        imageUri: asset.uri,
      });
    } catch (err) {
      Alert.alert('Scan failed', err.message);
    } finally {
      setLoading(false);
      setImage(null);
    }
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingBox}>
          {image && <Image source={{ uri: image }} style={styles.preview} />}
          <ActivityIndicator size="large" color="#6c47ff" />
          <Text style={styles.loadingText}>Reading card…</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.primaryButtonText}>📷 Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.secondaryButtonText}>🖼 Gallery</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    padding: 24,
  },
  primaryButton: {
    backgroundColor: '#6c47ff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: { color: 'white', textAlign: 'center' },
  secondaryButton: {
    backgroundColor: '#222',
    padding: 18,
    borderRadius: 12,
  },
  secondaryButtonText: { color: '#ccc', textAlign: 'center' },
  loadingBox: { alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10 },
  preview: { width: 200, height: 280, marginBottom: 10 },
});