import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { LogOut, Crown, User, Info } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';

export default function SettingsScreen() {
  const { user, profile, signOut, isPremium } = useAuth();
  const { getRemainingTasks, getTimeUntilReset } = useUsage();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: '#0A0E27' },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <User size={32} color="#6366F1" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.tierBadge}>
                {isPremium && <Crown size={14} color="#F59E0B" />}
                <Text style={[styles.tierText, isPremium && styles.premiumText]}>
                  {isPremium ? 'Premium' : 'Free Tier'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage</Text>
            <View style={styles.card}>
              <View style={styles.usageRow}>
                <Text style={styles.usageLabel}>Tasks Remaining</Text>
                <Text style={styles.usageValue}>{getRemainingTasks}</Text>
              </View>
              {getRemainingTasks === 0 && (
                <View style={styles.usageRow}>
                  <Text style={styles.usageLabel}>Next Task Available</Text>
                  <Text style={styles.usageValue}>{getTimeUntilReset}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => Alert.alert('Premium', 'Upgrade to Premium for unlimited tasks!')}
            testID="upgrade-button"
          >
            <View style={styles.cardContent}>
              <Crown size={24} color="#F59E0B" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isPremium
                    ? 'Enjoy unlimited browser automation'
                    : 'Get unlimited tasks and priority support'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              Alert.alert(
                'About Bro',
                'Version 1.0.0\n\nYour AI-powered browser automation assistant. Automate searches, form filling, navigation, and more with simple voice or text commands.'
              )
            }
            testID="about-button"
          >
            <View style={styles.cardContent}>
              <Info size={24} color="#6366F1" />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>About Bro</Text>
                <Text style={styles.cardSubtitle}>Version 1.0.0</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          testID="signout-button"
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B92B0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 8,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(139, 146, 176, 0.1)',
    borderRadius: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8B92B0',
  },
  premiumText: {
    color: '#F59E0B',
  },
  card: {
    backgroundColor: '#1A1F3A',
    borderRadius: 12,
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8B92B0',
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  usageLabel: {
    fontSize: 14,
    color: '#8B92B0',
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#EF4444',
  },
});
