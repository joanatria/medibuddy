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
  ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { ThemedView } from "@/components/ThemedView";
import { MedSchedSchema } from "@/validation/schedule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicineSchema } from "@/validation/medicine";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HomeScreen = () => {
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
  const [isTakenLoading, setIsTakenLoading] = useState(false);
  const [isMissedLoading, setIsMissedLoading] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    if (selectedDate && !missedModalVisible && !takenModalVisible) {
      const filteredSchedules = schedules.filter(
        (sched) => sched.day === selectedDate
      );
      setSchedule(filteredSchedules);
    }
  }, [schedules, selectedDate, missedModalVisible, takenModalVisible]);

  const triggeredNotifications = new Set(); // Set to track triggered notifications

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Notifications will not work without permissions."
        );
      }
    };

    requestPermission();

    const checkSchedulesAndNotify = () => {
      const now = new Date();

      schedules.forEach((schedule, index) => {
        if (
          !schedule.day ||
          !schedule.time ||
          triggeredNotifications.has(index)
        )
          return;

        const [year, month, day] = schedule.day
          .split("-")
          .map((value) => parseInt(value, 10));
        const [hour, minute, second] = schedule.time
          .split(":")
          .map((value) => parseInt(value, 10));

        const scheduleTime = new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          second
        );

        const timeDiffInMinutes =
          (scheduleTime.getTime() - now.getTime()) / (1000 * 60);

        if (
          schedule.medicine?.notifDetails.includes("10 minutes before") &&
          timeDiffInMinutes <= 10 &&
          timeDiffInMinutes > 9 &&
          now.getSeconds() === scheduleTime.getSeconds()
        ) {
          sendNotification(
            schedule.medicine?.name ?? "Medication",
            "10 minutes before",
            schedule.medicine?.dose ?? "",
            schedule.medicine?.unit ?? ""
          );
          triggeredNotifications.add(index); // Mark notification as sent
        }

        if (
          schedule.medicine?.notifDetails.includes("5 minutes before") &&
          timeDiffInMinutes <= 5 &&
          timeDiffInMinutes > 4 &&
          now.getSeconds() === scheduleTime.getSeconds()
        ) {
          sendNotification(
            schedule.medicine?.name ?? "Medication",
            "5 minutes before",
            schedule.medicine?.dose ?? "",
            schedule.medicine?.unit ?? ""
          );
          triggeredNotifications.add(index); // Mark notification as sent
        }

        if (
          schedule.medicine?.notifDetails.includes("Exact time") &&
          timeDiffInMinutes <= 0 &&
          timeDiffInMinutes > -1 &&
          now.getSeconds() === scheduleTime.getSeconds()
        ) {
          sendNotification(
            schedule.medicine?.name ?? "Medication",
            "",
            schedule.medicine?.dose ?? "",
            schedule.medicine?.unit ?? ""
          );
          triggeredNotifications.add(index); // Mark notification as sent
        }
      });
    };

    const timer = setInterval(checkSchedulesAndNotify, 1000); // Check every second

    return () => clearInterval(timer); // Clean up timer on unmount
  }, [schedules]);

  const sendNotification = (
    medicine: string,
    timeInfo: string,
    qty: string,
    unit: string
  ) => {
    Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${medicine}💊!`,
        body: `🕒 ${timeInfo} it's time to take ${qty} ${unit} of ${medicine}. 🩺 Remember, your health matters! 🌟`,
        data: { customData: { medicine, qty, unit } }, // Add custom data if needed
        priority: "high", // Ensure the notification appears prominently
      },
      trigger: null, // Send immediately
    });
  };
  const handleMissedSubmit = async () => {
    if (!selectedSchedule || !missedAction) return;
    setIsMissedLoading(true);

    try {
      if (missedAction === "skip") {
        // Handle skip action
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}sched/check-taken/${selectedSchedule.schedId}/${userId}?isTaken=false&action=Missed: Skipping Dose`,
          {
            method: "PUT",
          }
        );

        if (!response.ok) throw new Error("Failed to process skip action");

        setSchedule((prevSchedule) =>
          prevSchedule.map((sched) =>
            sched.schedId === selectedSchedule.schedId
              ? { ...sched, taken: false }
              : sched
          )
        );

        Alert.alert("Success", "Dose marked as skipped");
        setMissedModalVisible(false);
      } else if (missedAction === "take") {
        // First mark as missed with actual time
        const missedResponse = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}sched/check-taken/${selectedSchedule.schedId}/${userId}?isTaken=false&action=Missed actual time: Dose taken`,
          {
            method: "PUT",
          }
        );

        if (!missedResponse.ok)
          throw new Error("Failed to process missed action");

        // Then open taken modal for quantity input
        setMissedModalVisible(false);
        setTakenModalVisible(true);
        return; // Exit early as taken modal will handle the rest
      }
    } catch (error) {
      console.error("Error handling missed dose:", error);
      Alert.alert("Error", "Failed to process missed dose action");
    } finally {
      setIsMissedLoading(false);
      setMissedAction(null);
    }
  };

  const handleTakenSubmit = async () => {
    if (!selectedSchedule) return;
    setIsTakenLoading(true);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}sched/check-taken/${selectedSchedule.schedId}/${userId}?isTaken=true&qtyTaken=${tempQuantity}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) throw new Error("Failed to mark as taken");

      setSchedule((prevSchedule) =>
        prevSchedule.map((sched) =>
          sched.schedId === selectedSchedule.schedId
            ? {
                ...sched,
                taken: true,
                qtyTaken: tempQuantity,
                timeTaken: tempTime || new Date().toISOString(),
              }
            : sched
        )
      );

      Alert.alert("Success", "Medication marked as taken");
      setTakenModalVisible(false);
      setTempQuantity("");
      setTempTime("");
    } catch (error) {
      console.error("Error marking as taken:", error);
      Alert.alert("Error", "Failed to mark medication as taken");
    } finally {
      setIsTakenLoading(false);
    }
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

  const getScheduleStatus = (schedule: MedSchedSchema) => {
    if (schedule.taken) return "taken";

    const now = new Date();
    const scheduleTime = new Date(`${schedule.day}T${schedule.time}`);

    return now > scheduleTime ? "missed" : "upcoming";
  };

  const handleConfirm = (time: Date) => {
    setTempTime(
      time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
    setShowTimePicker(false);
  };

  const hideDatePicker = () => {
    setShowTimePicker(false);
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
            data={[...schedule].sort((a, b) =>
              (a.time || "").localeCompare(b.time || "")
            )}
            keyExtractor={(item) => item.schedId?.toString() || ""}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.medicationItem,
                  getScheduleStatus(item) === "taken" && styles.takenBackground,
                  getScheduleStatus(item) === "missed" &&
                    styles.missedBackground,
                  getScheduleStatus(item) === "upcoming" &&
                    styles.upcomingBackground,
                ]}
              >
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationText}>
                    {medications.find((med) => med.medId === item.medId)?.name}{" "}
                    - {item.medicine?.dose} {item.medicine?.unit}
                  </Text>
                  <Text style={styles.medicationTime}>
                    Time:{" "}
                    {new Date(`1970-01-01T${item.time}`).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit", hour12: true }
                    )}
                  </Text>
                  <Text
                    style={[
                      styles.statusText,
                      getScheduleStatus(item) === "taken" && styles.takenText,
                      getScheduleStatus(item) === "missed" && styles.missedText,
                      getScheduleStatus(item) === "upcoming" &&
                        styles.upcomingText,
                    ]}
                  >
                    {getScheduleStatus(item).toUpperCase()}
                  </Text>
                </View>

                {!item.taken && (
                  <View
                    style={[
                      styles.actionButtonsContainer,
                      { justifyContent: "flex-end" },
                    ]}
                  >
                    {getScheduleStatus(item) === "missed" && !item.action && (
                      <TouchableOpacity
                        style={styles.missedButton}
                        onPress={() => handleMissedPress(item)}
                      >
                        <Text style={styles.buttonText}>Action</Text>
                      </TouchableOpacity>
                    )}
                    {getScheduleStatus(item) === "missed" && item.action && (
                      <Text
                        style={[
                          styles.missedText,
                          { padding: 10, fontSize: width * 0.045 },
                        ]}
                      >
                        {item.action}
                      </Text>
                    )}
                    {getScheduleStatus(item) === "upcoming" && (
                      <TouchableOpacity
                        style={styles.takenButton}
                        onPress={() => handleTakenPress(item)}
                      >
                        <Text style={styles.buttonText}>Take</Text>
                      </TouchableOpacity>
                    )}
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
        onRequestClose={() => !isTakenLoading && setTakenModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark as Taken</Text>
            {isTakenLoading ? (
              <ActivityIndicator
                size="large"
                color="#4CAF50"
                style={styles.loader}
              />
            ) : (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Quantity Taken"
                  keyboardType="numeric"
                  value={tempQuantity}
                  onChangeText={setTempQuantity}
                />
                <View>
                  <TouchableOpacity
                    onPress={() => setShowTimePicker(true)}
                    style={[{ width: "100%" }]}
                  >
                    <Text style={[styles.modalInput, { color: "gray" }]}>
                      {tempTime || "Time Taken (HH:MM)"}
                    </Text>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={showTimePicker}
                    mode="time"
                    onConfirm={handleConfirm}
                    onCancel={hideDatePicker}
                  />
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setTakenModalVisible(false)}
                    disabled={isTakenLoading}
                  >
                    <Text style={[styles.buttonText, { textAlign: "center" }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleTakenSubmit}
                    disabled={isTakenLoading}
                  >
                    <Text style={[styles.buttonText, { textAlign: "center" }]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={missedModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => !isMissedLoading && setMissedModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Missed Dose Action</Text>
            {isMissedLoading ? (
              <ActivityIndicator
                size="large"
                color="#FF5722"
                style={styles.loader}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    missedAction === "skip" && styles.selectedAction,
                  ]}
                  onPress={() => setMissedAction("skip")}
                  disabled={isMissedLoading}
                >
                  <Text style={styles.actionButtonText}>Skip Dose</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    missedAction === "take" && styles.selectedAction,
                  ]}
                  onPress={() => setMissedAction("take")}
                  disabled={isMissedLoading}
                >
                  <Text style={styles.actionButtonText}>Take Dose</Text>
                </TouchableOpacity>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setMissedModalVisible(false)}
                    disabled={isMissedLoading}
                  >
                    <Text style={[styles.buttonText, { textAlign: "center" }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleMissedSubmit}
                    disabled={isMissedLoading}
                  >
                    <Text style={[styles.buttonText, { textAlign: "center" }]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

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
    paddingTop: 20,
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
    backgroundColor: "#28a745",
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
    backgroundColor: "rgba(180, 255, 195, 0.9)",
  },
  missedBackground: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  upcomingBackground: {
    backgroundColor: "rgba(255, 239, 179, 0.9)",
  },
  statusText: {
    position: "absolute",
    top: 28,
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
  upcomingText: {
    color: "#FF8C00",
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
  loader: {
    marginVertical: 20,
  },
});
export default HomeScreen;
