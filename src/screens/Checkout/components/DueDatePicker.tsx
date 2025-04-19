// src/screens/Checkout/components/DueDatePicker.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";

interface DueDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DueDatePicker = ({ selectedDate, onDateChange }: DueDatePickerProps) => {
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };
  
  // Format date for the calendar (YYYY-MM-DD)
  const formatCalendarDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };
  
  // Current date formatted for the calendar
  const currentFormattedDate = formatCalendarDate(selectedDate);
  
  // Handle date selection from calendar
  const handleDateSelect = (day: any) => {
    // Fix timezone issues by ensuring date is set properly using local time
    const dateString = day.dateString; // Format: YYYY-MM-DD
    const [year, month, date] = dateString.split("-").map((num: string) => parseInt(num, 10));
    
    // Create a date at noon to avoid timezone issues
    const adjustedDate = new Date(year, month - 1, date, 12, 0, 0);
    
    onDateChange(adjustedDate);
    setShowCalendar(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Due Date:</Text>
      
      <TouchableOpacity 
        style={styles.dateSelector}
        onPress={() => setShowCalendar(true)}
      >
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        <Ionicons name="calendar" size={24} color="#4CAF50" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showCalendar}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Due Date</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Calendar
              current={currentFormattedDate}
              minDate={formatCalendarDate(new Date())}
              onDayPress={handleDateSelect}
              markedDates={{
                [currentFormattedDate]: { selected: true, selectedColor: "#4CAF50" }
              }}
              theme={{
                todayTextColor: "#4CAF50",
                selectedDayBackgroundColor: "#4CAF50",
                dotColor: "#4CAF50",
                arrowColor: "#4CAF50",
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginRight: 10,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    maxWidth: 350,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
});

export default DueDatePicker;