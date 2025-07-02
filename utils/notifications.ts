import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permissions not granted");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("medication-reminders", {
        name: "Medication Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
        sound: "default",
      });
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
}

export async function scheduleMedicationReminder(
  medication: Medication
): Promise<string[]> {
  if (!medication.reminderEnabled || medication.times.length === 0) {
    return [];
  }

  const identifiers: string[] = [];

  try {
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      console.warn("Notification permissions not granted");
      return [];
    }

    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      
      const triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);

      if (triggerDate < new Date()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "💊 Medication Reminder",
          body: `Time to take ${medication.name} (${medication.dosage})`,
          data: { 
            medicationId: medication.id,
            type: "medication",
            time: time
          },
          sound: "default",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });

      identifiers.push(identifier);
      console.log(`Scheduled reminder for ${medication.name} at ${time} with ID: ${identifier}`);
    }

    return identifiers;
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
    return [];
  }
}

export async function scheduleRefillReminder(
  medication: Medication
): Promise<string | undefined> {
  if (!medication.refillReminder) return;

  try {
    // Only schedule if supply is actually low
    if (medication.currentSupply <= medication.refillAt) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Refill Reminder",
          body: `Your ${medication.name} supply is running low. Only ${medication.currentSupply} left!`,
          data: { 
            medicationId: medication.id, 
            type: "refill",
            currentSupply: medication.currentSupply,
            refillAt: medication.refillAt
          },
          sound: "default",
        },
        trigger: null, // Show immediately
      });

      console.log(`Scheduled refill reminder for ${medication.name} with ID: ${identifier}`);
      return identifier;
    }

    return undefined;
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
    return undefined;
  }
}

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication
): Promise<void> {
  try {
    // Cancel existing reminders for this medication
    await cancelMedicationReminders(medication.id);

    // Schedule new reminders
    if (medication.reminderEnabled) {
      await scheduleMedicationReminder(medication);
    }
    
    if (medication.refillReminder) {
      await scheduleRefillReminder(medication);
    }
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}

// Helper function to get all scheduled notifications for debugging
export async function getScheduledNotifications(): Promise<any[]> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log("All scheduled notifications:", scheduled);
    return scheduled;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
}

// Helper function to cancel all notifications (useful for testing)
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("All notifications cancelled");
  } catch (error) {
    console.error("Error cancelling all notifications:", error);
  }
}

// Helper function to test notifications (useful for development)
export async function sendTestNotification(): Promise<void> {
  try {
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      console.log("Cannot send test notification: permissions not granted");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 Test Notification",
        body: "Your notification system is working correctly!",
        data: { type: "test" },
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: new Date().getHours(),
        minute: new Date().getMinutes() + 1,
      },
      // trigger: null
    });

    console.log("Test notification scheduled");
  } catch (error) {
    console.error("Error sending test notification:", error);
  }
}
