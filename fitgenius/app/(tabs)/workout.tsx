import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { EXERCISES, CATEGORIES } from '@/constants/exercises';
import { Colors } from '@/constants/colors';
import { Exercise, ExerciseCategory } from '@/types';

const DIFFICULTY_COLORS = {
  beginner: Colors.accent,
  intermediate: Colors.warning,
  advanced: Colors.error,
};

const CATEGORY_ICONS: Record<string, string> = {
  strength: '🏋️',
  cardio: '🏃',
  flexibility: '🧘',
  hiit: '⚡',
};

export default function WorkoutLibraryScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchesSearch =
        search.length === 0 ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscle_groups.some((m) => m.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Exercise Library</Text>
          <Text style={styles.subtitle}>{EXERCISES.length} exercises</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises or muscles..."
            placeholderTextColor={Colors.textMuted}
            clearButtonMode="while-editing"
            accessibilityLabel="Search exercises"
          />
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {(['all', ...CATEGORIES] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catChip,
                selectedCategory === cat && styles.catChipSelected,
              ]}
              onPress={() => setSelectedCategory(cat)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedCategory === cat }}
            >
              <Text style={styles.catIcon}>
                {cat === 'all' ? '✨' : CATEGORY_ICONS[cat]}
              </Text>
              <Text
                style={[
                  styles.catText,
                  selectedCategory === cat && styles.catTextSelected,
                ]}
              >
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <Text style={styles.resultCount}>{filtered.length} results</Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard
              exercise={item}
              onPress={() => router.push(`/workout/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
    </SafeAreaView>
  );
}

function ExerciseCard({
  exercise,
  onPress,
}: {
  exercise: Exercise;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${exercise.name}, ${exercise.difficulty}`}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>{CATEGORY_ICONS[exercise.category]}</Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName}>{exercise.name}</Text>
          {exercise.pose_trackable && (
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>🤖 AI</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardMuscles}>
          {exercise.muscle_groups.slice(0, 3).join(' · ')}
        </Text>
        <View style={styles.cardMeta}>
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: DIFFICULTY_COLORS[exercise.difficulty] + '22' },
            ]}
          >
            <Text
              style={[
                styles.diffText,
                { color: DIFFICULTY_COLORS[exercise.difficulty] },
              ]}
            >
              {exercise.difficulty}
            </Text>
          </View>
          {exercise.equipment.length > 0 && (
            <Text style={styles.equipment}>
              {exercise.equipment.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 16, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: Colors.text },
  categories: { gap: 8, paddingBottom: 14 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
  },
  catIcon: { fontSize: 14 },
  catText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  catTextSelected: { color: Colors.primary },
  resultCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 10, fontWeight: '600' },
  list: { paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 22 },
  cardContent: { flex: 1, gap: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
  aiTag: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiTagText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  cardMuscles: { fontSize: 12, color: Colors.textMuted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  equipment: { fontSize: 12, color: Colors.textMuted },
  chevron: { fontSize: 20, color: Colors.textMuted, fontWeight: '300' },
});
