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
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import DropDownPicker from "react-native-dropdown-picker";
import Checkbox from "expo-checkbox";
import { MaterialIcons } from "@expo/vector-icons";
import { medicineSchema, MedicineSchema } from "@/validation/medicine";
import { medSchedSchema, MedSchedSchema } from "@/validation/schedule";

interface Attachment {
  uri: string;
  name: string;
  size?: number;
  type: string;
}

export default function MedicationTab() {
  const [medications, setMedications] = useState<MedicineSchema[]>([]);
  const [schedules, setSchedules] = useState<MedSchedSchema[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [isEveryHours, setIsEveryHours] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [dayPickerValue, setDayPickerValue] = useState("");
  const [medicationFormData, setMedicationFormData] = useState({
    name: "",
    userId: 0,
    description: "",
    instructions: "",
    dose: "",
    requiredQty: "",
    initialQty: "",
    currentQty: "",
    unit: "",
    notificationType: "",
    notifDetails: "",
    attachments: "",
    fileType: "",
    files: [] as Uint8Array[],
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    medId: 0,
    day: new Date(),
    time: new Date(),
    timeSlots: [] as string[],
    timeTaken: new Date(),
    taken: false,
    qtyTaken: "",
    action: "",
  });

  const handleMedicationChange = (name: string, value: string) => {
    setMedicationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (name: string, value: string) => {
    setScheduleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value: string) => {
    if (medicationFormData.notifDetails.includes(value)) {
      setMedicationFormData((prev) => ({
        ...prev,
        notifDetails: prev.notifDetails
          .split(", ")
          .filter((item) => item !== value)
          .join(", "),
      }));
    } else {
      setMedicationFormData((prev) => ({
        ...prev,
        notifDetails: prev.notifDetails
          ? `${prev.notifDetails}, ${value}`
          : value,
      }));
    }
  };

  const handleAttachRecording = async () => {
    try {
      const result: DocumentPicker.DocumentPickerResult =
        await DocumentPicker.getDocumentAsync({
          type: "audio/*",
          copyToCacheDirectory: true,
        });

      if (result.assets && result.assets.length > 0) {
        const newAttachments: Attachment[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType || "audio",
        }));
        setMedicationFormData((prev) => ({
          ...prev,
          attachment: newAttachments[0],
        }));
        Alert.alert("Success", "Attachment added successfully!");
      } else {
        Alert.alert("Cancelled", "No file was selected.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to attach recording.");
    }
  };

  const handleDeleteMedication = (id: number) => {
    Alert.alert("Success", "Medication deleted successfully!");
  };

  const handleEditMedication = (id: number) => {
    const medication = medications.find((med) => med.medId ?? 0);
    if (medication) {
      setMedicationFormData({
        name: medication.name,
        userId: medication.userId,
        description: medication.description,
        instructions: medication.instructions,
        dose: medication.dose,
        requiredQty: medication.requiredQty,
        initialQty: medication.initialQty,
        currentQty: medication.currentQty,
        unit: medication.unit,
        notificationType: medication.notificationType,
        notifDetails: medication.notifDetails,
        attachments: medication.attachments ?? "",
        fileType: medication.fileType ?? "",
        files: medication.files ?? [],
      });
    }
  };

  const handleAddTimeSlot = () => {
    const tabletCount = parseInt(medicationFormData.requiredQty, 10);
    if (tabletCount <= 1 && scheduleFormData.timeSlots.length >= 1) {
      alert("You can only add one time slot for a single tablet.");
      return;
    }
    const formattedTime = scheduleFormData.time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setScheduleFormData((prev) => ({
      ...prev,
      timeSlots: [...prev.timeSlots, formattedTime],
    }));
  };
  const handleInputChange = (key: string, value: string) => {
    setMedicationFormData({ ...medicationFormData, [key]: value });
    setScheduleFormData({ ...scheduleFormData, [key]: value });
  };
  const clearForm = () => {
    setMedicationFormData({
      name: "",
      userId: 0,
      description: "",
      instructions: "",
      dose: "",
      requiredQty: "",
      initialQty: "",
      currentQty: "",
      unit: "",
      notificationType: "",
      notifDetails: "",
      attachments: "",
      fileType: "",
      files: [],
    });
    setScheduleFormData({
      medId: 0,
      time: new Date(),
      day: new Date(),
      timeSlots: [],
      timeTaken: new Date(),
      taken: false,
      qtyTaken: "",
      action: "",
    });
    setEditingId(null);
    setShowTimePicker(false);
    setShowCalendar(false);
  };

  const handleAddCustomTime = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.heading}>
          {editingId ? "Edit Medication" : "Add Medication"}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Medication Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter medication name"
            placeholderTextColor="#5A5A5A"
            value={medicationFormData.name}
            onChangeText={(text) =>
              handleMedicationChange("medicationName", text)
            }
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter description"
            placeholderTextColor="#5A5A5A"
            value={medicationFormData.description}
            onChangeText={(text) => handleMedicationChange("description", text)}
          />
        </View>

        <View style={styles.timeInputContainer}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { marginBottom: 7 }]}>
              Quantity Bought
            </Text>
            <TextInput
              style={[styles.input, { padding: 13 }]}
              placeholder="e.g., 30"
              placeholderTextColor="#5A5A5A"
              value={medicationFormData.initialQty}
              onChangeText={(text) =>
                handleMedicationChange(
                  "intTablets",
                  text.replace(/[^0-9]/g, "")
                )
              }
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Unit</Text>
            <DropDownPicker
              open={dropdownOpen}
              value={medicationFormData.unit}
              items={[
                { label: "mL", value: "mL" },
                { label: "pieces", value: "pieces" },
              ]}
              setOpen={(open) =>
                handleScheduleChange("dropdownOpen", open.toString())
              }
              setValue={(value) =>
                handleMedicationChange("unit", value.toString())
              }
              setItems={() => {}}
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
              textStyle={styles.dropdownText}
            />
          </View>
        </View>

        <View style={[]}>
          <Text style={styles.label}>Dosage</Text>

          <View
            style={[
              styles.borderedBox,
              { flexDirection: "row", alignItems: "center" },
            ]}
          >
            <TextInput
              style={styles.underlinedInput}
              placeholder="e.g., 10"
              placeholderTextColor="#5A5A5A"
              value={medicationFormData.dose}
              onChangeText={(text) =>
                handleMedicationChange(
                  "intTablets",
                  text.replace(/[^0-9]/g, "")
                )
              }
              keyboardType="numeric"
            />
            <TextInput
              style={[
                styles.label,
                {
                  width: "auto",
                  fontSize: 15,
                  fontWeight: "400",
                  marginTop: 2,
                },
              ]}
              value={medicationFormData.unit}
              editable={false}
            />
            <Text
              style={[
                styles.label,
                { fontSize: 15, fontWeight: "400", marginTop: 2 },
              ]}
            >
              per take
            </Text>
          </View>
        </View>

        <View style={styles.timeInputContainer}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.label, { marginBottom: 7 }]}>
              Instructions
            </Text>
            <View
              style={[
                styles.borderedBox,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <TextInput
                style={styles.underlinedInput}
                placeholder="e.g., 3"
                placeholderTextColor="#5A5A5A"
                value={medicationFormData.instructions}
                onChangeText={(text) =>
                  handleMedicationChange(
                    "instructions",
                    text.replace(/[^0-9]/g, "")
                  )
                }
                keyboardType="numeric"
              />
              <Text
                style={[
                  styles.label,
                  { fontSize: 15, fontWeight: "400", marginTop: 2 },
                ]}
              >
                times a day for
              </Text>
              <TextInput
                style={styles.underlinedInput}
                placeholder="0"
                placeholderTextColor="#5A5A5A"
                onChangeText={(text) =>
                  handleMedicationChange("days", text.replace(/[^0-9]/g, ""))
                }
                keyboardType="numeric"
              />
              <Text
                style={[
                  styles.label,
                  { fontSize: 15, fontWeight: "400", marginTop: 2 },
                ]}
              >
                days
              </Text>
            </View>
            <DropDownPicker
              placeholder="Select frequency"
              open={dayPickerOpen}
              value={dayPickerValue}
              items={[
                { label: "Daily", value: "Daily" },
                { label: "Every other day", value: "Every other day" },
              ]}
              setOpen={(open) =>
                handleScheduleChange("dayPickerOpen", open.toString())
              }
              setValue={(value) =>
                handleScheduleChange("dayPickerValue", value.toString())
              }
              setItems={() => {}}
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
              textStyle={styles.dropdownText}
            />
          </View>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Time Slot Selection</Text>

          <TouchableOpacity
            onPress={() => handleScheduleChange("isEveryHours", "true")}
          >
            <View
              style={[
                styles.input,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <Text style={styles.checkboxText}>
                {isEveryHours ? "◉  " : "○ "}Every
              </Text>

              <TextInput
                style={[
                  styles.underlinedInput,
                  { width: "auto", marginLeft: 5 },
                ]}
                placeholder="hrs"
                onChangeText={(text) =>
                  handleScheduleChange(
                    "intervalHours",
                    text.replace(/[^0-9]/g, "")
                  )
                }
                keyboardType="numeric"
              />

              <Text style={styles.checkboxText}>hrs starting at</Text>

              <TouchableOpacity
                onPress={() => setShowTimePicker(true)} // Show Time Picker on click
                style={[styles.underlinedInput, { width: 90, marginLeft: 5 }]}
              >
                <Text style={styles.timeText}>
                  {startTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
                if (selectedTime)
                  handleScheduleChange("startTime", selectedTime.toString());
              }}
              style={{
                marginTop: 10,
                backgroundColor: "#fff",
              }}
              themeVariant="light"
            />
          )}

          <View style={{ padding: 10 }}>
            <TouchableOpacity
              onPress={() => handleScheduleChange("isEveryHours", "false")}
            >
              <Text style={styles.checkboxText}>
                {isEveryHours ? "○ " : "◉ "} Custom
              </Text>
            </TouchableOpacity>

            {!isEveryHours && (
              <View>
                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={handleAddCustomTime}
                >
                  <Text style={styles.plusText}>+ Add Custom Time</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Validation Message */}
        {scheduleFormData.timeSlots.length >=
          parseInt(medicationFormData.initialQty, 10) && (
          <Text style={{ color: "red", marginTop: 5 }}>
            Time slots cannot exceed the number of times per day.
          </Text>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reminder Type</Text>
          <DropDownPicker
            open={dropdownOpen}
            value={medicationFormData.notificationType}
            items={[
              { label: "Email", value: "email" },
              { label: "Phone", value: "phone" },
              { label: "Mobile Notification", value: "mobile" },
            ]}
            setOpen={(open) =>
              handleScheduleChange("dropdownOpen", open.toString())
            }
            setValue={(value) =>
              handleMedicationChange("notificationType", value.toString())
            }
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
                  <Checkbox
                    style={styles.checkbox}
                    value={medicationFormData.notifDetails.includes(option)}
                    onValueChange={() => handleCheckboxChange(option)}
                  />
                  <Text style={styles.checkboxText}>{option}</Text>
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
              {medicationFormData.files
                ? "Replace Recording"
                : "Attach Recording"}
            </Text>
          </TouchableOpacity>
          {medicationFormData.files && (
            <Text style={styles.attachmentText}>
              Attached: {medicationFormData.attachments}
            </Text>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.addButton}
            // onPress={handleAddMedication}
          >
            <Text style={styles.buttonText}>
              {editingId ? "Update Medication" : "Add Medication"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
            <Text style={styles.buttonText}>Clear Form</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Text style={styles.heading}>Medications</Text>
      {medications.length > 0 ? (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.medId?.toString() ?? ""}
          renderItem={({ item }) => (
            <View style={styles.medicationItem}>
              <View style={styles.medicationDetails}>
                <Text style={styles.medicationText}>
                  {item.name} - {item.dose}, {item.currentQty} tablet(s)
                </Text>
                <Text style={styles.timeSlotsText}>\ </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditMedication(item.medId ?? 0)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDeleteMedication(item.medId ?? 0)}
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

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Time</Text>
            {scheduleFormData.timeSlots.map((slot, index) => (
              <View key={index} style={{ marginBottom: 10, marginTop: 10 }}>
                <TextInput
                  style={[styles.input, { padding: 13 }]}
                  placeholder="Custom Time"
                  placeholderTextColor="#5A5A5A"
                  value={slot}
                  onChangeText={(text) => {
                    const newSlots = [...scheduleFormData.timeSlots];
                    newSlots[index] = text;
                    setScheduleFormData((prev) => ({
                      ...prev,
                      timeSlots: newSlots,
                    }));
                  }}
                />
              </View>
            ))}
            <TouchableOpacity
              style={styles.addTimeButton}
              onPress={() =>
                setScheduleFormData((prev) => ({
                  ...prev,
                  timeSlots: [...prev.timeSlots, ""],
                }))
              }
            >
              <Text style={styles.plusText}>+ Add Custom Time</Text>
            </TouchableOpacity>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#fff",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  scrollViewContent: {
    padding: 16,
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
    marginTop: 10,
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
    fontSize: 15,
    color: "#333",
    fontWeight: 500,
  },
  dropdownContainer: {
    height: 39,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  dropdownList: {
    backgroundColor: "#FFF",
    borderColor: "#ccc",
  },
  dropdownText: {
    fontSize: width * 0.04,
  },
  borderedBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 5,
    marginBottom: 15,
  },
  underlinedInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    padding: 10,
    fontSize: width * 0.04,
    marginHorizontal: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

function setShowCalendar(arg0: boolean) {
  throw new Error("Function not implemented.");
}
