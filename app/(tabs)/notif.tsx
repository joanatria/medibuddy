import React, { useEffect } from 'react';
import { View, Button, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  // Request permissions for notifications
  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Notifications will not work without permissions.');
      } else {
        console.log('Permission granted');
      }
    };

    requestPermission();
  }, []);

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification triggered on button click.",
      },
      trigger: {
        type: 'timeInterval',  // Explicitly define the type as 'timeInterval'
        seconds: 2,  // Trigger after 2 seconds
      },
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button title="Send Notification" onPress={sendNotification} />
    </View>
  );
};

export default App;