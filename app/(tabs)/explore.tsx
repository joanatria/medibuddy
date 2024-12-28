import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  details: string;
  availability: boolean;
}

const predefinedPharmacies = [
  { id: '1', name: 'Community Pharmacy', address: '123 Main Street, Cityville' },
  { id: '2', name: 'HealthMart Pharmacy', address: '456 Elm Road, Townsville' },
];

const predefinedMedicines: Medicine[] = [
  { id: '1', name: 'Paracetamol', quantity: 50, details: 'Pain reliever', availability: true },
  { id: '2', name: 'Ibuprofen', quantity: 30, details: 'Anti-inflammatory', availability: true },
  { id: '3', name: 'Amoxicillin', quantity: 0, details: 'Antibiotic', availability: false },
];

export default function PharmacyPage() {
  const [selectedPharmacy, setSelectedPharmacy] = useState(predefinedPharmacies[0].id);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const handleSelectMedicine = (id: string) => {
    const medicine = predefinedMedicines.find((med) => med.id === id);
    if (medicine) {
      const isAlreadyAdded = medicines.some((med) => med.id === medicine.id);
      if (isAlreadyAdded) {
        Alert.alert('Error', 'Medicine is already in the list.');
        return;
      }

      setMedicines((prev) => [...prev, medicine]);
      Alert.alert('Success', 'Medicine added to your refill list.');
    }
  };

  const handleRefillMedicines = () => {
    if (medicines.length === 0) {
      Alert.alert('No Medicines', 'Please select medicines to refill.');
      return;
    }

    Alert.alert(
      'Refill Success',
      `Medicines refilled successfully at ${predefinedPharmacies.find(
        (ph) => ph.id === selectedPharmacy
      )?.name}.`
    );
    setMedicines([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Pharmacy Refill</Text>

      {/* Pharmacy Selector */}
      <Text style={styles.sectionTitle}>Select Pharmacy</Text>
        <View style={styles.formGroup}>
        <Picker
          selectedValue={selectedPharmacy}
          onValueChange={(itemValue) => setSelectedPharmacy(itemValue)}
          style={styles.picker}
          itemStyle={{ color: 'black' }} 
        >
          {predefinedPharmacies.map((pharmacy) => (
            <Picker.Item
              key={pharmacy.id}
              label={`${pharmacy.name} (${pharmacy.address})`}
              value={pharmacy.id}
              style={{ color: 'black' }} 
            />
          ))}
        </Picker>
      </View>

      {/* Medicine Selector */}
      <Text style={styles.sectionTitle}>Select Medicine</Text>
      <View style={styles.formGroup}>
        <Picker
          selectedValue={selectedMedicine}
          onValueChange={(itemValue) => {
            setSelectedMedicine(itemValue);
            handleSelectMedicine(itemValue);
          }}
          itemStyle={{ color: 'black' }} 
          style={styles.picker}
        >
          <Picker.Item label="Select a medicine" value="" />
          {predefinedMedicines.map((medicine) => (
            <Picker.Item
              key={medicine.id}
              label={`${medicine.name} (${medicine.quantity} available)`}
              value={medicine.id}
              style={{ color: 'black' }} 
            />
          ))}
        </Picker>
      </View>

      {/* Refill List */}
      <Text style={styles.sectionTitle}>Selected Medicines</Text>
      {medicines.length > 0 ? (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.medicineItem}>
              <Text style={styles.medicineText}>Name: {item.name}</Text>
              <Text style={styles.medicineText}>Details: {item.details}</Text>
              <Text style={styles.medicineText}>Availability: {item.availability ? 'In Stock' : 'Out of Stock'}</Text>
            </View>
          )}
          nestedScrollEnabled={true}
        />
      ) : (
        <Text style={styles.noDataText}>No medicines selected yet.</Text>
      )}

      {/* Refill Button */}
      <TouchableOpacity style={styles.refillButton} onPress={handleRefillMedicines}>
        <Text style={styles.buttonText}>Refill Medicines</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 80,
  },
  heading: {
    marginTop: 35,
    textAlign: 'center',
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#FFF',
    color: '#000000'
  },
  medicineItem: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 10,
  },
  medicineText: {
    fontSize: width * 0.045,
  },
  refillButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: width * 0.04,
    color: '#666',
    marginVertical: 20,
  },
});