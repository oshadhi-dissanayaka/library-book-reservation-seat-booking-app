import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { M2Colors } from './m2-theme';

interface Props {
  label: string;
  value: string;
  /** Render value in blue accent color (for codes, etc.) */
  accent?: boolean;
}

export default function M2InfoRow({ label, value, accent = false }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accent]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: M2Colors.border,
  },
  label: {
    fontSize: 14,
    color: M2Colors.muted,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: M2Colors.ink,
    textAlign: 'right',
    maxWidth: '62%',
  },
  accent: {
    color: M2Colors.blue,
    letterSpacing: 0.4,
  },
});
