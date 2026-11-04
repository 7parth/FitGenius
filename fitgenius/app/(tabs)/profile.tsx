import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '@/store/auth';
import { useProfileStore } from '@/store/profile';
import { Colors } from '@/constants/colors';

const GOAL_LABELS = {
  weight_loss: 'Lose Weight 🔥',
  muscle_gain: 'Build Muscle 💪',
  endurance: 'Endurance 🏃',
  flexibility: 'Flexibility 🧘',
};

const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { profile } = useProfileStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={styles.avatar}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {profile?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name ?? 'Athlete'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Profile Stats */}
        {profile && (
          <View style={styles.statsRow}>
            <StatPill label="Goal" value={GOAL_LABELS[profile.fitness_goal] ?? profile.fitness_goal} />
            <StatPill label="Level" value={LEVEL_LABELS[profile.fitness_level] ?? profile.fitness_level} />
            <StatPill label="Days/wk" value={String(profile.weekly_frequency)} />
          </View>
        )}

        {/* Info Section */}
        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Info</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Age" value={`${profile.age} years`} />
              <InfoRow label="Weight" value={`${profile.weight} kg`} />
              <InfoRow label="Height" value={`${profile.height} cm`} />
              <InfoRow label="Equipment" value={profile.equipment.replace('_', ' ')} />
              <InfoRow label="Session Length" value={`${profile.workout_duration} min`} last />
            </View>
          </View>
        )}

        {/* Health Conditions */}
        {profile && profile.health_conditions.length > 0 && profile.health_conditions[0] !== 'None' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Health Conditions</Text>
            <View style={styles.chipRow}>
              {profile.health_conditions.map((c) => (
                <View key={c} style={styles.chip}>
                  <Text style={styles.chipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.actionList}>
            <ActionRow icon="📧" label="Email" value={user?.email ?? ''} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.actionRow}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <View style={styles.actionContent}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  avatar: { alignItems: 'center', paddingVertical: 16 },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitial: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  email: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  pillLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  pillValue: { fontSize: 13, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLabel: { fontSize: 15, color: Colors.textSecondary },
  infoValue: { fontSize: 15, color: Colors.text, fontWeight: '600', textTransform: 'capitalize' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: Colors.error + '44',
  },
  chipText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  actionList: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  actionIcon: { fontSize: 20 },
  actionContent: { gap: 2 },
  actionLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  actionValue: { fontSize: 14, color: Colors.text },
  signOutButton: {
    borderWidth: 1,
    borderColor: Colors.error + '66',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { color: Colors.error, fontWeight: '700', fontSize: 16 },
});
