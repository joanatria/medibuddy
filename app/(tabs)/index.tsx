import { useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  TextInput,
  Modal,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { ThemedView } from "@/components/ThemedView";
import { MedSchedSchema } from "@/validation/schedule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicineSchema } from "@/validation/medicine";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toISOString().split("T")[0]
  );
  const [schedule, setSchedule] = useState<MedSchedSchema[]>([]);
  const [medications, setMedications] = useState<MedicineSchema[]>([]);
  const [userId, setUserId] = useState<number>(0);
  const [schedules, setSchedules] = useState<MedSchedSchema[]>([]);
  const [takenModalVisible, setTakenModalVisible] = useState(false);
  const [missedModalVisible, setMissedModalVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<MedSchedSchema | null>(null);
  const [tempQuantity, setTempQuantity] = useState("");
  const [tempTime, setTempTime] = useState("");
  const [missedAction, setMissedAction] = useState<"skip" | "take" | null>(
    null
  );

  const onDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    const filteredSchedules = schedules.filter(
      (sched) => sched.day === day.dateString
    );
    setSchedule(filteredSchedules);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        const numberId = Number(id);
        setUserId(numberId);

        if (numberId) {
          const medResponse = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}med/user/${numberId}`
          );
          if (!medResponse.ok) throw new Error("Failed to fetch medications");
          const medsData = await medResponse.json();
          setMedications(medsData);

          const allSchedules: MedSchedSchema[] = [];
          for (const medication of medsData) {
            const schedResponse = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}sched/med/${medication.medId}`
            );
            if (!schedResponse.ok) throw new Error("Failed to fetch schedules");
            const schedData = await schedResponse.json();
            allSchedules.push(...schedData);
          }
          setSchedules(allSchedules);

          // If there's a selected date, update the current schedule view
          if (selectedDate) {
            const filteredSchedules = allSchedules.filter(
              (sched) => sched.day === selectedDate
            );
            setSchedule(filteredSchedules);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // You might want to add some error state handling here
      }
    };

    fetchData();
  }, [selectedDate]); // Only re-run when selectedDate changes

  // Update schedule whenever schedules array changes
  useEffect(() => {
    if (selectedDate) {
      const filteredSchedules = schedules.filter(
        (sched) => sched.day === selectedDate
      );
      setSchedule(filteredSchedules);
    }
  }, [schedules, selectedDate]);

  const markAs = (
    id: number,
    status: "Taken" | "Missed",
    quantity: string | undefined,
    timeTaken: string | undefined
  ) => {
    setSchedule((prevSchedule) =>
      prevSchedule.map((sched) =>
        sched.schedId === id
          ? {
              ...sched,
              notified: true,
              qtyTaken: quantity,
              timeTaken: timeTaken ?? undefined,
            }
          : sched
      )
    );
    Alert.alert("Medication Updated", `Marked as ${status}.`);
  };

  const handleMissedDose = (sched: MedSchedSchema) => {
    const now = new Date();
    const doseTime = new Date(`1970-01-01T${sched.time}:00`);

    if (now.getTime() - doseTime.getTime() > 3600000) {
      Alert.alert(
        "Missed Dose",
        "It seems you missed this dose. Since the next dose is close, you may want to take it at the scheduled time."
      );
    } else {
      Alert.alert("Missed Dose", "You can take the missed dose now.");
    }
  };

  const handleTakenPress = (sched: MedSchedSchema) => {
    setSelectedSchedule(sched);
    setTempQuantity("");
    setTempTime("");
    setTakenModalVisible(true);
  };

  const handleMissedPress = (sched: MedSchedSchema) => {
    setSelectedSchedule(sched);
    setMissedModalVisible(true);
  };

  const handleTakenSubmit = () => {
    if (selectedSchedule) {
      markAs(selectedSchedule.schedId!, "Taken", tempQuantity, tempTime);
      setTakenModalVisible(false);
    }
  };

  const handleMissedSubmit = () => {
    if (selectedSchedule && missedAction) {
      if (missedAction === "take") {
        handleMissedDose(selectedSchedule);
      }
      markAs(selectedSchedule.schedId!, "Missed", undefined, undefined);
      setMissedModalVisible(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.heading}>Welcome to MediBuddy!</Text>
      <Calendar
        markedDates={{
          [selectedDate || ""]: { selected: true, selectedColor: "#007bff" },
        }}
        onDayPress={onDateSelect}
        style={styles.calendar}
        theme={{
          textDayFontSize: 18,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 16,
        }}
      />

      <View style={styles.listContainer}>
        {schedule.length > 0 ? (
          <FlatList
            data={schedule}
            keyExtractor={(item) => item.schedId?.toString() || ""}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.medicationItem,
                  item.taken && styles.takenBackground,
                  item.timeTaken === null && styles.missedBackground,
                ]}
              >
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationText}>
                    {medications.find((med) => med.medId === item.medId)?.name}{" "}
                    - {item.medicine?.dose} {item.medicine?.unit}
                  </Text>
                  <Text style={styles.medicationTime}>
                    {item.time}
                    Time:{" "}
                    {new Date(`1970-01-01T${item.time}`).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit", hour12: true }
                    )}
                  </Text>
                </View>

                {item.taken && (
                  <Text
                    style={[
                      styles.statusText,
                      item.taken === true
                        ? styles.takenText
                        : styles.missedText,
                    ]}
                  >
                    {item.taken ? "Taken" : "Missed"}
                  </Text>
                )}

                {!item.taken && (
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.missedButton}
                      onPress={() => handleMissedPress(item)}
                    >
                      <Text style={styles.buttonText}>Missed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.takenButton}
                      onPress={() => handleTakenPress(item)}
                    >
                      <Text style={styles.buttonText}>Taken</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>
            No medications scheduled for this day.
          </Text>
        )}
      </View>

      <Modal
        visible={takenModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTakenModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark as Taken</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Quantity Taken"
              keyboardType="numeric"
              value={tempQuantity}
              onChangeText={setTempQuantity}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Time Taken (HH:MM)"
              value={tempTime}
              onChangeText={setTempTime}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setTakenModalVisible(false)}
              >
                <Text style={[styles.buttonText, { textAlign: "center" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleTakenSubmit}
              >
                <Text style={[styles.buttonText, { textAlign: "center" }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={missedModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMissedModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Missed Dose Action</Text>
            <TouchableOpacity
              style={[
                styles.actionButton,
                missedAction === "skip" && styles.selectedAction,
              ]}
              onPress={() => setMissedAction("skip")}
            >
              <Text style={styles.actionButtonText}>Skip Dose</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                missedAction === "take" && styles.selectedAction,
              ]}
              onPress={() => setMissedAction("take")}
            >
              <Text style={styles.actionButtonText}>Take Dose</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setMissedModalVisible(false)}
              >
                <Text style={[styles.buttonText, { textAlign: "center" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleMissedSubmit}
              >
                <Text style={[styles.buttonText, { textAlign: "center" }]}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  heading: {
    marginTop: 35,
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: 16,
    alignSelf: "center",
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  calendar: {
    marginBottom: 16,
    width: "100%",
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#f4f4f4",
  },
  listContainer: {
    flex: 1,
  },
  medicationItem: {
    flexDirection: "column",
    justifyContent: "flex-start",
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    position: "relative",
  },
  medicationDetails: {
    paddingBottom: 15,
  },
  medicationText: {
    fontSize: width * 0.055,
    fontWeight: "bold",
  },
  medicationTime: {
    fontSize: width * 0.05,
    color: "black",
  },
  takenButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: "50%",
  },
  missedButton: {
    backgroundColor: "#FF5722",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: "50%",
  },
  buttonText: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  takenBackground: {
    backgroundColor: "rgba(53, 255, 168, 0.9)",
  },
  missedBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  statusText: {
    position: "absolute",
    top: 10,
    right: 10,
    fontWeight: "bold",
    fontSize: width * 0.045,
  },
  takenText: {
    color: "#4CAF50",
  },
  missedText: {
    color: "#FF5722",
  },
  noDataText: {
    textAlign: "center",
    color: "#888",
    fontSize: width * 0.05,
  },
  buttonsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: 5,
  },
  quantityInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingLeft: 10,
    fontSize: width * 0.045,
  },
  timeInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingLeft: 10,
    fontSize: width * 0.045,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: width * 0.8,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: width * 0.045,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    width: "48%",
  },
  cancelButton: {
    backgroundColor: "#FF5722",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  actionButton: {
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  selectedAction: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196F3",
  },
  actionButtonText: {
    fontSize: width * 0.045,
    textAlign: "center",
  },
});
