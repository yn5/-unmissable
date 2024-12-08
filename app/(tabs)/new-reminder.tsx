import DateTimePicker from '@react-native-community/datetimepicker';
import { nanoid } from 'nanoid/non-secure';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { saveReminder } from '@/utils/reminderStorage';
import type { RecurrenceType, Reminder } from '@/types/reminder';

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType | null }[] = [
	{ label: 'None', value: null },
	{ label: 'Daily', value: 'daily' },
	{ label: 'Weekly', value: 'weekly' },
	{ label: 'Monthly', value: 'monthly' },
	{ label: 'Custom', value: 'custom' },
];

export default function NewReminderScreen() {
	const [title, setTitle] = useState('');
	const [date, setDate] = useState(new Date());
	const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | null>(null);
	const [customDays, setCustomDays] = useState('');
	const colorScheme = useColorScheme() ?? 'light';
	const textColor = Colors[colorScheme].text;

	const handleSave = async () => {
		if (!title.trim()) {
			Alert.alert('Error', 'Please enter a title for the reminder');
			return;
		}

		if (recurrenceType === 'custom' && (!customDays || parseInt(customDays) < 1)) {
			Alert.alert('Error', 'Please enter a valid number of days for custom recurrence');
			return;
		}

		try {
			const reminder: Reminder = {
				id: nanoid(),
				title: title.trim(),
				dueDate: date.toISOString(),
				completed: false,
				createdAt: new Date().toISOString(),
				...(recurrenceType && {
					recurrence: {
						type: recurrenceType,
						...(recurrenceType === 'custom' && { customDays: parseInt(customDays) }),
					},
					completedDates: [],
				}),
			};

			await saveReminder(reminder);
			router.back();
		} catch (error) {
			Alert.alert('Error', 'Failed to save reminder. Please try again.');
			console.error('Error saving reminder:', error);
		}
	};

	return (
		<ThemedView style={styles.container}>
			<ThemedText type="title" style={styles.heading}>
				New Reminder
			</ThemedText>

			<ThemedView style={styles.form}>
				<TextInput
					style={[styles.input, { color: textColor, borderColor: Colors[colorScheme].icon }]}
					placeholder="Reminder title"
					placeholderTextColor={Colors[colorScheme].icon}
					value={title}
					onChangeText={setTitle}
				/>

				<ThemedText style={styles.label}>Time</ThemedText>
				<DateTimePicker
					value={date}
					mode="datetime"
					onChange={(event, selectedDate) => {
						if (selectedDate) setDate(selectedDate);
					}}
					style={styles.datePicker}
					accentColor={Colors[colorScheme].tint}
					minimumDate={new Date()}
				/>

				<ThemedText style={styles.label}>Recurrence</ThemedText>
				<View style={styles.recurrenceOptions}>
					{RECURRENCE_OPTIONS.map(option => (
						<TouchableOpacity
							key={option.label}
							style={[
								styles.recurrenceOption,
								recurrenceType === option.value && styles.recurrenceOptionSelected,
								{ borderColor: Colors[colorScheme].icon },
							]}
							onPress={() => setRecurrenceType(option.value)}
						>
							<ThemedText
								style={[
									styles.recurrenceOptionText,
									recurrenceType === option.value && styles.recurrenceOptionTextSelected,
								]}
							>
								{option.label}
							</ThemedText>
						</TouchableOpacity>
					))}
				</View>

				{recurrenceType === 'custom' && (
					<View style={styles.customDaysContainer}>
						<TextInput
							style={[
								styles.customDaysInput,
								{ color: textColor, borderColor: Colors[colorScheme].icon },
							]}
							placeholder="Number of days"
							placeholderTextColor={Colors[colorScheme].icon}
							value={customDays}
							onChangeText={setCustomDays}
							keyboardType="number-pad"
						/>
						<ThemedText style={styles.customDaysLabel}>days</ThemedText>
					</View>
				)}

				<ThemedView
					style={[styles.button, { backgroundColor: Colors[colorScheme].tint }]}
					onTouchEnd={handleSave}
				>
					<ThemedText style={styles.buttonText}>Save Reminder</ThemedText>
				</ThemedView>
			</ThemedView>
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
	form: {
		gap: 16,
	},
	input: {
		height: 48,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
	},
	label: {
		fontSize: 16,
		marginBottom: -8,
	},
	datePicker: {
		height: 48,
	},
	recurrenceOptions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 8,
	},
	recurrenceOption: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 16,
		borderWidth: 1,
	},
	recurrenceOptionSelected: {
		backgroundColor: Colors.light.tint,
		borderColor: Colors.light.tint,
	},
	recurrenceOptionText: {
		fontSize: 14,
	},
	recurrenceOptionTextSelected: {
		color: '#fff',
	},
	customDaysContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	customDaysInput: {
		height: 48,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 16,
		fontSize: 16,
		width: 120,
	},
	customDaysLabel: {
		fontSize: 16,
	},
	button: {
		height: 48,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});
