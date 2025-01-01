import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from "expo-router";

// Example interfaces
interface Pharmacy {
  id: string;
  name: string;
  address: string;
}

interface Medicine {
  id: string;
  name: string;
  quantity: number;
  pharmacyId: string;
}

export default function PharmacyPage({ navigation }: any) {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [pillsNeeded, setPillsNeeded] = useState<number | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('http://localhost:8080/pharmacy');
      const data = await response.json();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    }
  };
  
  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://localhost:8080/pharmed`);
      const allMedicines = await response.json();
      const filteredMedicines = allMedicines.filter((medicine: any) =>
        medicine.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setSearchResults(filteredMedicines);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const handleSelectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setPillsNeeded(null);
  };

  const handleRefill = () => {
    if (!selectedMedicine || !pillsNeeded) {
      Alert.alert('Error', 'Please select a medicine and specify the number of pills needed.');
      return;
    }

    if (pillsNeeded > selectedMedicine.quantity) {
      Alert.alert(
        'Error',
        `Only ${selectedMedicine.quantity} pills are available for ${selectedMedicine.name}.`
      );
      return;
    }

    const pharmacy = pharmacies.find((ph) => ph.id === selectedMedicine.pharmacyId);
    Alert.alert(
      'Refill Success',
      `Refilled ${pillsNeeded} pills of ${selectedMedicine.name} at ${pharmacy?.name}.`
    );

    setSelectedMedicine(null);
    setPillsNeeded(null);
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(tabs)/explore")}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Pharmacy Refill</Text>

      {/* Medicine Search */}
      <Text style={styles.sectionTitle}>Search for a Medicine</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Enter medicine name"
        placeholderTextColor="#5A5A5A"
        value={searchText}
        onChangeText={setSearchText}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {/* Search Results */}
      <Text style={styles.sectionTitle}>Search Results</Text>
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.medicineItem}
              onPress={() => handleSelectMedicine(item)}
            >
              <Text style={styles.medicineText}>Name: {item.name}</Text>
              <Text style={styles.medicineText}>Quantity: {item.quantity}</Text>
              <Text style={styles.medicineText}>
                Pharmacy: {pharmacies.find((ph) => ph.id === item.pharmacyId)?.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No results found. Try another search.</Text>
      )}

      {/* Refill Section */}
      {selectedMedicine && (
        <>
          <Text style={styles.sectionTitle}>Refill Selected Medicine</Text>
          <Text style={styles.medicineText}>Medicine: {selectedMedicine.name}</Text>
          <Text style={styles.medicineText}>
            Available Quantity: {selectedMedicine.quantity}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter number of pills needed"
            placeholderTextColor="#5A5A5A"
            value={pillsNeeded?.toString() || ''}
            onChangeText={(text) => setPillsNeeded(Number(text))}
          />
          <TouchableOpacity style={styles.refillButton} onPress={handleRefill}>
            <Text style={styles.buttonText}>Refill</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingBottom: 100,
  },
  heading: {
    marginTop: 40,
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: width * 0.04,
  },
  searchButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
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
  noDataText: {
    textAlign: 'center',
    fontSize: width * 0.04,
    color: '#666',
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: width * 0.04,
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
  backButtonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 16,
    padding: 10,
  },
});
