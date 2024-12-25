import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  numTablets: string;
  time: string;
}

export default function MedicationTab() {
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [numTablets, setNumTablets] = useState('');
  const [time, setTime] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [editingId, setEditingId] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleAddMedication = () => {
    if (!medicationName.trim()) {
      Alert.alert('Invalid Input', 'Medication name is required.');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Invalid Input', 'Dosage is required.');
      return;
    }
    if (!numTablets.trim()) {
      Alert.alert('Invalid Input', 'Number of tablets is required.');
      return;
    }
    if (timeSlots.length === 0) {
      Alert.alert('Invalid Input', 'At least one time slot is required.');
      return;
    }

    const newMedication = {
      id: editingId || Date.now().toString(),
      name: medicationName.trim(),
      dosage: `${dosage} mg`,
      numTablets: numTablets.trim(),
      time: timeSlots.join(', '),
    };

    setMedications((prev) =>
      editingId
        ? prev.map((med) => (med.id === editingId ? newMedication : med))
        : [...prev, newMedication]
    );

    clearForm();
    Alert.alert('Success', editingId ? 'Medication updated successfully!' : 'Medication added successfully!');
  };

  const handleDeleteMedication = (id) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
    Alert.alert('Success', 'Medication deleted.');
  };

  const handleEditMedication = (id) => {
    const med = medications.find((med) => med.id === id);
    if (med) {
      setMedicationName(med.name);
      setDosage(med.dosage.replace(' mg', ''));
      setNumTablets(med.numTablets);
      setTimeSlots(med.time.split(', '));
      setEditingId(med.id);
    }
  };

  const handleAddTimeSlot = () => {
    const tabletCount = parseInt(numTablets, 10); 
    if (tabletCount <= 1 && timeSlots.length >= 1) {
      alert("You can only add one time slot for a single tablet.");
      return;
    }
    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeSlots([...timeSlots, formattedTime]);
  };

  const handleRemoveTimeSlot = (index) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setMedicationName('');
    setDosage('');
    setNumTablets('');
    setTime(new Date());
    setTimeSlots([]);
    setEditingId(null);
    setShowTimePicker(false);
  };

  return (
  <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.heading}>{editingId ? 'Edit Medication' : 'Add Medication'}</Text>

    <View style={styles.formGroup}>
      <Text style={styles.label}>Medication Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter medication name"
        placeholderTextColor="#5A5A5A"
        value={medicationName}
        onChangeText={setMedicationName}
      />
    </View>

    <View style={styles.formGroup}>
      <Text style={styles.label}>Dosage (mg)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 500"
        placeholderTextColor="#5A5A5A"
        value={dosage}
        onChangeText={(text) => setDosage(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
    </View>

    <View style={styles.formGroup}>
      <Text style={styles.label}>Number of Tablets</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 1"
        placeholderTextColor="#5A5A5A"
        value={numTablets}
        onChangeText={(text) => setNumTablets(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
      />
    </View>

    <View style={styles.formGroup}>
      <Text style={styles.label}>Time Slots</Text>
      <View style={styles.timeInputContainer}>
    {/* Time Picker Button */}
    <TouchableOpacity
      onPress={() => setShowTimePicker(true)}
      style={[styles.input, styles.timeInput]}
    >
      <Text style={styles.timeText}>
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>

    {/* Time Picker Modal */}
    {showTimePicker && (
      <DateTimePicker
        value={time}
        mode="time"
        is24Hour={false}
        display="spinner"
        onChange={(event, selectedTime) => {
          setShowTimePicker(false);
          if (selectedTime) setTime(selectedTime);
        }}
      />
    )}

    {/* Add Time Slot Button */}
    <TouchableOpacity
      style={[
        styles.addTimeButton,
        timeSlots.length < numTablets ? {} : { backgroundColor: '#ccc' },
      ]}
      onPress={handleAddTimeSlot}
      disabled={timeSlots.length >= numTablets}
    >
      <Text style={styles.plusText}>+</Text>
    </TouchableOpacity>
    </View>

  {/* Validation Message */}
  {timeSlots.length >= numTablets && (
    <Text style={{ color: 'red', marginTop: 5 }}>
      Time slots cannot exceed the number of tablets.
    </Text>
  )}

  {/* Render Time Slots */}
  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
    {timeSlots.map((item, index) => (
      <View key={`${item}-${index}`} style={styles.timeSlotItem}>
        <Text style={styles.timeSlotText}>{item}</Text>
        <TouchableOpacity onPress={() => handleRemoveTimeSlot(index)}>
          <Text style={styles.removeTimeSlotText}>x</Text>
        </TouchableOpacity>
      </View>
    ))}
  </ScrollView>
</View>


    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.addButton} onPress={handleAddMedication}>
        <Text style={styles.buttonText}>{editingId ? 'Update Medication' : 'Add Medication'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
        <Text style={styles.buttonText}>Clear Form</Text>
      </TouchableOpacity>
    </View>

    <Text style={styles.heading}>Medications</Text>
    {medications.length > 0 ? (
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.medicationItem}>
            <View style={styles.medicationDetails}>
              <Text style={styles.medicationText}>
                {item.name} - {item.dosage}, {item.numTablets} tablet(s)
              </Text>
              <Text style={styles.timeSlotsText}>Time Slots: {item.time.join(', ')}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => handleEditMedication(item.id)}
              >
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteMedication(item.id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    ) : (
      <Text style={styles.noDataText}>No medications added yet.</Text>
    )}
  </ScrollView>
  );
}
    

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    padding: 22,
    backgroundColor: '#F5F5F5',
  },
  heading: {
    marginTop: 35,
    textAlign: 'center',
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: width * 0.05,
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#FFF',
    fontSize: width * 0.04,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    marginRight: 10,
    fontSize: width * 0.04,
  },
  timeText: {
    color: '#333',
  },
  addTimeButton: {
    backgroundColor: '#0066CC',
    padding: 10,
    borderRadius: 5,
  },
  plusText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
    padding: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  timeSlotText: {
    fontSize: width * 0.04,
    color: '#333',
  },
  removeTimeSlotText: {
    color: 'red',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  clearButton: {
    backgroundColor: '#ffc107',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: width*0.04,
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
    position: 'relative',
  },
  medicationDetails: {
    paddingBottom: 45, 
  },
  medicationText: {
    fontSize: width * 0.05,
    fontWeight: '600',
  },
  timeSlotsText: {
    marginTop: 5,
    fontSize: width * 0.045,
    color: '#666',
  },
  actionButtons: {
    position: 'absolute',
    marginTop: 15,
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
});