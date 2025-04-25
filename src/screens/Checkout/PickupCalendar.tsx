// src/screens/Checkout/PickupCalendar.tsx
// Update the PickupCalendar component props interface

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

// Update the props interface to match the expected props
export interface PickupCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

const PickupCalendar: React.FC<PickupCalendarProps> = ({ 
  selectedDate, 
  onSelectDate 
}) => {
  // Format selected date for the calendar
  const formattedSelectedDate = selectedDate 
    ? selectedDate.toISOString().split('T')[0] 
    : undefined;
  
  // Create marked dates object for the calendar
  const markedDates = formattedSelectedDate 
    ? { [formattedSelectedDate]: { selected: true, selectedColor: '#4CAF50' } } 
    : {};
  
  // Handle date selection
  const handleDayPress = (day: any) => {
    const newDate = new Date(day.dateString);
    onSelectDate(newDate);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Pickup Date</Text>
      
      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        minDate={new Date().toISOString().split('T')[0]}
        theme={{
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
          selectedDayBackgroundColor: '#4CAF50',
        }}
      />
      
      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateLabel}>Pickup Date:</Text>
          <Text style={styles.selectedDateValue}>
            {selectedDate.toLocaleDateString(undefined, { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  selectedDateContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  selectedDateLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedDateValue: {
    color: '#4CAF50',
  },
});

export default PickupCalendar;
