import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export function RoleGatewayButton() {
  return (
    <Pressable
      onPress={() => router.replace('/portal')}
      accessibilityRole="button"
      accessibilityLabel="Back to Role Selection"
      style={{ padding: 12 }}>
      <Text style={{ color: '#2456b3', fontWeight: '600' }}>Role Selection</Text>
    </Pressable>
  );
}
