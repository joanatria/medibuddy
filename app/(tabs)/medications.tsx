import React, { useState } from "react";
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
  Button,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import DropDownPicker from 'react-native-dropdown-picker';

interface Medication {
  id: string;
  name: string;
  description: string;
  instructions: string;
  dose: string;
  numTablets: string;
  intTablets: string;
  currTablets: string;
  unit: string;
  time: string;
  attachment?: Attachment;
  notificationType: string;
  notificationDetails: string[];
  days: string;
}
interface Attachment {
  uri: string;
  name: string;
  size?: number;
  type: string;
}
export default function MedicationTab() {
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState("");
  const [numTablets, setNumTablets] = useState("");
  const [intTablets, setIntTablets] = useState("");
  const [currTablets, setCurrTablets] = useState("");
  const [unit, setUnit] = useState("");
  const [time, setTime] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [notificationType, setNotificationType] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationDetails, setNotificationDetails] = useState<string[]>([]);
  const [days, setDays] = useState("");
  const [dayOption, setDayOption] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false); 
  const [isEveryHours, setIsEveryHours] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [intervalHours, setIntervalHours] = useState("");
  

  const handleCheckboxChange = (value: string) => {
    if (notificationDetails.includes(value)) {
      setNotificationDetails(
        notificationDetails.filter((item) => item !== value)
      );
    } else {
      setNotificationDetails([...notificationDetails, value]);
    }
  };

  const handleDaySelect = (day: string) => {
    setDays((prevDays) => {
      const newDays = [...prevDays];
      if (newDays.includes(day)) {
        newDays.splice(newDays.indexOf(day), 1); // Remove day if already selected
      } else {
        newDays.push(day); // Add day if not selected
      }
      return newDays;
    });
  };

  const handleAttachRecording = async () => {
    try {
      const result: DocumentPicker.DocumentPickerResult =
        await DocumentPicker.getDocumentAsync({
          type: "audio/*",
          copyToCacheDirectory: true,
        });

      // Type guard to check if the result is a success
      if (result.assets && result.assets.length > 0) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType || "audio", // Fallback for MIME type
        }));
        // Assuming you want to set the first attachment
        setAttachment(newAttachments[0]);
        Alert.alert("Success", "Attachment added successfully!");
      } else {
        // Handle cancellation case
        Alert.alert("Cancelled", "No file was selected.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to attach recording.");
    }
  };

  const handleDeleteMedication = (id: string) => {
    setMedications((prev) => prev.filter((med) => med.id !== id));
    Alert.alert("Success", "Medication deleted successfully!");
  };

  const handleEditMedication = (id: string) => {
    const medication = medications.find((med) => med.id === id);
    if (medication) {
      setMedicationName(medication.name);
      setDescription(medication.description);
      setInstructions(medication.instructions);
      setDose(medication.dose);
      setNumTablets(medication.numTablets);
      setIntTablets(medication.intTablets);
      setCurrTablets(medication.currTablets);
      setUnit(medication.unit);
      setTimeSlots(medication.time.split(", "));
      setAttachment(medication.attachment || null);
      setNotificationType(medication.notificationType);
      setNotificationDetails(medication.notificationDetails);
      setDays(medication.days);
      setEditingId(medication.id);
    }
  };

  const handleAddMedication = () => {
    if (!medicationName.trim()) {
      Alert.alert("Invalid Input", "Medication name is required.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Invalid Input", "Description is required.");
      return;
    }
    if (!instructions.trim()) {
      Alert.alert("Invalid Input", "Instructions are required.");
      return;
    }
    if (!dose.trim()) {
      Alert.alert("Invalid Input", "Dose is required.");
      return;
    }
    if (!numTablets.trim()) {
      Alert.alert("Invalid Input", "Required number of tablets is required.");
      return;
    }
    if (!intTablets.trim()) {
      Alert.alert("Invalid Input", "Initial number of tablets is required.");
      return;
    }
    if (!currTablets.trim()) {
      Alert.alert("Invalid Input", "Current number of tablets is required.");
      return;
    }
    if (!unit.trim()) {
      Alert.alert("Invalid Input", "Unit is required.");
      return;
    }
    if (timeSlots.length === 0) {
      Alert.alert("Invalid Input", "At least one time slot is required.");
      return;
    }
    if (days.length === 0) {
      Alert.alert("Invalid Input", "At least one day is required.");
      return;
    }

    const newMedication = {
      id: editingId || Date.now().toString(),
      name: medicationName.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      dose: dose.trim(),
      numTablets: numTablets.trim(),
      intTablets: intTablets.trim(),
      currTablets: currTablets.trim(),
      unit: unit ? unit.trim() : "",
      time: timeSlots.join(", "),
      attachment: attachment || undefined,
      notificationType,
      notificationDetails,
      days,
    };

    setMedications((prev) =>
      editingId
        ? prev.map((med) => (med.id === editingId ? newMedication : med))
        : [...prev, newMedication]
    );

    clearForm();
    Alert.alert(
      "Success",
      editingId
        ? "Medication updated successfully!"
        : "Medication added successfully!"
    );
  };

  const handleAddTimeSlot = () => {
    const tabletCount = parseInt(numTablets, 10);
    if (tabletCount <= 1 && timeSlots.length >= 1) {
      alert("You can only add one time slot for a single tablet.");
      return;
    }
    const formattedTime = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setTimeSlots([...timeSlots, formattedTime]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setMedicationName("");
    setDescription("");
    setInstructions("");
    setDose("");
    setNumTablets("");
    setIntTablets("");
    setCurrTablets("");
    setUnit("");
    setTime(new Date());
    setTimeSlots([]);
    setAttachment(null);
    setNotificationType("");
    setNotificationDetails([]);
    setDays("");
    setEditingId(null);
    setShowTimePicker(false);
    setShowCalendar(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        {editingId ? "Edit Medication" : "Add Medication"}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Medication Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter medication name"
          placeholderTextColor="#5A5A5A"
          value={medicationName}
          onChangeText={setMedicationName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter description"
          placeholderTextColor="#5A5A5A"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.timeInputContainer}>
      <View style={[styles.formGroup, { flex: 1 }]}>
        <Text style={[styles.label, { marginBottom: 7 }]}>Quantity Bought</Text>
        <TextInput
          style={[styles.input, { padding: 13 }]}
          placeholder="e.g., 30"
          placeholderTextColor="#5A5A5A"
          value={intTablets}  
          onChangeText={(text) => setIntTablets(text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
        />
      </View>

      <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
        <Text style={styles.label}>Unit</Text>
        <DropDownPicker
          open={dropdownOpen}
          value={unit}
          items={[
            { label: 'mL', value: 'mL' },
            { label: 'pieces', value: 'pieces' },
          ]}
          setOpen={setDropdownOpen} 
          setValue={setUnit} 
          setItems={() => {}}
          containerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
          textStyle={styles.dropdownText} 
        />
      </View>
      </View>

      <View style={styles.timeInputContainer}>
        {/* Dosage Input */}
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.label, { marginBottom: 7 }]}>Dosage</Text>
          <TextInput
            style={[styles.input, { padding: 13 }]}
            placeholder="e.g., 30"
            placeholderTextColor="#5A5A5A"
            value={intTablets}
            onChangeText={(text) => setIntTablets(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>

        {/* Unit (readonly input) */}
        <View style={{ flex: 0.7 , marginLeft: 10, borderBottomWidth: 1, borderColor: '#ccc', marginTop: 18, width: 50 }}>
          <TextInput
            style={[styles.input, { padding: 10, borderColor: '#fff' }]}
            value={unit} 
            editable={false} 
          />
        </View>

        {/* "per take" text */}
        <View style={[styles.formGroup, { flex: 1.3 , justifyContent: "center", marginLeft: 10, marginTop: 55 }]}>
          <Text style={[{ marginBottom: 0, fontSize: 18, fontWeight: 500 }]}>per take</Text>
        </View>
      </View>

      <View style={styles.timeInputContainer}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={[styles.label, { marginBottom: 7 }]}>Instructions</Text>
          <TextInput
            style={[styles.input, { padding: 13 }]}
            placeholder="e.g., 30"
            placeholderTextColor="#5A5A5A"
            value={instructions}
            onChangeText={(text) => setInstructions(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, { flex: 1.2 , justifyContent: "center", marginLeft: 10, marginTop: 55 }]}>
          <Text style={[{ marginBottom: 0, fontSize: 18, fontWeight: 500 }]}>times a day for</Text>
        </View>

        <View style={{ flex: 0.4 , marginTop: 18}}>
          <TextInput
            style={[styles.input, { padding: 13 }]}
            placeholder="0"
            placeholderTextColor="#5A5A5A"
            value={days}  
            onChangeText={(text) => setDays(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
          />
        </View>

        <View style={[styles.formGroup, { flex: 0.5 , justifyContent: "center", marginLeft: 10, marginTop: 55 }]}>
          <Text style={[{ marginBottom: 0, fontSize: 18, fontWeight: 500 }]}>days</Text>
        </View>
      </View>

      {/* Day Option Selection */}
      <View style={styles.formGroup}>
        {["Daily", "Every other day"].map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.checkboxContainer}
            onPress={() => setDayOption(option)}
          >
            <Text style={styles.checkboxText}>
              {dayOption === option ? "✓ " : "○ "}
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    {/* Time Slot Selection */}
    <View style={styles.formGroup}>
      <Text style={styles.label}>Time Slot Selection</Text>

      {/* "Every ___ hrs starting __:___" option */}
      <TouchableOpacity onPress={() => setIsEveryHours(true)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}> 
        <Text style={styles.checkboxText}>
          {isEveryHours ? "✓ " : "○ "}Every
        </Text>

        <TextInput
          style={[styles.input, { width: 50, marginLeft: 5 }]}
          placeholder="hrs"
          value={intervalHours}
          onChangeText={(text) => setIntervalHours(text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
        />

        <Text style={styles.checkboxText}>hrs starting</Text>

        <TouchableOpacity
          onPress={() => setShowTimePicker(true)} // Show Time Picker on click
          style={[styles.input, { width: 90, marginLeft: 5, padding: 10 }]}
        >
          <Text style={styles.timeText}>
            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </TouchableOpacity>
      </View>
   </TouchableOpacity>

    {/* Time Picker for Start Time */}
    {showTimePicker && (
      <DateTimePicker
        value={startTime}
        mode="time"
        is24Hour={false}
        display="spinner"
        onChange={(event, selectedTime) => {
          setShowTimePicker(false); 
          if (selectedTime) setStartTime(selectedTime);
        }}
        style={{
          marginTop: 10,
          backgroundColor: '#fff', 
        }} 
        themeVariant="light" 
      />
    )}

  <View style={styles.formGroup}>
    <TouchableOpacity onPress={() => setIsEveryHours(false)}>
      <Text style={styles.checkboxText}>
        {isEveryHours ? "○ " : "✓ "}Custom
      </Text>
    </TouchableOpacity>

    {!isEveryHours && (
      <View>
        {timeSlots.map((slot, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <TextInput
              style={[styles.input, { padding: 13 }]}
              placeholder="Custom Time"
              placeholderTextColor="#5A5A5A"
              value={slot}
              onChangeText={(text) => {
                const newSlots = [...timeSlots];
                newSlots[index] = text;
                setTimeSlots(newSlots);
              }}
            />
          </View>
        ))}
        <TouchableOpacity
          style={styles.addTimeButton}
          onPress={() => setTimeSlots([...timeSlots, ""])}
        >
          <Text style={styles.plusText}>+ Add Custom Time</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
    </View>

  {/* Validation Message */}
    {timeSlots.length >= parseInt(numTablets, 10) && (
      <Text style={{ color: "red", marginTop: 5 }}>
        Time slots cannot exceed the number of tablets.
      </Text>
    )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Reminder Type</Text>
        <DropDownPicker
          open={dropdownOpen}
          value={notificationType}
          items={[
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Mobile Notification', value: 'mobile' },
          ]}
          setOpen={setDropdownOpen}  
          setValue={setNotificationType}  
          setItems={() => {}}
          containerStyle={styles.dropdownContainer}
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
          textStyle={styles.dropdownText}  
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Reminder Options</Text>
        <View>
          {["10 minutes before", "5 minutes before", "Exact time"].map(
            (option) => (
              <TouchableOpacity
                key={option}
                style={styles.checkboxContainer}
                onPress={() => handleCheckboxChange(option)}
              >
                <Text style={styles.checkboxText}>
                  {notificationDetails.includes(option) ? "✓ " : "○ "}
                  {option}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Doctor Instructions</Text>
        <TouchableOpacity
          style={styles.attachmentGroup}
          onPress={handleAttachRecording}
        >
          <Text style={styles.attachmentText}>
            {attachment ? "Replace Recording" : "Attach Recording"}
          </Text>
        </TouchableOpacity>
        {attachment && (
          <Text style={styles.attachmentText}>Attached: {attachment.name}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMedication}
        >
          <Text style={styles.buttonText}>
            {editingId ? "Update Medication" : "Add Medication"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
          <Text style={styles.buttonText}>Clear Form</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.heading}>Medications</Text>
      {medications.length > 0 ? (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.medicationItem}>
              <View style={styles.medicationDetails}>
                <Text style={styles.medicationText}>
                  {item.name} - {item.dose}, {item.numTablets} tablet(s)
                </Text>
                <Text style={styles.timeSlotsText}>
                  Time Slots: {item.time}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditMedication(item.id)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteMedication(item.id)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noDataText}>No medications added yet.</Text>
      )}
    </ScrollView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    paddingBottom: 80,
  },
  heading: {
    marginTop: 35,
    textAlign: "center",
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginVertical: 10,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: width * 0.05,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#FFF",
    fontSize: width * 0.04,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    flex: 1,
    marginRight: 10,
    fontSize: width * 0.04,
  },
  timeText: {
    color: "#333",
  },
  addTimeButton: {
    backgroundColor: "#0066CC",
    padding: 10,
    borderRadius: 5,
  },
  plusText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  timeSlotItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    padding: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  timeSlotText: {
    fontSize: width * 0.04,
    color: "#333",
  },
  removeTimeSlotText: {
    color: "red",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  clearButton: {
    backgroundColor: "#ffc107",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "#FFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  medicationItem: {
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: 16,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    position: "relative",
  },
  medicationDetails: {
    paddingBottom: 45,
  },
  medicationText: {
    fontSize: width * 0.05,
    fontWeight: "600",
  },
  timeSlotsText: {
    marginTop: 5,
    fontSize: width * 0.045,
    color: "#666",
  },
  actionButtons: {
    position: "absolute",
    marginTop: 15,
    bottom: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  editButton: {
    backgroundColor: "#007bff",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
  },
  attachmentGroup: {
    backgroundColor: "#FFFFFF", // White background
    borderColor: "#BBBBBB", // Black border
    borderWidth: 1, // Border width
    borderRadius: 8, // Rounded corners
    padding: 10, // Padding inside the rectangle
    marginBottom: 5, // Space below the attachment section
  },
  attachmentText: {
    fontSize: 16,
    color: "#007BFF", // Blue text color for the button
    fontWeight: "bold",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 15,
  },
  checkboxText: {
    fontSize: 18,
    color: "#333",
    fontWeight: 500,
  },
  dropdownContainer: {
    height: 39,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  dropdownList: {
    backgroundColor: '#FFF',
    borderColor: '#ccc',
  },
  dropdownText: {
    fontSize: width * 0.04, 
  },
});

function setShowCalendar(arg0: boolean) {
  throw new Error("Function not implemented.");
}
