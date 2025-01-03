import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function EditProfileScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstName: "",
    middleName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch user ID from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        const numberId = id ? Number(id) : null;
        setUserId(numberId);
      } catch (error) {
        console.error("Error fetching userId from AsyncStorage", error);
      }
    };
    fetchUserId();
  }, []);

  // Fetch user data when userId is set
  useEffect(() => {
    const fetchUserData = async (id: number) => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}user/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        setFormData({
          username: data.username || "",
          email: data.email || "",
          firstName: data.firstName || "",
          middleName: data.middleName || "",
          lastName: data.lastName || "",
          phoneNumber: data.phoneNumber || "",
        });
      } catch (error) {
        Alert.alert("Error", "Failed to fetch user data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (userId !== null) {
      fetchUserData(userId);
    }
  }, [userId]);

  const handleInputChange = (key: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleUpdateProfile = async () => {
    const { username, email, firstName, lastName, phoneNumber } = formData;

    if (!username || !email || !firstName || !lastName || !phoneNumber) {
      Alert.alert("Error", "Please fill out all required fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}update-user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();
      Alert.alert("Success", `Your profile has been updated successfully, ${data.firstName}!`);
      router.push("/(tabs)/explore");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push("/(tabs)/explore")}
      >
        <Text style={styles.backButtonText}>← </Text>
      </TouchableOpacity>

      <Text style={styles.title}>Edit Profile</Text>
      {Object.keys(formData).map((key) => (
        <View key={key} style={styles.formGroup}>
          <Text style={styles.label}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
          <TextInput
            style={styles.input}
            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
            value={formData[key as keyof typeof formData]}
            onChangeText={(value) => handleInputChange(key as keyof typeof formData, value)}
          />
        </View>
      ))}
      <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
        <Text style={styles.buttonText}>Update Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingBottom: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  formGroup: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: width * 0.05,
    marginBottom: 3,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    fontSize: width * 0.045,
    color: "#333",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    width: "90%",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "bold",
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
});