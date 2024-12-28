import { useState } from 'react';
import { StyleSheet, FlatList, View, Text, TouchableOpacity, Alert, Dimensions, TextInput } from 'react-native';
import { Calendar } from 'react-native-calendars';
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
    notified: boolean; // Track if notified about the missed dose
    quantityTaken: string | null;
    timeTaken: string | null;
  };

  type MedicationsByDate = {
    [date: string]: Medication[];
  };

  const sampleMedications: MedicationsByDate = {
    '2024-12-06': [
      { id: '1', name: 'Aspirin', dosage: '1 tablet', time: '8:00 AM', status: null, notified: false, quantityTaken: null, timeTaken: null },
      { id: '2', name: 'Vitamin D', dosage: '2 capsules', time: '12:00 PM', status: null, notified: false, quantityTaken: null, timeTaken: null },
    ],
    '2024-12-07': [
      { id: '3', name: 'Metformin', dosage: '500mg', time: '8:00 AM', status: null, notified: false, quantityTaken: null, timeTaken: null },
    ],
  };

  const onDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setMedications(sampleMedications[day.dateString] || []);
  };

  const markAs = (id: string, status: 'Taken' | 'Missed', quantity: string | null, timeTaken: string | null) => {
    setMedications((prevMedications) =>
      prevMedications.map((med) =>
        med.id === id
          ? {
              ...med,
              status,
              notified: true,
              quantityTaken: quantity,
              timeTaken: timeTaken, // Save the time taken if missed
            }
          : med
      )
    );
    Alert.alert('Medication Updated', `Marked as ${status}.`);
  };

  const handleMissedDose = (med: Medication) => {
    const now = new Date();
    const doseTime = new Date(`1970-01-01T${med.time}:00`);

    // If the current time is closer to the next dose, suggest waiting.
    if (now.getTime() - doseTime.getTime() > 3600000) { // 1 hour threshold
      Alert.alert(
        'Missed Dose',
        'It seems you missed this dose. Since the next dose is close, you may want to take it at the scheduled time.'
      );
    } else {
      Alert.alert('Missed Dose', 'You can take the missed dose now.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.heading}>Welcome to MediBuddy!</Text>
      {/* Calendar */}
      <Calendar
        markedDates={{
          [selectedDate || '']: { selected: true, selectedColor: '#007bff' },
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
            renderItem={({ item, index }) => (
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
                    {item.name} - {item.dosage})
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
                    {/* Quantity Taken Section */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Quantity Taken</Text>
                      <TextInput
                        style={styles.quantityInput}
                        placeholder="Quantity Taken"
                        keyboardType="numeric"
                        value={item.quantityTaken || item.dosage} // Default to required dosage if no value
                        maxLength={3} // Limit input to reasonable quantity (e.g., 999 max)
                        onChangeText={(text) => {
                          // Ensure the quantity is less than or equal to the required dose
                          const quantity = Math.min(parseInt(text) || 0, parseInt(item.dosage) || 0);
                          setMedications((prevMedications) =>
                            prevMedications.map((med) =>
                              med.id === item.id ? { ...med, quantityTaken: quantity.toString() } : med
                            )
                          );
                        }}
                      />
                    </View>

                    {/* Time Taken Section */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Time Taken</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="HH:MM"
                        keyboardType="numeric"
                        value={item.timeTaken || ''} // Allow user to enter time if missed clicking taken/missed
                        maxLength={5} // Format like HH:MM
                        onChangeText={(text) => {
                          setMedications((prevMedications) =>
                            prevMedications.map((med) =>
                              med.id === item.id ? { ...med, timeTaken: text } : med
                            )
                          );
                        }}
                      />
                    </View>

                    {/* Action Buttons for Taken or Missed */}
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.takenButton}
                        onPress={() => markAs(item.id, 'Taken', item.quantityTaken, item.timeTaken)}
                      >
                        <Text style={styles.buttonText}>Taken</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.missedButton}
                        onPress={() => {
                          handleMissedDose(item);
                          markAs(item.id, 'Missed', item.quantityTaken, item.timeTaken);
                        }}
                      >
                        <Text style={styles.buttonText}>Missed</Text>
                      </TouchableOpacity>
                    </View>
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
  heading: {
    marginTop: 35,
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 80,
  },
  calendar: {
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
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative', // To position the buttons and status text inside this container
  },
  medicationDetails: {
    paddingBottom: 15, 
  },
  medicationText: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
  },
  medicationTime: {
    fontSize: width * 0.05,
    color: '#888',
  },
  takenButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    width: 160,
  },
  missedButton: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    width: 160,
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  takenBackground: {
    backgroundColor: '#d4f8e8',
  },
  missedBackground: {
    backgroundColor: '#ffd6d6',
  },
  statusText: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  takenText: {
    color: '#4CAF50',
  },
  missedText: {
    color: '#FF5722',
  },
  noDataText: {
    textAlign: 'center',
    color: '#888',
    fontSize: width * 0.05,
  },
  buttonsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputContainer: {
    marginBottom: 15,  // Space between inputs
  },
  inputLabel: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: 5,  // Label space from input
  },
  quantityInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingLeft: 10,
    fontSize: width * 0.045,
  },
  timeInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingLeft: 10,
    fontSize: width * 0.045,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',  // Buttons next to each other
    gap: 10,  // Space between buttons
  },
});