import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleRegister = () => {
    const { username, email, password, firstName, lastName, phoneNumber } = formData;

    if (!username || !email || !password || !firstName || !lastName || !phoneNumber) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }

    Alert.alert('Registration Successful', `Welcome, ${firstName}!`);
    router.replace("/(tabs)"); // Navigate to the home screen after successful registration
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Create Your Account</Text>

      {/* Username */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Username*</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={formData.username}
          onChangeText={(text) => handleInputChange('username', text)}
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Email */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address*</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* First Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>First Name*</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={formData.firstName}
          onChangeText={(text) => handleInputChange('firstName', text)}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Middle Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Middle Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Middle Name"
          value={formData.middleName}
          onChangeText={(text) => handleInputChange('middleName', text)}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Last Name */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Last Name*</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={formData.lastName}
          onChangeText={(text) => handleInputChange('lastName', text)}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Phone Number */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number*</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Password */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Password*</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={formData.password}
          onChangeText={(text) => handleInputChange('password', text)}
          secureTextEntry
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>

      {/* Footer Text */}
      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text style={styles.link} onPress={() => router.push('/')}>
          Login
        </Text>
      </Text>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingBottom: 100,
  },
  heading: {
    marginTop: 35,
    fontSize: width * 0.06,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: width * 0.045,
    color: '#333',
  },
  registerButton: {
    width: '90%',
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 16,
    fontSize: width * 0.04,
    color: '#666',
  },
  link: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  formGroup: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: width * 0.05,
    marginBottom: 3,
    fontWeight: '600',
    color: '#333',
  },
});