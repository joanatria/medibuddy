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
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

interface Caregiver {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  contact: string;
  relationship: string;
  notificationType: string;
}

type DropdownItem = {
  label: string;
  value: string;
};

export default function CaregiverTab() {
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [caregiverLastName, setCaregiverLastName] = useState('');
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [contact, setContact] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notificationType, setNotificationType] = useState('email'); // Default to email
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false); 

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
      notificationType,
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
      setNotificationType(caregiver.notificationType);
      setEditingId(caregiver.id);
    }
  };

  const clearForm = () => {
    setCaregiverFirstName('');
    setCaregiverLastName('');
    setContact('');
    setRelationship('');
    setEditingId(null);
    setNotificationType('email');
  };

  return (
    <View style={styles.container}>
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

      {/* Dropdown for Notification Type */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notification Method</Text>
        <DropDownPicker
          open={dropdownOpen}
          value={notificationType}
          items={[
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Mobile Notification', value: 'mobile' },
          ]}
          setOpen={setDropdownOpen}  // Make sure the dropdown toggle is controlled
          setValue={setNotificationType}  // Set the selected value
          setItems={() => {}}
          containerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
          textStyle={styles.dropdownText}  // Added styling for dropdown text
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCaregiver}>
          <Text style={styles.buttonText}>{editingId ? 'Update Caregiver' : 'Add Caregiver'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
          <Text style={styles.buttonText}>Clear Form</Text>
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
                <Text style={styles.caregiverText}>Notification: {item.notificationType}</Text>
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
    </View>
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
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 15,
    backgroundColor: '#FFF',
    fontSize: width * 0.04,
  },
  dropdownContainer: {
    height: 40,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: width * 0.04,
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderColor: '#ccc',
  },
  dropdownText: {
    fontSize: width * 0.04, 
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
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  caregiverText: {
    fontSize: width * 0.04,
  },
  actionButtons: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.03,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: width * 0.04,
    color: '#777',
  },
});