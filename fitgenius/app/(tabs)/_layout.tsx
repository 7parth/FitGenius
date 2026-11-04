import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
      <Text style={tabStyles.emoji}>{icon}</Text>
      {focused && <Text style={tabStyles.label}>{label}</Text>}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
  },
  iconFocused: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
  },
  emoji: { fontSize: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📚" label="Library" />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⚡" label="Track" />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📈" label="Progress" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
