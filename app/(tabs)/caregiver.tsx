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

interface Caregiver {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  contact: string;
  relationship: string;
}

export default function CaregiverTab() {
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [caregiverLastName, setCaregiverLastName] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [contact, setContact] = useState('');
  const [relationship, setRelationship] = useState('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddCaregiver = () => {
    if (!caregiverFirstName.trim()) {
      Alert.alert('Invalid Input', 'First name is required.');
      return;
    }
    if (!caregiverLastName.trim()) {
      Alert.alert('Invalid Input', 'Last name is required.');
      return;
    }
    if (!contact.trim()) {
      Alert.alert('Invalid Input', 'Contact information is required.');
      return;
    }
    if (!relationship.trim()) {
      Alert.alert('Invalid Input', 'Relationship is required.');
      return;
    }

    const newCaregiver = {
      id: editingId || Date.now().toString(),
      firstname: caregiverFirstName.trim(),
      lastname: caregiverLastName.trim(),
      email: caregiverEmail,
      contact: contact.trim(),
      relationship: relationship.trim(),
    };

    setCaregivers((prev) =>
      editingId
        ? prev.map((cg) => (cg.id === editingId ? newCaregiver : cg))
        : [...prev, newCaregiver]
    );

    clearForm();
    Alert.alert('Success', editingId ? 'Caregiver updated successfully!' : 'Caregiver added successfully!');
  };

  const handleDeleteCaregiver = (id: string) => {
    setCaregivers((prev) => prev.filter((cg) => cg.id !== id));
    Alert.alert('Success', 'Caregiver deleted.');
  };

  const handleEditCaregiver = (id: string) => {
    const caregiver = caregivers.find((cg) => cg.id === id);
    if (caregiver) {
      setCaregiverFirstName(caregiver.firstname);
      setCaregiverLastName(caregiver.lastname);
      setContact(caregiver.contact);
      setRelationship(caregiver.relationship);
      setEditingId(caregiver.id);
    }
  };

  const clearForm = () => {
    setCaregiverFirstName('');
    setCaregiverLastName('');
    setContact('');
    setRelationship('');
    setEditingId(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{editingId ? 'Edit Caregiver' : 'Add Caregiver'}</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#5A5A5A"
          value={caregiverFirstName}
          onChangeText={setCaregiverFirstName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#5A5A5A"
          value={caregiverLastName}
          onChangeText={setCaregiverLastName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#5A5A5A"
          value={caregiverEmail}
          onChangeText={setCaregiverEmail}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Contact</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter contact number"
          placeholderTextColor="#5A5A5A"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Relationship</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter relationship (e.g., parent, sibling)"
          placeholderTextColor="#5A5A5A"
          value={relationship}
          onChangeText={setRelationship}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCaregiver}>
          <Text style={styles.buttonText}>{editingId ? 'Update' : 'Add'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Caregivers</Text>
      {caregivers.length > 0 ? (
        <FlatList
          data={caregivers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.caregiverItem}>
              <View>
                <Text style={styles.caregiverText}>{item.firstname}</Text>
                <Text style={styles.caregiverText}>{item.lastname}</Text>
                <Text style={styles.caregiverText}>{item.email}</Text>
                <Text style={styles.caregiverText}>Contact: {item.contact}</Text>
                <Text style={styles.caregiverText}>Relationship: {item.relationship}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditCaregiver(item.id)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteCaregiver(item.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No caregivers added yet.</Text>
      )}
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
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: width * 0.05,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#FFF',
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
    fontSize: width * 0.04,
  },
  caregiverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 10,
  },
  caregiverText: {
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
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
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
});
