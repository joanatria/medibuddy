import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  useEffect(() => {
    const checkUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          router.replace("/(tabs)");
        }
      } catch (e) {
        console.error("Failed to fetch user ID from storage", e);
      }
    };

    checkUserId();
  }, []);

  const handleLogin = async () => {
    if (username && password) {
      try {
        const response = await fetch(
          `${apiUrl}login?identifier=${username}&password=${password}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.text();
          try {
            await AsyncStorage.setItem("userId", data);
          } catch (e) {
            Alert.alert("Error", "Account key cannot be stored.");
          }
          Alert.alert("Login Successful", `Welcome, ${username}!`);
          router.replace("/(tabs)");
        } else {
          const errorData = await response.text();
          Alert.alert("Error", errorData || "Login failed. Please try again.");
        }
      } catch (error) {
        Alert.alert("Error", "An unexpected error occurred. Please try again.");
      }
    } else {
      Alert.alert("Error", "Please enter both username and password.");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.heading}>
        <Text>Welcome to </Text>
        <Text style={{ color: "#30b4c1" }}>Medi</Text>
        <Text style={{ color: "#f6794f" }}>B</Text>
        <Text style={{ color: "#1c3f49" }}>uddy</Text>
        <Text style={styles.heading}>!</Text>
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Don't have an account?{" "}
        <Text style={styles.link} onPress={() => router.push("/registration")}>
          Register
        </Text>
      </Text>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  logo: {
    width: width * 0.4, 
    height: width * 0.4, 
    resizeMode: "contain",
  },
  container: {
    marginTop: -30,
    flex: 1,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: width * 0.065,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
    marginTop: -30,
  },
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    fontSize: width * 0.045,
    color: "#333",
  },
  loginButton: {
    width: "90%",
    paddingVertical: 12,
    backgroundColor: "#30b4c1",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  footerText: {
    marginTop: 16,
    fontSize: width * 0.04,
    color: "#666",
  },
  link: {
    color: "#30b4c1",
    fontWeight: "bold",
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
});
