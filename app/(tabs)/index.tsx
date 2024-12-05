import { useState } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);

  type Medication = {
    id: string;
    name: string;
    dosage: string;
    time: string;
    status: 'Taken' | 'Missed' | null;
  };

  type MedicationsByDate = {
    [date: string]: Medication[];
  };

  const sampleMedications: MedicationsByDate = {
    '2024-12-06': [
      { id: '1', name: 'Aspirin', dosage: '1 tablet', time: '8:00 AM', status: null },
      { id: '2', name: 'Vitamin D', dosage: '2 capsules', time: '12:00 PM', status: null },
    ],
    '2024-12-07': [
      { id: '3', name: 'Metformin', dosage: '500mg', time: '8:00 AM', status: null },
    ],
  };

  const onDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setMedications(sampleMedications[day.dateString] || []);
  };

  const markAs = (id: string, status: 'Taken' | 'Missed') => {
    setMedications((prevMedications) =>
      prevMedications.map((med) =>
        med.id === id ? { ...med, status } : med
      )
    );
    Alert.alert('Medication Updated', `Marked as ${status}.`);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Calendar */}
      <Calendar
        markedDates={{
          [selectedDate || '']: { selected: true, selectedColor: '#A1CEDC' },
        }}
        onDayPress={onDateSelect}
        style={styles.calendar}
        theme={{
          textDayFontSize: 18,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 16,
        }}
      />

      {/* Medication List */}
      <View style={styles.listContainer}>
        {medications.length > 0 ? (
          <FlatList
            data={medications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.medicationItem,
                  item.status === 'Taken' && styles.takenBackground,
                  item.status === 'Missed' && styles.missedBackground,
                ]}
              >
                {/* Medication details */}
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationText}>
                    {item.name} - {item.dosage}
                  </Text>
                  <Text style={styles.medicationTime}>Time: {item.time}</Text>
                </View>

                {/* Status Text */}
                {item.status && (
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Taken' ? styles.takenText : styles.missedText,
                    ]}
                  >
                    {item.status}
                  </Text>
                )}

                {/* Action Buttons (lower right) */}
                {!item.status && (
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => markAs(item.id, 'Taken')}
                    >
                      <Text style={styles.buttonText}>Taken</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => markAs(item.id, 'Missed')}
                    >
                      <Text style={styles.buttonText}>Missed</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>No medications scheduled for this day.</Text>
        )}
      </View>
    </ThemedView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  calendar: {
    marginTop: 30,
    marginBottom: 16,
    width: '100%',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f4f4f4',
  },
  listContainer: {
    flex: 1,
  },
  medicationItem: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative', // To position the buttons and status text inside this container
  },
  medicationDetails: {
    paddingBottom: 25, 
  },
  medicationText: {
    fontSize: width * 0.055, 
    fontWeight: 'bold',
  },
  medicationTime: {
    fontSize: width * 0.05, 
    color: '#888',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#A1CEDC',
    borderRadius: 4,
  },
  buttonText: {
    color: '#000',
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  statusText: {
    position: 'absolute',
    bottom: 20, 
    right: 20,
    fontSize: width * 0.055,
    fontWeight: 'bold',
  },
  takenText: {
    color: 'green',
  },
  missedText: {
    color: 'red',
  },
  takenBackground: {
    backgroundColor: '#DFFFD6', // Light green
  },
  missedBackground: {
    backgroundColor: '#FFD6D6', // Light red
  },
  noDataText: {
    fontSize: width * 0.06,
    textAlign: 'center',
    color: '#888',
  },
});