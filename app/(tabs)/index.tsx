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
} from "react-native";
import { Calendar } from "react-native-calendars";
import { ThemedView } from "@/components/ThemedView";
import { MedSchedSchema } from "@/validation/schedule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MedicineSchema } from "@/validation/medicine";

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<MedSchedSchema[]>([]);
  const [medications, setMedications] = useState<MedicineSchema[]>([]);
  const [userId, setUserId] = useState<number>(0);
  const [schedules, setSchedules] = useState<MedSchedSchema[]>([]);

  const onDateSelect = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    const filteredSchedules = schedules.filter(
      (sched) => sched.day === day.dateString
    );
    setSchedule(filteredSchedules);
  };

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
      }
    };
    fetchMedications();
  }, [userId]);

  useEffect(() => {
    const fetchSchedules = async () => {
      const allSchedules: MedSchedSchema[] = [];
      for (const medication of medications) {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}sched/med/${medication.medId}`
        );
        if (response.ok) {
          const data = await response.json();
          allSchedules.push(...data);
        }
      }
      setSchedules(allSchedules);
    };

    if (medications.length > 0) {
      fetchSchedules();
    }
  }, [medications]);

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
                    - {item.qtyTaken || "N/A"}
                  </Text>
                  <Text style={styles.medicationTime}>Time: {item.time}</Text>
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
                  <View style={styles.buttonsContainer}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Quantity Taken</Text>
                      <TextInput
                        style={styles.quantityInput}
                        placeholder="Quantity Taken"
                        keyboardType="numeric"
                        value={item.qtyTaken || ""}
                        maxLength={3}
                        onChangeText={(text) => {
                          const quantity = Math.min(
                            parseInt(text) || 0,
                            parseInt(
                              medications.find(
                                (med) => med.medId === item.medId
                              )?.dose || "0"
                            )
                          );
                          setSchedule((prevSchedule) =>
                            prevSchedule.map((sched) =>
                              sched.schedId === item.schedId
                                ? { ...sched, qtyTaken: quantity.toString() }
                                : sched
                            )
                          );
                        }}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Time Taken</Text>
                      <TextInput
                        style={styles.timeInput}
                        placeholder="HH:MM"
                        keyboardType="numeric"
                        value={item.timeTaken || ""}
                        maxLength={5}
                        onChangeText={(text) => {
                          setSchedule((prevSchedule) =>
                            prevSchedule.map((sched) =>
                              sched.schedId === item.schedId
                                ? { ...sched, timeTaken: text }
                                : sched
                            )
                          );
                        }}
                      />
                    </View>

                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.takenButton}
                        onPress={() =>
                          markAs(
                            item.schedId!,
                            "Taken",
                            item.qtyTaken ?? undefined,
                            item.timeTaken
                          )
                        }
                      >
                        <Text style={styles.buttonText}>Taken</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.missedButton}
                        onPress={() => {
                          handleMissedDose(item);
                          markAs(
                            item.schedId!,
                            "Missed",
                            item.qtyTaken,
                            item.timeTaken
                          );
                        }}
                      >
                        <Text style={styles.buttonText}>Missed</Text>
                      </TouchableOpacity>
                    </View>
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
    paddingBottom: 80,
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
    backgroundColor: "#f9f9f9",
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
    color: "#888",
  },
  takenButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: 160,
  },
  missedButton: {
    backgroundColor: "#FF5722",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: 160,
  },
  buttonText: {
    color: "white",
    fontSize: width * 0.045,
    fontWeight: "bold",
  },
  takenBackground: {
    backgroundColor: "#d4f8e8",
  },
  missedBackground: {
    backgroundColor: "#ffd6d6",
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
    gap: 10,
  },
});
