import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface PickupCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

const PickupCalendar: React.FC<PickupCalendarProps> = ({
  selectedDate,
  onSelectDate
}) => {
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // Generate dates for next 14 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const dates = generateDates();
  
  // Format date for display
  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      isToday: isToday(date),
      isTomorrow: isTomorrow(date)
    };
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Check if date is tomorrow
  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();
  };
  
  // Define a TimeOption type
  interface TimeOption {
    hour: number;
    minute: number;
    timeString: string;
  }

  // Get time options - every 30 minutes from 9 AM to 7 PM
  const getTimeOptions = (): TimeOption[] => {
    const options: TimeOption[] = [];
    const now = new Date();
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip times in the past for today
        if (selectedDate && isToday(selectedDate)) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          if (hour < currentHour || (hour === currentHour && minute < currentMinute)) {
            continue;
          }
        }
        
        const timeString = `${hour % 12 || 12}:${minute === 0 ? '00' : minute} ${hour < 12 ? 'AM' : 'PM'}`;
        options.push({
          hour,
          minute,
          timeString
        });
      }
    }
    
    return options;
  };
  
  // Calculate the soonest available pickup (next day at 9 AM or today if it's before 7 PM)
  const getSoonestPickup = () => {
    const now = new Date();
    const pickup = new Date();
    
    // If it's after 7 PM, set pickup for tomorrow at 9 AM
    if (now.getHours() >= 19) {
      pickup.setDate(pickup.getDate() + 1);
      pickup.setHours(9, 0, 0, 0);
    } 
    // If it's before 9 AM, set pickup for today at 9 AM
    else if (now.getHours() < 9) {
      pickup.setHours(9, 0, 0, 0);
    } 
    // Otherwise, round up to the next 30 minutes
    else {
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 30) * 30;
      pickup.setMinutes(roundedMinutes);
      
      // If rounding pushed us to the next hour
      if (roundedMinutes === 60) {
        pickup.setHours(pickup.getHours() + 1);
        pickup.setMinutes(0);
      }
      
      // If we're past 7 PM after rounding, move to tomorrow
      if (pickup.getHours() >= 19) {
        pickup.setDate(pickup.getDate() + 1);
        pickup.setHours(9, 0, 0, 0);
      }
    }
    
    return pickup;
  };
  
  // Select both date and time to set the complete pickup datetime
  const handleSelectDateTime = (date: Date, hour: number, minute: number) => {
    const pickup = new Date(date);
    pickup.setHours(hour, minute, 0, 0);
    onSelectDate(pickup);
    setShowCalendarModal(false);
  };
  
  // Format the selected date for display
  const formatSelectedDate = () => {
    if (!selectedDate) {
      const soonest = getSoonestPickup();
      return `${soonest.toLocaleDateString()} at ${soonest.getHours() % 12 || 12}:${soonest.getMinutes() === 0 ? '00' : soonest.getMinutes()} ${soonest.getHours() < 12 ? 'AM' : 'PM'}`;
    }
    
    return `${selectedDate.toLocaleDateString()} at ${selectedDate.getHours() % 12 || 12}:${selectedDate.getMinutes() === 0 ? '00' : selectedDate.getMinutes()} ${selectedDate.getHours() < 12 ? 'AM' : 'PM'}`;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pickup Date & Time</Text>
      
      <TouchableOpacity
        style={[styles.dateSelector, selectedDate && styles.dateSelectorSelected]}
        onPress={() => setShowCalendarModal(true)}
      >
        <View style={styles.dateDisplay}>
          <MaterialIcons name="event" size={24} color={selectedDate ? '#fff' : '#007bff'} style={styles.icon} />
          <Text style={[styles.dateText, selectedDate && styles.dateTextSelected]}>
            {selectedDate ? formatSelectedDate() : "Select pickup date and time"}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={selectedDate ? '#fff' : '#666'} />
      </TouchableOpacity>
      

      
      {/* Date Selection Modal */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Pickup Date & Time</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroller}>
              {dates.map((date, index) => {
                const { day, date: dateNum, month, isToday, isTomorrow } = formatDate(date);
                const isSelected = selectedDate && 
                  date.getDate() === selectedDate.getDate() && 
                  date.getMonth() === selectedDate.getMonth() && 
                  date.getFullYear() === selectedDate.getFullYear();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateOption,
                      isSelected && styles.selectedDateOption
                    ]}
                    onPress={() => onSelectDate(date)}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.selectedDayText
                    ]}>
                      {day}
                    </Text>
                    <Text style={[
                      styles.dateNumText,
                      isSelected && styles.selectedDateNumText
                    ]}>
                      {dateNum}
                    </Text>
                    <Text style={[
                      styles.monthText,
                      isSelected && styles.selectedMonthText
                    ]}>
                      {month}
                    </Text>
                    {(isToday || isTomorrow) && (
                      <Text style={styles.todayText}>
                        {isToday ? 'Today' : 'Tomorrow'}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.divider} />
            
            <Text style={styles.timeTitle}>Select Time</Text>
            <ScrollView style={styles.timeScroller}>
              <View style={styles.timeOptionsContainer}>
                {selectedDate && getTimeOptions().map((time, index) => {
                  const isSelectedTime = selectedDate && 
                    selectedDate.getHours() === time.hour && 
                    selectedDate.getMinutes() === time.minute;
                  
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeOption,
                        isSelectedTime && styles.selectedTimeOption
                      ]}
                      onPress={() => handleSelectDateTime(selectedDate, time.hour, time.minute)}
                    >
                      <Text style={[
                        styles.timeText,
                        isSelectedTime && styles.selectedTimeText
                      ]}>
                        {time.timeString}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !selectedDate && styles.confirmButtonDisabled
                ]}
                onPress={() => setShowCalendarModal(false)}
                disabled={!selectedDate}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateSelectorSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  dateTextSelected: {
    color: '#fff',
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '800',
  },
  selectedDateInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e6f0ff',
    borderRadius: 8,
  },
  readyText: {
    fontSize: 14,
    color: '#666',
  },
  pickupTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dateScroller: {
    maxHeight: 100,
  },
  dateOption: {
    width: 70,
    height: 80,
    margin: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateOption: {
    backgroundColor: '#007bff',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDayText: {
    color: '#fff',
  },
  dateNumText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDateNumText: {
    color: '#fff',
  },
  monthText: {
    fontSize: 12,
    color: '#666',
  },
  selectedMonthText: {
    color: '#fff',
  },
  todayText: {
    fontSize: 10,
    color: '#007bff',
    marginTop: 2,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timeScroller: {
    maxHeight: 200,
  },
  timeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeOption: {
    width: '31%',
    padding: 10,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#007bff',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    padding: 10,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default PickupCalendar;