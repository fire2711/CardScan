import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';

import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS } from '../constants/theme';

export default function EditCardScreen({ route, navigation }) {
  const { card } = route.params;

  const [form, setForm] = useState({
    cardName: card.cardName || '',
    set: card.set || '',
    number: card.number || '',
    rarity: card.rarity || '',
    market: String(card.market || ''),
    low: String(card.low || ''),
    high: String(card.high || ''),
    psa9: String(card.psa9 || ''),
    psa10: String(card.psa10 || ''),
  });

  function update(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function save() {
    try {
      const data = await AsyncStorage.getItem('card_collection');
      const collection = data ? JSON.parse(data) : [];

      const updated = collection.map(item => {
        if (item.id !== card.id) return item;

        return {
          ...item,
          cardName: form.cardName,
          set: form.set,
          number: form.number,
          rarity: form.rarity,
          market: Number(form.market) || 0,
          low: Number(form.low) || 0,
          high: Number(form.high) || 0,
          psa9: Number(form.psa9) || 0,
          psa10: Number(form.psa10) || 0,
        };
      });

      await AsyncStorage.setItem(
        'card_collection',
        JSON.stringify(updated)
      );

      navigation.goBack();

    } catch (err) {
      console.log('Save error:', err);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Edit Card
      </Text>

      <Text style={styles.subtitle}>
        Update card information and collection value
      </Text>

      <Section title="Card Information">
        <Field
          label="Card Name"
          value={form.cardName}
          onChange={(v) => update('cardName', v)}
        />

        <Field
          label="Set"
          value={form.set}
          onChange={(v) => update('set', v)}
        />

        <Field
          label="Number"
          value={form.number}
          onChange={(v) => update('number', v)}
        />

        <Field
          label="Rarity"
          value={form.rarity}
          onChange={(v) => update('rarity', v)}
        />
      </Section>

      <Section title="Market Prices">
        <Field
          label="Market Price"
          value={form.market}
          keyboard
          onChange={(v) => update('market', v)}
        />

        <Field
          label="Low Price"
          value={form.low}
          keyboard
          onChange={(v) => update('low', v)}
        />

        <Field
          label="High Price"
          value={form.high}
          keyboard
          onChange={(v) => update('high', v)}
        />
      </Section>

      <Section title="Graded Prices">
        <Field
          label="PSA 9"
          value={form.psa9}
          keyboard
          onChange={(v) => update('psa9', v)}
        />

        <Field
          label="PSA 10"
          value={form.psa10}
          keyboard
          onChange={(v) => update('psa10', v)}
        />
      </Section>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={save}
      >
        <Text style={styles.saveText}>
          Save Changes
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ? 'numeric' : 'default'}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },

  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },

  sectionBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },

  sectionTitle: {
    color: COLORS.primaryLight,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },

  field: {
    marginBottom: 12,
  },

  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#202027',
    color: COLORS.text,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },

  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});