import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from "expo-router";
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome icons

export default function Settings() {
  const router = useRouter();

  // Handle logout confirmation
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => console.log('Logged out') },
      ]
    );
  };

  // Handle report generation confirmation
  const handleGenerateReport = () => {
    Alert.alert(
      'Generate Report',
      'Are you sure you want to generate the report?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => console.log('Report generated') },
      ]
    );
  };

  // Navigate to the "Edit Profile" page
  const navigateToEditProfile = () => {
    console.log('Navigating to Edit Profile');
    // Use navigation logic here, e.g., navigation.navigate('EditProfile')
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      {/* Generate Report */}
      <TouchableOpacity onPress={handleGenerateReport}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <FontAwesome name="file-text" size={24} color="#000" style={styles.icon} />
            <Text style={styles.optionText}>Generate Report</Text>
            <Text style={styles.arrowText}>{'>'}</Text>
          </View>
          <Text style={styles.optionDescription}>Generate a report for user medications.</Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>

      {/* Check Pharmacies */}
      <TouchableOpacity onPress={() => router.push("/pharmacy")}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <FontAwesome name="hospital-o" size={24} color="#000" style={styles.icon} />
            <Text style={styles.optionText}>Check Pharmacies</Text>
            <Text style={styles.arrowText}>{'>'}</Text>
          </View>
          <Text style={styles.optionDescription}>View available pharmacies and their available medicine.</Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>

      {/* Edit Profile */}
      <TouchableOpacity onPress={navigateToEditProfile}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <FontAwesome name="user" size={24} color="#000" style={styles.icon} /> {/* Profile icon */}
            <Text style={styles.optionText}>Edit Profile</Text>
            <Text style={styles.arrowText}>{'>'}</Text>
          </View>
          <Text style={styles.optionDescription}>Update your personal and account information.</Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <FontAwesome name="sign-out" size={24} color="#000" style={styles.icon} />
            <Text style={styles.optionText}>Logout</Text>
            <Text style={styles.arrowText}>{'>'}</Text>
          </View>
          <Text style={styles.optionDescription}>Sign out of your account.</Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>
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
    marginTop: 35,
    textAlign: 'center',
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  optionContainer: {
    paddingVertical: 15,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center', // Align icon and text horizontally
  },
  optionText: {
    color: '#000',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    flex: 1, // This ensures text takes up available space
  },
  arrowText: {
    color: '#666',
    fontSize: width * 0.035,
    textAlign: 'right', // Align arrow text to the right
    paddingTop: 8,
  },
  optionDescription: {
    color: '#666',
    fontSize: width * 0.035,
    textAlign: 'left',
    marginTop: 5,
  },
  separator: {
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  icon: {
    marginRight: 10, // Space between icon and text
  },
});