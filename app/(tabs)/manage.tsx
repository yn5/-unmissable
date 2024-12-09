import { RectButton } from 'react-native-gesture-handler';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { deleteReminder, getReminders } from '@/utils/reminderStorage';
import type { Reminder } from '@/types/reminder';

function ReminderItem({ reminder, onDelete }: { reminder: Reminder; onDelete: () => void }) {
	const colorScheme = useColorScheme() ?? 'light';
	const rowRef = useRef<SwipeableMethods>(null);

	const renderRightActions = () => {
		return (
			<RectButton
				style={styles.rightAction}
				onPress={() => {
					rowRef.current?.close();
					onDelete();
				}}
			>
				<Animated.View
					entering={SlideInRight}
					exiting={SlideOutRight}
					style={[styles.actionContent, { backgroundColor: Colors[colorScheme].error }]}
				>
					<ThemedText style={styles.actionText}>Delete</ThemedText>
				</Animated.View>
			</RectButton>
		);
	};

	return (
		<Animated.View entering={FadeIn} exiting={FadeOut} style={styles.itemContainer}>
			<Swipeable
				ref={rowRef}
				renderRightActions={renderRightActions}
				overshootRight={false}
				friction={2}
				rightThreshold={40}
			>
				<ThemedView style={styles.reminderItem}>
					<ThemedText style={styles.reminderTitle}>{reminder.title}</ThemedText>
					<ThemedText style={styles.reminderDate}>
						Due: {new Date(reminder.dueDate).toLocaleString()}
					</ThemedText>
					{reminder.recurrence && (
						<ThemedText style={styles.recurrenceTag}>{reminder.recurrence.type}</ThemedText>
					)}
				</ThemedView>
			</Swipeable>
		</Animated.View>
	);
}

function ManageScreen() {
	const [reminders, setReminders] = useState<Reminder[]>([]);

	const loadReminders = async () => {
		const loadedReminders = await getReminders();
		setReminders(
			loadedReminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
		);
	};

	const handleDelete = async (reminderId: string) => {
		await deleteReminder(reminderId);
		await loadReminders();
	};

	useFocusEffect(
		useCallback(() => {
			loadReminders();
		}, [])
	);

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.heading}>
				Manage Reminders
			</ThemedText>

			<FlatList
				data={reminders}
				keyExtractor={item => item.id}
				renderItem={({ item }) => (
					<ReminderItem reminder={item} onDelete={() => handleDelete(item.id)} />
				)}
				ListEmptyComponent={
					<ThemedText style={styles.emptyText}>
						No reminders yet. Tap the + button to create one!
					</ThemedText>
				}
				contentContainerStyle={styles.list}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
	heading: {
		marginBottom: 24,
	},
	list: {
		gap: 16,
		flexGrow: 1,
	},
	itemContainer: {
		height: 'auto',
	},
	reminderItem: {
		padding: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ccc',
		backgroundColor: '#fff',
		minHeight: 80,
	},
	reminderTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	reminderDate: {
		fontSize: 14,
		opacity: 0.7,
	},
	recurrenceTag: {
		fontSize: 12,
		opacity: 0.7,
		marginTop: 4,
	},
	rightAction: {
		height: '100%',
		justifyContent: 'center',
		backgroundColor: 'transparent',
		width: 80,
	},
	actionContent: {
		flex: 1,
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		borderTopRightRadius: 8,
		borderBottomRightRadius: 8,
	},
	actionText: {
		color: '#fff',
		fontWeight: '600',
	},
	emptyText: {
		textAlign: 'center',
		opacity: 0.5,
		marginTop: 32,
	},
});

export default ManageScreen;
