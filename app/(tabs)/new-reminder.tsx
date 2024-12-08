import { useState } from 'react';
import { StyleSheet, TextInput, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { nanoid } from 'nanoid/non-secure';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { saveReminder } from '@/utils/reminderStorage';
import type { Reminder } from '@/types/reminder';

export default function NewReminderScreen() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const colorScheme = useColorScheme() ?? 'light';
  const textColor = Colors[colorScheme].text;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the reminder');
      return;
    }

    try {
      const reminder: Reminder = {
        id: nanoid(),
        title: title.trim(),
        dueDate: date.toISOString(),
        completed: false,
        createdAt: new Date().toISOString(),
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
      <ThemedText type="title" style={styles.heading}>New Reminder</ThemedText>
      
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