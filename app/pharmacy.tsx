import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { PharmacySchema } from "@/validation/pharmacy";
import { PharmMedSchema } from "@/validation/pharmmed";
import { Ionicons } from "@expo/vector-icons";

export default function PharmacyPage({ navigation }: any) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<PharmMedSchema[]>([]);
  const [medicines, setMedicines] = useState<PharmMedSchema[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<PharmMedSchema | null>(null);
  const [pillsNeeded, setPillsNeeded] = useState<number | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacySchema[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacySchema | null>(null);

  const fetchPharmacies = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}pharmacy`
      );
      const data = await response.json();
      setPharmacies(data);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}pharmed`);
      const allMedicines = await response.json();
      setMedicines(allMedicines);
      setSearchResults(allMedicines);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  useEffect(() => {
    fetchPharmacies();
    fetchMedicines();
  }, []);

  const handleSearch = (text: string) => {
    if (searchText.trim() === "") {
      setSearchResults(medicines);
      return;
    }
    const filteredMedicines = medicines.filter((medicine) => {
      const pharmacy = pharmacies.find((ph) => ph.pharmId === medicine.pharmId);
      return (
        medicine.name.toLowerCase().includes(text.toLowerCase()) ||
        (pharmacy && pharmacy.name.toLowerCase().includes(text.toLowerCase()))
      );
    });
    setSearchResults(filteredMedicines);
  };

  const handleSelectMedicine = (medicine: PharmMedSchema) => {
    setSelectedMedicine(medicine);
    setPillsNeeded(null);
  };

  const handleRefill = () => {
    if (!selectedMedicine || !pillsNeeded) {
      Alert.alert(
        "Error",
        "Please select a medicine and specify the number of pills needed."
      );
      return;
    }

    if (pillsNeeded > (selectedMedicine.qty ?? 0)) {
      Alert.alert(
        "Error",
        `Only ${selectedMedicine.qty} pills are available for ${selectedMedicine.name}.`
      );
      return;
    }

    const pharmacy = pharmacies.find(
      (ph) => ph.pharmId === selectedMedicine.pharmId
    );
    Alert.alert(
      "Refill Success",
      `Refilled ${pillsNeeded} pills of ${selectedMedicine.name} at ${pharmacy?.name}.`
    );

    setSelectedMedicine(null);
    setPillsNeeded(null);
  };

  const groupedMedicines = searchResults.reduce(
    (
      acc: {
        [key: number]: {
          pharmacy: PharmacySchema;
          medicines: PharmMedSchema[];
        };
      },
      medicine
    ) => {
      const pharmacy = pharmacies.find((ph) => ph.pharmId === medicine.pharmId);
      if (pharmacy) {
        // Ensure that medicines are added to the pharmacy object in the accumulator
        if (!acc[pharmacy.pharmId]) {
          acc[pharmacy.pharmId] = {
            pharmacy,
            medicines: [],
          };
        }
        acc[pharmacy.pharmId].medicines.push(medicine);
      }
      return acc;
    },
    {}
  );

  const [selectedPharmacyMedicines, setSelectedPharmacyMedicines] = useState<PharmMedSchema[]>([]);

  const openModal = (pharmacy: PharmacySchema) => {
    setSelectedPharmacy(pharmacy);
    const pharmacyMedicines = searchResults.filter(
      (medicine) => medicine.pharmId === pharmacy.pharmId
    );
    setSelectedPharmacyMedicines(pharmacyMedicines);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPharmacy(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(tabs)/explore")}
      >
        <Text style={styles.backButtonText}>← </Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Pharmacy</Text>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#5A5A5A"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter medicine or pharmacy name"
          placeholderTextColor="#5A5A5A"
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            handleSearch(text);
          }}
        />
      </View>
      {Object.keys(groupedMedicines).length > 0 ? (
        <FlatList
          data={Object.values(groupedMedicines)}
          keyExtractor={(item) => item.pharmacy.pharmId.toString()}
          renderItem={({ item }) => (
            <View style={styles.pharmacyItem}>
              <Text style={styles.pharmacyText}>
                Pharmacy: {item.pharmacy.name}
              </Text>
              <Text style={styles.pharmacyText}>
                Address: {item.pharmacy.address}
              </Text>
              {item.medicines.slice(0, 2).map((medicine) => (
                <TouchableOpacity
                  key={medicine.pmedId}
                  style={styles.medicineItem}
                  onPress={() => handleSelectMedicine(medicine)}
                >
                  <Text style={styles.medicineText}>Name: {medicine.name}</Text>
                  <Text style={styles.medicineText}>
                    Quantity: {medicine.qty}
                  </Text>
                </TouchableOpacity>
              ))}
              {item.medicines.length > 2 && (
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() => openModal(item.pharmacy)}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>
          No results found. Try another search.
        </Text>
      )}

      {/* Modal to show all medicines in a pharmacy */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Medicines at {selectedPharmacy?.name}</Text>
            <FlatList
              data={selectedPharmacyMedicines}
              keyExtractor={(medicine) => medicine.pmedId?.toString() || ''}
              renderItem={({ item }) => (
                <View style={styles.medicineItem}>
                  <Text style={styles.medicineText}>Name: {item.name}</Text>
                  <Text style={styles.medicineText}>Quantity: {item.qty}</Text>
                </View>
              )}
            />
            <Pressable onPress={closeModal} style={styles.closeModalButton}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f9fa",
    paddingBottom: 100,
  },
  heading: {
    marginTop: 40,
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#343a40",
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#495057",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: width * 0.04,
  },
  searchButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  medicineItem: {
    padding: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#868e96",
  },
  medicineText: {
    fontSize: width * 0.045,
    color: "#495057",
  },
  noDataText: {
    textAlign: "center",
    fontSize: width * 0.04,
    color: "#868e96",
    marginVertical: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: width * 0.04,
    backgroundColor: "#fff",
  },
  refillButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  backButtonText: {
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  backButton: {
    position: "absolute",
    top: 35,
    left: 16,
    padding: 10,
  },
  pharmacyItem: {
    padding: 20,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  pharmacyText: {
    fontSize: width * 0.045,
    color: "#495057",
    fontWeight: "bold",
    marginBottom: 7,
  },
  seeAllButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
    marginTop: 10,
  },
  seeAllText: {
    color: "#fff",
    textAlign: "center",
    fontSize: width*0.04,
    fontWeight: 600,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: width * 0.92,
  },
  modalTitle: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: 10,
  },
  closeModalButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  closeModalButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: width*0.038,
    fontWeight: 600,
  },
});
