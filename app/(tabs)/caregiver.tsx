import { carerSchema, CarerSchema } from "@/validation/carer";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useEffect, useState } from "react";
import Checkbox from "expo-checkbox";

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
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { set, z } from "zod";
import { Ionicons } from "@expo/vector-icons";

export default function CaregiverTab() {
  const [userId, setUserId] = useState<number>(0);
  const [caregivers, setCaregivers] = useState<CarerSchema[]>([]);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteId, setDeleteId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      let numberId = Number(id);
      setUserId(numberId);
    };
    fetchUserId();
  }, []);
  const [formData, setFormData] = useState<CarerSchema>({
    userId: userId,
    firstName: "",
    lastName: "",
    email: "",
    relationship: "",
    notify: false,
  });
  const handleInputChange = (key: string, value: string | boolean) => {
    setFormData({ ...formData, [key]: value, userId: userId });
    try {
      (carerSchema as any).pick({ [key]: true }).parse({ [key]: value });
      setErrors((prevErrors) => ({ ...prevErrors, [key]: "" }));
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [key]: e.errors[0].message,
        }));
      }
    }
  };

  const handleAddCaregiver = async () => {
    try {
      carerSchema.parse(formData);

      const url = editingId
        ? `${process.env.EXPO_PUBLIC_API_URL}carer/update/${editingId}`
        : `${process.env.EXPO_PUBLIC_API_URL}carer`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }

      Alert.alert(
        "Success",
        editingId ? "Caregiver updated" : "Caregiver added"
      );
      clearForm();
      handleCloseModal();
      fetchCaregivers();
    } catch (e) {
      if (e instanceof z.ZodError) {
        Alert.alert("Error", e.errors.map((error) => error.message).join("\n"));
      } else {
        Alert.alert("Error", (e as Error).message);
      }
    }
  };

  const handleEditNotif = async (notifyNew: boolean, carerId: number) => {
    try {
      const url = `${process.env.EXPO_PUBLIC_API_URL}carer/update/${carerId}`;
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notify: notifyNew }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }

      Alert.alert(
        "Success",
        notifyNew === true
          ? "Caregiver set to notify"
          : "Caregiver set to not notify"
      );
      clearForm();
      fetchCaregivers();
    } catch (e) {
      if (e instanceof z.ZodError) {
        Alert.alert("Error", e.errors.map((error) => error.message).join("\n"));
      } else {
        Alert.alert("Error", (e as Error).message);
      }
    }
  };

  const handleDeleteCaregiver = async (id: number) => {
    try {
      const url = `${process.env.EXPO_PUBLIC_API_URL}carer/delete/${id}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Operation failed");
      }

      fetchCaregivers();
      setDeleteModalVisible(false);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const handleOpenDeleteModal = (id: number) => {
    setDeleteId(id);
    setDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeleteId(undefined);
  };

  const handleGetInfo = async (id: number) => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}carer/${id}`
      );
      const caregiver = await response.json();
      setFormData({
        userId: userId,
        firstName: caregiver.firstName,
        lastName: caregiver.lastName,
        email: caregiver.email,
        relationship: caregiver.relationship,
        notify: caregiver.notify,
      });
      setEditingId(id);
      handleOpenModal();
    } catch (error) {
      console.error("Error fetching caregiver:", error);
    }
  };

  const clearForm = () => {
    setFormData({
      userId: userId,
      firstName: "",
      lastName: "",
      email: "",
      relationship: "",
      notify: false,
    });
    setEditingId(undefined);
  };
  const fetchCaregivers = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}carer/user/${userId}`
      );
      const allCaregivers = await response.json();
      console.log(allCaregivers);
      setCaregivers(allCaregivers);
    } catch (error) {
      console.error("Error fetching caregivers:", error);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, [userId]);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    clearForm();
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons
                name={editingId ? "pencil" : "add-circle"}
                size={24}
                color={editingId ? "black" : "green"}
              />
              <Text style={styles.modalHeader}>
                {editingId ? "Edit Caregiver" : "Add Caregiver"}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                placeholderTextColor="#5A5A5A"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange("firstName", value)}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                placeholderTextColor="#5A5A5A"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange("lastName", value)}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#5A5A5A"
                value={formData.email}
                onChangeText={(value) => handleInputChange("email", value)}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter relationship (e.g., parent, sibling)"
                placeholderTextColor="#5A5A5A"
                value={formData.relationship}
                onChangeText={(value) =>
                  handleInputChange("relationship", value)
                }
              />
              {errors.relationship && (
                <Text style={styles.errorText}>{errors.relationship}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleInputChange("notify", !formData.notify)}
              >
                <Checkbox
                  style={styles.checkbox}
                  value={formData.notify}
                  onValueChange={(value) => handleInputChange("notify", value)}
                />

                <Text style={styles.notifyText}>
                  Notify in case of missed medication
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddCaregiver}
              >
                <Text style={styles.buttonText}>
                  {editingId ? "Update" : "Add"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>
              Are you sure you want to delete this caregiver?
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  deleteId !== undefined && handleDeleteCaregiver(deleteId)
                }
              >
                <Text style={styles.buttonText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleCloseDeleteModal}
              >
                <Text style={styles.buttonText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Text style={styles.heading}>Caregivers</Text>
      <TouchableOpacity style={styles.openButton} onPress={handleOpenModal}>
        <Text style={styles.buttonText}>Add Caregiver</Text>
      </TouchableOpacity>
      <FlatList
        data={caregivers}
        keyExtractor={(item) => item.carerId?.toString() || ""}
        renderItem={({ item }) => (
          <View style={styles.caregiverItem}>
            <View>
              <Text style={styles.caregiverName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.caregiverText}>{item.email}</Text>
              <Text style={styles.caregiverText}>
                Relationship: {item.relationship}
              </Text>
              <View style={{ marginTop: 3 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                  onPress={() => handleInputChange("notify", !formData.notify)}
                >
                  <Checkbox
                    style={{
                      width: 15,
                      height: 15,
                      marginRight: 8,
                      marginTop: 3,
                    }}
                    value={item.notify}
                    onValueChange={(value) => {
                      if (item.carerId !== undefined) {
                        handleEditNotif(value, item.carerId);
                      }
                    }}
                  />

                  <Text style={styles.notifyText}>Notify</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => {
                  if (item.carerId) {
                    setEditingId(item.carerId);
                    handleGetInfo(item.carerId);
                  }
                }}
              >
                <MaterialCommunityIcons
                  style={{ marginRight: 5 }}
                  name="pencil"
                  size={15}
                  color="white"
                />
                <Text style={styles.actionButtonText}> Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() =>
                  item.carerId !== undefined &&
                  handleOpenDeleteModal(item.carerId)
                }
              >
                <MaterialCommunityIcons
                  style={{ marginRight: 5 }}
                  name="delete"
                  size={15}
                  color="white"
                />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.noDataText}>No caregivers added yet.</Text>
        }
      />
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingBottom: 80,
    flexGrow: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
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
    marginBottom: 2,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    fontSize: width * 0.045,
    color: "#333",
  },
  dropdownContainer: {
    height: 40,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: width * 0.04,
  },
  dropdownList: {
    backgroundColor: "#FFF",
    borderColor: "#ccc",
  },
  dropdownText: {
    fontSize: width * 0.04,
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
    backgroundColor: "gray",
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
  caregiverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  caregiverText: {
    fontSize: width * 0.04,
  },
  actionButtons: {
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: 80,
    justifyContent: "center",

    alignItems: "flex-start",
  },
  editButton: {
    backgroundColor: "#ffc107",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    flexDirection: "row",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.03,
  },
  noDataText: {
    textAlign: "center",
    fontSize: width * 0.04,
    color: "#777",
  },
  notifyText: {
    fontSize: width * 0.04,
    color: "teal",
  },
  errorText: {
    color: "red",
    fontSize: width * 0.035,
    marginTop: -8,
    marginBottom: 8,
    width: "90%",
  },
  caregiverName: {
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalHeader: {
    fontSize: width * 0.05,
    marginRight: 10,
    gap: 10,
    fontWeight: "bold",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  openButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
});
