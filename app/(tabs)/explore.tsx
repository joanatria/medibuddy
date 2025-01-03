import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";  
import { medicineSchema, MedicineSchema } from "@/validation/medicine";

export default function Settings() {
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const [medications, setMedications] = useState<MedicineSchema[]>([]);
  const [filteredMedications, setFilteredMedications] = useState<
    MedicineSchema[]
  >([]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem("userId");
        const numberId = id ? Number(id) : null;
        setUserId(numberId);
      } catch (error) {
        console.error("Error fetching userId from AsyncStorage", error);
      }
    };
    fetchUserId();
  }, []);

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

  useEffect(() => {
    if (userId) {
      fetchMedications();
    }
  }, [userId]);  

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          if (userId !== null) {
            try {
              // Make API call to logout
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}logout?userId=${userId}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
              });
  
              // Check the response text
              const responseText = await response.text();
              console.log("API response:", responseText);
  
              // Handle response indicating the user is already logged out
              if (responseText === "User not found or already logged out") {
                await AsyncStorage.clear();
                console.log("AsyncStorage cleared (User already logged out)");
                router.replace("/app"); 
              } else if (!response.ok) {
                throw new Error("Failed to log out");
              } else {
                // If the response is valid, clear AsyncStorage
                await AsyncStorage.clear();
                console.log("AsyncStorage cleared after successful logout");
  
                // Show success alert before routing
                Alert.alert("Success", "You have been logged out successfully.", [
                  {
                    text: "OK",
                    onPress: () => {
                      console.log("Navigating to login page...");
                      router.replace("/app"); 
                    },
                  },
                ]);
              }
            } catch (error) {
              console.error("Error logging out:", error);
            }
          }
        },
      },
    ]);
  };

  const handleGenerateReport = async () => {
    Alert.alert(
      "Generate Report",
      "Are you sure you want to generate the report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            try {
              const response = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}med/user/${userId}`
              );
  
              if (!response.ok) {
                Alert.alert("Error", "Failed to fetch medications.");
                return;
              }
  
              const data = await response.json();
  
              if (data.length === 0) {
                Alert.alert("No medications found", "Please add medications first.");
                return;
              }
  
              const fullName = `${data[0]?.user?.firstName || "N/A"} ${data[0]?.user?.middleName || ""} ${data[0]?.user?.lastName || "N/A"}`.trim();
  
              let medicationDetails = "";
  
              for (const med of data) {
                console.log("Processing medication:", med);
  
                const { medId, name, description, instructions, dose, unit } = med;
  
                if (!medId) {
                  console.error("Medication ID is missing or undefined:", med);
                  continue;
                }
  
                const instructionsArray = instructions?.split(", ") || [];
                if (instructionsArray.length !== 4) {
                  console.error("Invalid instruction format for medication:", med);
                  continue;
                }
  
                const [days, times, frequency, startDate] = instructionsArray;
  
                // Fetch all schedules for the current medication
                const scheduleResponse = await fetch(
                  `${process.env.EXPO_PUBLIC_API_URL}sched/med/${medId}`
                );
  
                let schedules = [];
                if (scheduleResponse.ok) {
                  schedules = await scheduleResponse.json();
                } else {
                  console.error(`Failed to fetch schedules for medication: ${medId}`);
                }
  
                const scheduleRows = schedules.length
                  ? schedules
                      .map((schedule) => {
                        const scheduleDate = new Date(schedule.day).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        );
  
                        const scheduleTime = new Date(`1970-01-01T${schedule.time || "00:00:00"}`).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          }
                        );
  
                        return `
                          <tr>
                            <td>${scheduleDate}</td>
                            <td>${scheduleTime}</td>
                            <td>${schedule.taken ? "Yes" : "No"}</td>
                            <td>${schedule.action || "N/A"}</td>
                          </tr>
                        `;
                      })
                      .join("")
                  : "<tr><td colspan='4'>No schedules available</td></tr>";
  
                medicationDetails += `
                  <div class="section">
                    <p><strong>Medication Name:</strong> ${name}</p>
                    <p><strong>Description:</strong> ${description}</p>
                    <p><strong>Instructions:</strong> Take ${dose} ${unit}, ${frequency}</p>
                    <p>${times} times a day for ${days} days starting ${new Date(startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}.</p>
                    <h3>Schedule</h3>
                    <table class="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Taken</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${scheduleRows}
                      </tbody>
                    </table>
                  </div>`;
              }
  
              const htmlContent = `
                <html>
                  <head>
                    <style>
                      @page {
                        size: Legal;
                        margin: 0.75in;
                      }
                      body {
                        font-family: Arial, sans-serif;
                        margin: 0.75in;
                      }
                      h1, h2, h3 {
                        text-align: center;
                      }
                      .section {
                        margin-bottom: 20px;
                      }
                      .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                      }
                      .table th, .table td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: center;
                      }
                      .table th {
                        background-color: #f2f2f2;
                        font-weight: bold;
                      }
                    </style>
                  </head>
                  <body>
                    <h1>Medication Report</h1>
                    <div class="section">
                      <h2>Patient Information</h2>
                      <p><strong>Patient Name:</strong> ${fullName}</p>
                    </div>
                    <div class="section">
                      <h2>All Medications</h2>
                      ${medicationDetails}
                    </div>
                  </body>
                </html>
              `;
  
              const { uri } = await Print.printToFileAsync({ html: htmlContent });
              const newUri = `${FileSystem.documentDirectory}${fullName}_Report.pdf`;
              await FileSystem.moveAsync({ from: uri, to: newUri });
  
              console.log("Report saved at:", newUri);
              setPdfUri(newUri);
            } catch (error) {
              console.error("Error generating report:", error);
              Alert.alert("Error", "Failed to generate the report.");
            }
          },
        },
      ]
    );
  };
  
  
  
  // Function to open the PDF in the default viewer
  const openPdf = async () => {
    if (pdfUri) {
      // Open the PDF with the native PDF viewer
      await Sharing.shareAsync(pdfUri);
    } else {
      Alert.alert("No Report", "The report has not been generated yet.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      {/* Generate Report */}
      <TouchableOpacity onPress={handleGenerateReport}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <Text>
              <FontAwesome
                name="file-text"
                size={24}
                color="#000"
                style={styles.icon}
              />{" "}
            </Text>
            <Text style={styles.optionText}>Generate Report</Text>
            <Text style={styles.arrowText}>{">"}</Text>
          </View>
          <Text style={styles.optionDescription}>
            Generate a report for user medications.
          </Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>

      {/* Open/View Generated Report */}
      {pdfUri && (
        <TouchableOpacity onPress={openPdf}>
          <View style={styles.optionContainer}>
            <View style={styles.optionRow}>
              <Text>
                <FontAwesome
                  name="file-pdf-o"
                  size={24}
                  color="#000"
                  style={styles.icon}
                />{" "}
              </Text>
              <Text style={styles.optionText}>View/Download Report</Text>
              <Text style={styles.arrowText}>{">"}</Text>
            </View>
            <Text style={styles.optionDescription}>
              View or download the generated PDF report.
            </Text>
            <View style={styles.separator} />
          </View>
        </TouchableOpacity>
      )}

      {/* Check Pharmacies */}
      <TouchableOpacity onPress={() => router.push("/pharmacy")}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <Text>
              <FontAwesome
                name="hospital-o"
                size={24}
                color="#000"
                style={styles.icon}
              />{" "}
            </Text>
            <Text style={styles.optionText}>Check Pharmacies</Text>
            <Text style={styles.arrowText}>{">"}</Text>
          </View>
          <Text style={styles.optionDescription}>
            View available pharmacies and their available medicine.
          </Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>

      {/* Edit Profile */}
      <TouchableOpacity onPress={() => router.push("/editprofile")}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <Text>
              <FontAwesome
                name="user"
                size={24}
                color="#000"
                style={styles.icon}
              />{" "}
            </Text>
            <Text style={styles.optionText}>Edit Profile</Text>
            <Text style={styles.arrowText}>{">"}</Text>
          </View>
          <Text style={styles.optionDescription}>
            Update your personal and account information.
          </Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout}>
        <View style={styles.optionContainer}>
          <View style={styles.optionRow}>
            <Text>
              <FontAwesome
                name="sign-out"
                size={24}
                color="#000"
                style={styles.icon}
              />{" "}
            </Text>
            <Text style={styles.optionText}>Logout</Text>
            <Text style={styles.arrowText}>{">"}</Text>
          </View>
          <Text style={styles.optionDescription}>
            Sign out of your account.
          </Text>
          <View style={styles.separator} />
        </View>
      </TouchableOpacity>
    
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingBottom: 100,
  },
  heading: {
    marginTop: 35,
    textAlign: "center",
    fontSize: width * 0.06,
    fontWeight: "bold",
    marginBottom: 40,
  },
  optionContainer: {
    paddingVertical: 15,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center", 
  },
  optionText: {
    color: "#000",
    fontSize: width * 0.05,
    fontWeight: "bold",
    flex: 1, 
  },
  arrowText: {
    color: "#666",
    fontSize: width * 0.035,
    textAlign: "right", 
    paddingTop: 10,
  },
  optionDescription: {
    color: "#666",
    fontSize: width * 0.035,
    textAlign: "left",
    marginTop: 5,
  },
  separator: {
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  icon: {
    marginRight: 10, 
  },
});