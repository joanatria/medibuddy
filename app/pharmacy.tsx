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
} from "react-native";
import { useRouter } from "expo-router";
import { PharmacySchema } from "@/validation/pharmacy";
import { PharmMedSchema } from "@/validation/pharmmed";
import { Ionicons } from "@expo/vector-icons";
import { set } from "zod";

export default function PharmacyPage({ navigation }: any) {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<PharmMedSchema[]>([]);
  const [medicines, setMedicines] = useState<PharmMedSchema[]>([]);
  const [selectedMedicine, setSelectedMedicine] =
    useState<PharmMedSchema | null>(null);
  const [pillsNeeded, setPillsNeeded] = useState<number | null>(null);
  const [pharmacies, setPharmacies] = useState<PharmacySchema[]>([]);

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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(tabs)/explore")}
      >
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Pharmacy Refill</Text>
      <Text style={styles.sectionTitle}>Pharmacies</Text>
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
              {item.medicines.map((medicine) => (
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
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>
          No results found. Try another search.
        </Text>
      )}

      {selectedMedicine && (
        <>
          <Text style={styles.sectionTitle}>Refill Selected Medicine</Text>
          <Text style={styles.medicineText}>
            Medicine: {selectedMedicine.name}
          </Text>
          <Text style={styles.medicineText}>
            Available Quantity: {selectedMedicine.qty}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Enter number of pills needed"
            placeholderTextColor="#5A5A5A"
            value={pillsNeeded?.toString() || ""}
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
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
    padding: 16,
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  pharmacyText: {
    fontSize: width * 0.045,
    color: "#495057",
    fontWeight: "bold",
  },
});
