import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: 'currentUsername', 
    email: 'currentEmail@example.com',
    firstName: 'John',
    middleName: 'Doe',
    lastName: 'Smith',
    phoneNumber: '1234567890',
  });

  const handleInputChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleUpdateProfile = () => {
    const { username, email, firstName, lastName, phoneNumber } = formData;

    if (!username || !email || !firstName || !lastName || !phoneNumber) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }

    Alert.alert('Profile Updated', `Your profile has been updated successfully, ${firstName}!`);
    router.push("/(tabs)/explore"); 
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      <Text style={styles.heading}>Edit Your Profile</Text>

      {/* Username */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Username</Text>
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
        <Text style={styles.label}>Email Address</Text>
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
        <Text style={styles.label}>First Name</Text>
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
        <Text style={styles.label}>Last Name</Text>
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
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChangeText={(text) => handleInputChange('phoneNumber', text)}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Update Button */}
      <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile}>
        <Text style={styles.updateButtonText}>Update Profile</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'flex-start', 
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  heading: {
    paddingTop: 40,
    fontSize: width * 0.05,
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
  updateButton: {
    width: '100%',  
    paddingVertical: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24, 
  },
  updateButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
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
