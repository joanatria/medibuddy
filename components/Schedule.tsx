import { MedSchedSchema } from "@/validation/schedule";
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Switch,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface ScheduleModalProps {
  schedules: MedSchedSchema[];
  setSchedules: React.Dispatch<React.SetStateAction<MedSchedSchema[]>>;
  visible: boolean;
  onClose: () => void;
}

const ScheduleModal = ({
  schedules,
  setSchedules,
  visible,
  onClose,
}: ScheduleModalProps) => {
  const [editSchedule, setEditSchedule] = useState<number | undefined>(
    undefined
  ); // Schedule being edited
  const [tempSchedule, setTempSchedule] = useState<MedSchedSchema>({
    medId: 0,
    schedId: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    medicine: undefined,
    day: "",
    time: "",
    qtyTaken: "",
    action: "",
    taken: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleEdit = (schedule: MedSchedSchema) => {
    setTempSchedule({ ...schedule });
    setEditSchedule(schedule.schedId);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}sched/update/${tempSchedule.schedId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(tempSchedule),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      const updatedSchedule = await response.json();

      setSchedules((prev) =>
        prev.map((sched) =>
          sched.schedId === updatedSchedule.schedId ? updatedSchedule : sched
        )
      );
      setEditSchedule(undefined);
    } catch (error) {
      console.error("Error updating schedule:", error);
    }
  };

  const handleCancel = () => {
    setEditSchedule(undefined);
    setTempSchedule({} as MedSchedSchema);
  };

  const handleDateChange = (date: Date) => {
    setTempSchedule((prev) => ({
      ...prev,
      day: date.toISOString().split("T")[0],
    }));
    setShowDatePicker(false);
  };

  const handleTimeChange = (time: Date) => {
    setTempSchedule((prev) => ({
      ...prev,
      time: time.toISOString().split("T")[1].substring(0, 5),
    }));
    setShowTimePicker(false);
  };

  const renderScheduleItem = ({ item }: { item: MedSchedSchema }) => {
    const isEditing = editSchedule === item.schedId;

    return (
      <View style={styles.scheduleItem}>
        {isEditing ? (
          <>
            <Text style={styles.label}>Day</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>
                {tempSchedule.day
                  ? new Date(tempSchedule.day).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Select a day"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>
                {tempSchedule.time
                  ? new Date(
                      `1970-01-01T${tempSchedule.time}Z`
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })
                  : "Select a time"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Quantity Taken</Text>
            <TextInput
              style={styles.input}
              value={tempSchedule.qtyTaken}
              onChangeText={(text) =>
                setTempSchedule((prev) => ({ ...prev, qtyTaken: text }))
              }
              keyboardType="numeric"
            />

            <Text style={styles.label}>Action</Text>
            <TextInput
              style={styles.input}
              value={tempSchedule.action}
              onChangeText={(text) =>
                setTempSchedule((prev) => ({ ...prev, action: text }))
              }
            />

            <View style={styles.switchContainer}>
              <Switch
                value={tempSchedule.taken}
                onValueChange={(value) =>
                  setTempSchedule((prev) => ({ ...prev, taken: value }))
                }
              />
              <Text style={styles.label}>Taken</Text>
            </View>

            <View
              style={[
                styles.actionButtons,
                { marginTop: 10, justifyContent: "flex-end", gap: 10 },
              ]}
            >
              <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.scheduleText}>
              Day:{" "}
              {item.day
                ? new Date(item.day).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Not set"}
            </Text>
            <Text style={styles.scheduleText}>
              Time:{" "}
              {item.time
                ? new Date(`1970-01-01T${item.time}Z`).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }
                  )
                : "Not set"}
            </Text>
            <Text style={styles.scheduleText}>
              Quantity Taken: {item.qtyTaken || "Not set"}
            </Text>
            <Text style={styles.scheduleText}>
              Action: {item.action || "Not set"}
            </Text>
            <Text style={styles.scheduleText}>
              Taken: {item.taken ? "Yes" : "No"}
            </Text>
            <TouchableOpacity
              onPress={() => handleEdit(item)}
              style={styles.editBtn}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Schedules</Text>
        <FlatList
          data={schedules}
          keyExtractor={(item) => (item.schedId ?? "").toString()}
          renderItem={renderScheduleItem}
        />
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateChange}
        onCancel={() => setShowDatePicker(false)}
      />
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        onConfirm={handleTimeChange}
        onCancel={() => setShowTimePicker(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  scheduleItem: {
    marginBottom: 15,
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  scheduleText: {
    fontSize: 16,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelBtn: {
    backgroundColor: "#ff5c5c",
    padding: 10,
    borderRadius: 5,
  },
  saveBtn: {
    backgroundColor: "#4ebc85",
    padding: 10,
    borderRadius: 5,
  },
  editBtn: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  closeBtn: {
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 5,
    justifyContent: "flex-end",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
});

export default ScheduleModal;
