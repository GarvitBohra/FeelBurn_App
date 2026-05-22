import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { BurnColors } from './GlassCard';
import { Home, Dumbbell, BarChart2, User as UserIcon } from 'lucide-react-native';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0C0C14',
          borderTopColor: 'rgba(255, 255, 255, 0.05)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        },
        tabBarActiveTintColor: BurnColors.primary,
        tabBarInactiveTintColor: '#52546D',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Home size={22} color={color} style={focused ? { opacity: 1 } : { opacity: 0.6 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workouts',
          tabBarIcon: ({ color, focused }) => (
            <Dumbbell size={22} color={color} style={focused ? { opacity: 1 } : { opacity: 0.6 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color, focused }) => (
            <BarChart2 size={22} color={color} style={focused ? { opacity: 1 } : { opacity: 0.6 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserIcon size={22} color={color} style={focused ? { opacity: 1 } : { opacity: 0.6 }} />
          ),
        }}
      />
    </Tabs>
  );
}

