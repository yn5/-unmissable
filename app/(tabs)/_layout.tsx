import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarBackground: TabBarBackground,
					tabBarStyle: Platform.select({
						ios: {
							position: 'absolute',
						},
						default: {},
					}),
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: 'Home',
						tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
					}}
				/>
				<Tabs.Screen
					name="new-reminder"
					options={{
						title: 'New',
						tabBarIcon: ({ color }) => (
							<IconSymbol size={28} name="plus.circle.fill" color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="manage"
					options={{
						title: 'Manage',
						tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
					}}
				/>
			</Tabs>
		</SafeAreaView>
	);
}
