import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";  
import { medSchedSchema } from "@/validation/schedule";

export default function Settings() {
  const [pdfUri, setPdfUri] = useState(null); 
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await AsyncStorage.clear();
            router.push("/");
          } catch (error) {
            console.error("Error logging out:", error);
          }
        },
      },
    ]);
  };

  const generateFilename = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split("T")[0];
    return `UserReport_${formattedDate}.pdf`;
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
              const medSchedDummyData = {
                schedId: 1,
                medId: 1,
                medicine: {
                  medId: 1,
                  userId: 12345,
                  user: {
                    firstName: "John",
                    middleName: "Doe",
                    lastName: "Smith",
                    username: "johndoe",  
                    email: "john.doe@example.com",
                    password: "securepassword123"  
                  },
                  name: "Paracetamol",
                  description: "Pain reliever",
                  instructions: "Take 1 tablet every 6 hours",
                  dose: "500mg",
                  requiredQty: "30",
                  initialQty: "30",
                  currentQty: "20",
                  unit: "tablet",
                  createdAt: "2024-01-01T08:00:00Z",
                  updatedAt: "2024-01-01T08:00:00Z",
                  attachments: "attachmentLink",
                  fileType: "pdf",
                  files: [new Uint8Array([1, 2, 3])] 
                },
                day: "2024-01-01",
                time: "08:00",
                timeTaken: "2024-01-01T08:00:00Z",
                taken: true,
                qtyTaken: "1",
                action: "Taken",
                createdAt: "2024-01-01T08:00:00Z",
                updatedAt: "2024-01-01T08:00:00Z"
              };              

              medSchedSchema.parse(medSchedDummyData);
              // Define a function to get full name from user data
              const getFullName = (user) => `${user.firstName} ${user.middleName} ${user.lastName}`;
  
              // Create the HTML content using the dummy data
              const htmlContent = `
              <html>
                <head>
                  <style>
                    body {
                      font-family: Arial, sans-serif;
                      margin: 0.75in; 
                    }
            
                    h1 {
                      font-size: 25px; /* Heading font size */
                      text-align: center;
                      
                    }
            
                    h2 {
                      font-size: 20px; /* Subheading font size */
                    }
            
                    p {
                      font-size: 16px; /* Content font size */
                      margin-left: 15px
                    }
            
                    table {
                      width: 100%;
                      border-collapse: collapse;
                    }
            
                    th, td {
                      padding: 8px;
                      text-align: left;
                      border: 1px solid #ddd;
                      font-size: 16px; /* Table content font size */
                    }
            
                    th {
                      background-color: #f2f2f2;
                    }
                  </style>
                </head>
                <body>
                  <h1>Medication Report</h1>
                  <br/>
                  <h2>Patient Information</h2>
                  <p><strong>Patient Name:</strong> ${getFullName(medSchedDummyData.medicine.user)}</p>
                  <br/>
                  <h2>Medication Details</h2>
                  <p><strong>Medication Name:</strong> ${medSchedDummyData.medicine.name}</p>
                  <p><strong>Description:</strong> ${medSchedDummyData.medicine.description}</p>
                  <p><strong>Instructions:</strong> ${medSchedDummyData.medicine.instructions}</p>
                  <p><strong>Dosage:</strong> ${medSchedDummyData.medicine.dose}</p>

                  <br/>
                  <h2>Schedule</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Taken</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>${medSchedDummyData.day}</td>
                        <td>${medSchedDummyData.time}</td>
                        <td>${medSchedDummyData.taken ? "Yes" : "No"}</td>
                        <td>${medSchedDummyData.action}</td>
                      </tr>
                    </tbody>
                  </table>
                </body>
              </html>
            `;            
  
              // Generate the PDF from the HTML content
              const { uri } = await Print.printToFileAsync({
                html: htmlContent,
              });
  
              // Custom file name
              const newFilename = generateFilename();
              const newUri = FileSystem.documentDirectory + newFilename;
  
              // Move the file to the new location with the custom filename
              await FileSystem.moveAsync({
                from: uri,
                to: newUri,
              });
  
              // Save the new PDF URI to state
              setPdfUri(newUri);
  
              console.log("Report generated at:", newUri);
            } catch (error) {
              console.error("Error generating report:", error);
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
    fontSize: width * 0.05,
    fontWeight: "bold",
    marginBottom: 40,
  },
  optionContainer: {
    paddingVertical: 15,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center", // Align icon and text horizontally
  },
  optionText: {
    color: "#000",
    fontSize: width * 0.045,
    fontWeight: "bold",
    flex: 1, // This ensures text takes up available space
  },
  arrowText: {
    color: "#666",
    fontSize: width * 0.035,
    textAlign: "right", // Align arrow text to the right
    paddingTop: 8,
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