import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { M2Colors, M2Radii, M2Shadow } from './m2-theme';

interface Props {
  icon?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function M2EmptyState({ icon = '📋', title, subtitle, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.button} onPress={onAction} accessibilityRole="button">
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: M2Colors.cardBg,
    borderRadius: M2Radii.card,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    ...M2Shadow,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: M2Colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: M2Colors.muted,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    backgroundColor: M2Colors.blue,
    borderRadius: M2Radii.button,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
