import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#1a8e2d',
                tabBarInactiveTintColor: '#666',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0',
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 5,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
                tabBarIconStyle: {
                    marginBottom: 2,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Medicine',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="medical" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="steps"
                options={{
                    title: 'Steps',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="footsteps" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
