import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { M2Colors } from './m2-theme';

interface LegendEntry {
  label: string;
  /** Background fill for the swatch */
  bg: string;
  /** Border color for the swatch */
  border?: string;
  /** Overlay symbol or icon text */
  symbol?: string;
  symbolColor?: string;
}

const ENTRIES: LegendEntry[] = [
  {
    label: 'Available',
    bg: M2Colors.subtleBg,
    border: M2Colors.borderLight,
  },
  {
    label: 'Selected',
    bg: M2Colors.blue,
    border: M2Colors.blue,
    symbol: '✓',
    symbolColor: '#FFFFFF',
  },
  {
    label: 'Reserved',
    bg: '#E3E6EF',
    border: '#D3D8E4',
    symbol: '×',
    symbolColor: '#98A0B3',
  },
];

export default function SeatLegend() {
  return (
    <View style={styles.row}>
      {ENTRIES.map((entry) => (
        <View key={entry.label} style={styles.item}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: entry.bg, borderColor: entry.border ?? 'transparent' },
            ]}>
            {entry.symbol ? (
              <Text style={[styles.symbol, { color: entry.symbolColor ?? M2Colors.muted }]}>
                {entry.symbol}
              </Text>
            ) : null}
          </View>
          <Text style={styles.label}>{entry.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  swatch: {
    width: 26,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  label: {
    fontSize: 13,
    color: M2Colors.secondary,
    fontWeight: '600',
  },
});
