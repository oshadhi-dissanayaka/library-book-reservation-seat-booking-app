import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export default function MyReservationsHub() {
  const params = useLocalSearchParams<{ patronId?: string }>();
  const patronId = Array.isArray(params.patronId) ? params.patronId[0] : params.patronId;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>My Reservations</Text>
      <Text style={styles.description}>Choose the reservations you want to view.</Text>
      <Link href={{ pathname: '/explore', params: patronId ? { patronId } : {} }} asChild>
        <Pressable style={styles.card} accessibilityRole="button">
          <Text style={styles.title}>Book Reservations</Text>
          <Text style={styles.description}>View your reserved books and pickup details.</Text>
        </Pressable>
      </Link>
      <Link href="/reservations" asChild>
        <Pressable style={styles.card} accessibilityRole="button">
          <Text style={styles.title}>Seat Reservations</Text>
          <Text style={styles.description}>View your reading-room seat bookings.</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f6fb' },
  content: { padding: 24, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  heading: { fontSize: 28, fontWeight: '700', color: '#17243f' },
  title: { fontSize: 20, fontWeight: '600', color: '#102b69', marginBottom: 8 },
  description: { fontSize: 15, color: '#66738a' },
  card: { backgroundColor: '#ffffff', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#e5e9f1' },
});
