import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import DropDownPicker from "react-native-dropdown-picker";
import Checkbox from "expo-checkbox";
import { medicineSchema, MedicineSchema } from "@/validation/medicine";
import { medSchedSchema, MedSchedSchema } from "@/validation/schedule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { useLocalSearchParams } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";

interface Attachment {
  uri: string;
  name: string;
  size?: number;
  type: string;
}

export default function MedicationTab() {
  const params = useLocalSearchParams<{ user: string }>();
  const [searchText, setSearchText] = useState("");
  const [medications, setMedications] = useState<MedicineSchema[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<
    MedicineSchema[]
  >([]);
  const [schedules, setSchedules] = useState<MedSchedSchema[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [timeEditId, setTimeEditId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number>(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false); // Separate state for date picker
  const [customTimeShow, setCustomTimeShow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [typeDropdown, setTypeDropdown] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      let numberId = Number(id);
      setUserId(numberId);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchMedications = async () => {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}med/user/${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMedications(data);
        setFilteredMedications(data);
      }
    };
    fetchMedications();
  }, [userId]);

  const [medicationFormData, setMedicationFormData] = useState<MedicineSchema>({
    name: "",
    userId: userId,
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
    files: [] as Uint8Array<ArrayBuffer>[],
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    medId: 0,
    day: new Date(),
    time: new Date(),
    timeSlots: "",
    timeTaken: new Date(),
    taken: false,
    qtyTaken: "",
    action: "",
    isEveryHours: true,
    startTime: "",
    interval: "",
  });

  const handleSearch = (text: string) => {
    if (text.trim() === "") {
      setFilteredMedications(medications);
      return;
    }
    const filteredMedicines = medications.filter((medicine) => {
      return (
        medicine.name.toLowerCase().includes(text.toLowerCase()) ||
        medicine.dose.toLowerCase().includes(text.toLowerCase()) ||
        medicine.instructions.toLowerCase().includes(text.toLowerCase()) ||
        medicine.description.toLowerCase().includes(text.toLowerCase())
      );
    });
    setFilteredMedications(filteredMedicines);
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

  const handleAddMedication = async () => {
    try {
      const validatedData = medicineSchema.parse({
        ...medicationFormData,
        currentQty: medicationFormData.initialQty,
        requiredQty: (
          Number(medicationFormData.dose) *
          Number(medicationFormData.instructions.split(", ")[0]) *
          Number(medicationFormData.instructions.split(", ")[1])
        ).toString(),
        userId: userId,
      });

      let iterations =
        Number(medicationFormData.instructions.split(", ")[0]) *
        Number(medicationFormData.instructions.split(", ")[1]);
      let startingDate = new Date(
        medicationFormData.instructions.split(", ")[3]
      );
      let timeslots = "";

      if (scheduleFormData.isEveryHours === true) {
        let times = [];
        const timesPerDay =
          Number(medicationFormData.instructions.split(",")[0]) || 1;
        const interval = Number(scheduleFormData.interval) || 1;
        const baseTime = new Date();
        if (scheduleFormData.startTime) {
          const [hours, minutes] = scheduleFormData.startTime.split(":");
          baseTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        }

        for (let i = 0; i < timesPerDay; i++) {
          const currentTime = new Date(baseTime);
          currentTime.setHours(currentTime.getHours() + i * interval);
          times.push(
            currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        }
        timeslots = times.join(", ");
      } else if (scheduleFormData.isEveryHours === false) {
        timeslots = scheduleFormData.timeSlots;
      }

      if (parseInt(validatedData.initialQty) <= 0) {
        throw new Error("Initial quantity must be greater than 0");
      }

      if (parseInt(validatedData.dose) <= 0) {
        throw new Error("Dose must be greater than 0");
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}med`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      Alert.alert("Success", "Medication and schedule added successfully!");

      const medicationData = await response.json();
      const medId = medicationData.medId;
      let currentDay = new Date(startingDate);
      const daysToAdd =
        medicationFormData.instructions.split(", ")[2] === "Daily" ? 1 : 2;
      const totalDays = Number(medicationFormData.instructions.split(", ")[1]);

      for (let day = 0; day < totalDays; day++) {
        const dailyTimeslots = timeslots.split(", ");
        for (const time of dailyTimeslots) {
          const [hours, minutes] = time.split(":");
          const scheduleDate = new Date(currentDay);
          scheduleDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

          const [timeStr, period] = time.split(" ");
          const [hours1, minutes1] = timeStr.split(":");
          let hour = parseInt(hours1);
          if (period === "PM" && hour !== 12) hour += 12;
          if (period === "AM" && hour === 12) hour = 0;
          const formattedTime = `${hour
            .toString()
            .padStart(2, "0")}:${minutes1}`;

          const scheduleData = medSchedSchema.parse({
            medId: medId,
            day: scheduleDate.toISOString().split("T")[0],
            time: formattedTime,
          });
          const scheduleResponse = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}sched`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(scheduleData),
            }
          );

          if (!scheduleResponse.ok) {
            const errorData = await scheduleResponse.json();
            console.error(
              `Failed to create schedule for ${currentDay}:`,
              errorData.message
            );
          }
        }
        currentDay.setDate(currentDay.getDate() + daysToAdd);
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        Alert.alert("Error", e.errors.map((error) => error.message).join("\n"));
      } else {
        Alert.alert("Error", (e as Error).message);
      }
    }
  };
  const handleInputChange = (
    key: string,
    value: string | boolean | string[]
  ) => {
    setMedicationFormData((prev) => ({ ...prev, [key]: value }));
    setScheduleFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearForm = () => {
    setMedicationFormData({
      name: "",
      userId: userId,
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
      timeSlots: "",
      timeTaken: new Date(),
      taken: false,
      qtyTaken: "",
      action: "",
      isEveryHours: true,
      startTime: "",
      interval: "",
    });
    setEditingId(null);
    setShowTimePicker(false);
    setModalVisible(false);
  };

  const generateTimeSlots = () => {
    const timesPerDay = parseInt(
      medicationFormData.instructions.split(", ")[0],
      10
    );
    const slots: string[] = [];
    for (let i = 0; i < timesPerDay; i++) {
      slots.push("");
    }
    setScheduleFormData((prev) => ({
      ...prev,
      timeSlots: slots.join(", "),
    }));
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      handleInputChange(
        "instructions",
        `${medicationFormData.instructions.split(", ")[0] || ""}, ${
          medicationFormData.instructions.split(", ")[1] || ""
        }, ${
          medicationFormData.instructions.split(", ")[2] || ""
        }, ${formattedDate}`
      );
    }
  };

  const hideDatePicker = () => {
    setShowTimePicker(false);
  };

  const handleConfirm = (time: Date) => {
    let formattedTime = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setScheduleFormData((prev) => ({
      ...prev,
      startTime: formattedTime,
    }));
    hideDatePicker();
  };

  const handleCustomConfirm = (time: Date) => {
    const formattedTime = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const updatedSlots = scheduleFormData.timeSlots
      .split(", ")
      .map((slot, index) => (index === timeEditId ? formattedTime : slot));
    setScheduleFormData({
      ...scheduleFormData,
      timeSlots: updatedSlots.join(", "),
    });
    setCustomTimeShow(false);
  };

  const hideDateCustomPicker = () => {
    setCustomTimeShow(false);
  };

  return (
    <View style={{ maxHeight: "100%", backgroundColor: "#fff" }}>
      <FlatList
        ListHeaderComponent={
          <View style={styles.container}>
            <Text style={styles.heading}>Medications</Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#5A5A5A"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search medications..."
                  placeholderTextColor="#5A5A5A"
                  value={searchText}
                  onChangeText={(text) => {
                    setSearchText(text);
                    handleSearch(text);
                  }}
                />
              </View>
              <TouchableOpacity
                style={{
                  borderRadius: 10,
                  width: 60,
                  height: 53,
                  padding: 10,
                  margin: 0,
                  backgroundColor: "green",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onPress={() => setModalVisible(true)}
              >
                <Text style={[styles.buttonText]}>
                  <MaterialIcons name="add" size={30} color="white" />
                </Text>
              </TouchableOpacity>
            </View>
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <ScrollView>
                    <Text style={styles.modalTitle}>Add Medication</Text>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Medication Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter medication name"
                        placeholderTextColor="#5A5A5A"
                        value={medicationFormData.name}
                        onChangeText={(text) => handleInputChange("name", text)}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Description</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter description"
                        placeholderTextColor="#5A5A5A"
                        value={medicationFormData.description}
                        onChangeText={(text) =>
                          handleInputChange("description", text)
                        }
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
                            handleInputChange(
                              "initialQty",
                              text.replace(/[^0-9]/g, "")
                            )
                          }
                          keyboardType="numeric"
                        />
                      </View>

                      <View
                        style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}
                      >
                        <Text style={styles.label}>Unit</Text>
                        <DropDownPicker
                          open={dropdownOpen}
                          value={medicationFormData.unit}
                          items={[
                            { label: "mL", value: "mL" },
                            { label: "pieces", value: "pieces" },
                          ]}
                          setOpen={setDropdownOpen}
                          setValue={(callback) => {
                            const value = callback(medicationFormData.unit);
                            handleInputChange("unit", value);
                          }}
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
                            handleInputChange(
                              "dose",
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
                            value={
                              medicationFormData.instructions.split(", ")[0]
                            }
                            onChangeText={(text) =>
                              handleInputChange(
                                "instructions",
                                `${text.replace(/[^0-9]/g, "")}, ${
                                  medicationFormData.instructions.split(
                                    ", "
                                  )[1] || ""
                                }, ${
                                  medicationFormData.instructions.split(
                                    ", "
                                  )[2] || ""
                                }`
                              )
                            }
                            keyboardType="numeric"
                            onBlur={generateTimeSlots}
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
                            value={
                              medicationFormData.instructions.split(", ")[1]
                            }
                            onChangeText={(text) =>
                              handleInputChange(
                                "instructions",
                                `${
                                  medicationFormData.instructions.split(
                                    ", "
                                  )[0] || ""
                                }, ${text.replace(/[^0-9]/g, "")}, ${
                                  medicationFormData.instructions.split(
                                    ", "
                                  )[2] || ""
                                }`
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
                            days
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 5,
                            maxWidth: "100%",
                          }}
                        >
                          <DropDownPicker
                            open={dayPickerOpen}
                            placeholder="Select frequency"
                            value={
                              medicationFormData.instructions.split(", ")[2]
                            }
                            items={[
                              { label: "Daily", value: "Daily" },
                              {
                                label: "Every other day",
                                value: "Every other day",
                              },
                            ]}
                            setOpen={setDayPickerOpen}
                            setValue={(callback) => {
                              const value = callback(
                                medicationFormData.instructions.split(", ")[2]
                              );
                              handleInputChange(
                                "instructions",
                                `${
                                  medicationFormData.instructions.split(
                                    ", "
                                  )[0] || ""
                                }, ${
                                  medicationFormData.instructions.split(
                                    ", "
                                  )[1] || ""
                                }, ${value}`
                              );
                            }}
                            setItems={() => {}}
                            containerStyle={[
                              styles.dropdownContainer,
                              { width: "50%" },
                            ]}
                            style={styles.dropdown}
                            dropDownContainerStyle={styles.dropdownList}
                            textStyle={styles.dropdownText}
                          />
                          <TouchableOpacity
                            style={styles.timeInputContainer}
                            onPress={() => setShowDatePicker(true)}
                          >
                            <View
                              style={[
                                styles.borderedBox,
                                { width: "70%", padding: 14 },
                              ]}
                            >
                              <Text style={styles.timeInput}>
                                {medicationFormData.instructions.split(", ")[3]
                                  ? new Date(
                                      medicationFormData.instructions.split(
                                        ", "
                                      )[3]
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : new Date().toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          {showDatePicker && (
                            <DateTimePicker
                              mode="date"
                              value={
                                medicationFormData.instructions.split(", ")[3]
                                  ? new Date(
                                      medicationFormData.instructions.split(
                                        ", "
                                      )[3]
                                    )
                                  : new Date()
                              }
                              onChange={handleDateChange}
                              style={styles.dropdown}
                            />
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Time Slot Selection</Text>

                      <TouchableOpacity
                        onPress={() => handleInputChange("isEveryHours", true)}
                      >
                        <View
                          style={[
                            styles.input,
                            { flexDirection: "row", alignItems: "center" },
                          ]}
                        >
                          <Text style={styles.checkboxText}>
                            {scheduleFormData.isEveryHours ? "◉  " : "○ "}Every
                          </Text>
                          <TextInput
                            style={[
                              styles.underlinedInput,
                              { width: "auto", marginLeft: 5 },
                            ]}
                            placeholder="hrs"
                            value={scheduleFormData.interval.toString()}
                            onChangeText={(text) =>
                              handleInputChange(
                                "interval",
                                (
                                  parseInt(text.replace(/[^0-9]/g, "")) || 0
                                ).toString()
                              )
                            }
                            keyboardType="numeric"
                          />

                          <Text style={styles.checkboxText}>
                            hrs starting at
                          </Text>

                          <TouchableOpacity
                            onPress={() => setShowTimePicker(true)}
                            style={[
                              styles.underlinedInput,
                              { width: 90, marginLeft: 5 },
                            ]}
                          >
                            <Text style={styles.timeText}>
                              {scheduleFormData.startTime}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                      <DateTimePickerModal
                        isVisible={showTimePicker}
                        mode="time"
                        onConfirm={handleConfirm}
                        onCancel={hideDatePicker}
                      />

                      <View style={{ padding: 10 }}>
                        <TouchableOpacity
                          onPress={() =>
                            handleInputChange("isEveryHours", false)
                          }
                        >
                          <Text style={styles.checkboxText}>
                            {scheduleFormData.isEveryHours ? "○ " : "◉ "} Custom
                          </Text>
                        </TouchableOpacity>

                        {!scheduleFormData.isEveryHours && (
                          <View>
                            {scheduleFormData.timeSlots
                              .split(", ")
                              .map((slot, index) => (
                                <View
                                  key={index}
                                  style={{ marginBottom: 5, marginTop: 10 }}
                                >
                                  <TouchableOpacity
                                    onPress={() => {
                                      setCustomTimeShow(true);
                                      setTimeEditId(index);
                                    }}
                                  >
                                    <TextInput
                                      style={[styles.input, { padding: 13 }]}
                                      placeholder="Custom Time"
                                      placeholderTextColor="#5A5A5A"
                                      value={slot.trim()}
                                      editable={false}
                                    />
                                  </TouchableOpacity>
                                  <DateTimePickerModal
                                    isVisible={customTimeShow}
                                    mode="time"
                                    onConfirm={handleCustomConfirm}
                                    onCancel={hideDateCustomPicker}
                                  />
                                </View>
                              ))}
                          </View>
                        )}
                      </View>
                    </View>

                    {scheduleFormData.timeSlots.length >=
                      parseInt(medicationFormData.initialQty, 10) && (
                      <Text style={{ color: "red", marginTop: 5 }}>
                        Time slots cannot exceed the number of times per day.
                      </Text>
                    )}

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Reminder Type</Text>
                      <DropDownPicker
                        open={typeDropdown}
                        value={medicationFormData.notificationType}
                        items={[
                          { label: "Email", value: "email" },
                          { label: "Mobile Notification", value: "mobile" },
                          { label: "Both", value: "both" },
                        ]}
                        setOpen={setTypeDropdown}
                        setValue={(callback) => {
                          const value = callback(
                            medicationFormData.notificationType
                          );
                          handleInputChange("notificationType", value);
                        }}
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
                        {[
                          "10 minutes before",
                          "5 minutes before",
                          "Exact time",
                        ].map((option) => (
                          <TouchableOpacity
                            key={option}
                            style={styles.checkboxContainer}
                            onPress={() => handleCheckboxChange(option)}
                          >
                            <Checkbox
                              style={styles.checkbox}
                              value={medicationFormData.notifDetails.includes(
                                option
                              )}
                              onValueChange={() => handleCheckboxChange(option)}
                            />
                            <Text style={styles.checkboxText}>{option}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* <View style={styles.formGroup}>
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
            </View> */}

                    <View
                      style={[
                        styles.buttonContainer,
                        { marginBottom: 10, marginTop: 10 },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.addButton,
                          ,
                          { backgroundColor: "#4EBC85" },
                        ]}
                        onPress={handleAddMedication}
                      >
                        <Text style={[styles.buttonText]}>
                          {editingId ? "Update Medication" : "Add Medication"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.clearButton,
                          {
                            backgroundColor: "#FF5C5C",
                            padding: 10,
                            borderRadius: 5,
                          },
                        ]}
                        onPress={clearForm}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        }
        data={filteredMedications}
        keyExtractor={(item) => item.medId?.toString() ?? ""}
        renderItem={({ item }) => (
          <View style={styles.medicationItem}>
            <View style={styles.medicationDetails}>
              <Text style={styles.medicationText}>{item.name}</Text>
              <Text style={[styles.timeSlotsText, { color: "black" }]}>
                {item.dose} {item.unit}, {item.instructions.split(", ")[0]}{" "}
                times a day for {item.instructions.split(", ")[1]} days
              </Text>
              <Text style={styles.timeSlotsText}>
                <Text style={{ marginRight: 2 }}>Stock: </Text>
                {item.currentQty} {item.unit}
              </Text>
            </View>
            <View style={[styles.actionButtons, { padding: 5 }]}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.editButton,
                  {
                    borderRadius: 8,
                    backgroundColor: "#465293",
                    marginRight: 0,
                  },
                ]}
                onPress={() => handleEditMedication(item.medId ?? 0)}
              >
                <Text style={styles.actionButtonText}>
                  <Text>
                    <MaterialCommunityIcons
                      name="pencil"
                      size={15}
                      color="white"
                    />
                  </Text>{" "}
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.deleteButton,
                  { borderRadius: 8, backgroundColor: "#BC2C1A" },
                ]}
                onPress={() => handleDeleteMedication(item.medId ?? 0)}
              >
                <Text style={styles.actionButtonText}>
                  <MaterialCommunityIcons
                    name="trash-can"
                    size={15}
                    color="white"
                  />{" "}
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No medications added yet.</Text>
        }
      />
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    overflowY: "auto",
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
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 10,
    padding: 5,
    paddingLeft: 15,
    width: "80%",
    backgroundColor: "#fff",
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
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 19,
    padding: 18,
    borderWidth: 1,
    borderColor: "gray",
    position: "relative",
  },
  medicationDetails: {
    paddingBottom: 53,
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
    backgroundColor: "#FFFFFF",
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
    gap: 5,
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
    width: "99%",
    maxHeight: "80%",
    height: "auto",
    overflowY: "auto",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 19,
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
