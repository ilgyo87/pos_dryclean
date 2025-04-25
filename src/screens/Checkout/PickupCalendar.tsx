import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Dimensions,
  Platform 
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface PickupCalendarProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  timeIntervals?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  businessHours?: { 
    start: number; 
    end: number;
    daysOff?: number[]; // 0 = Sunday, 6 = Saturday 
  };
}

const PickupCalendar: React.FC<PickupCalendarProps> = ({
  value,
  onChange,
  label = "Pickup Date & Time",
  placeholder = "Select pickup date and time",
  required = true,
  minimumDate = new Date(),
  maximumDate,
  timeIntervals = 30,
  businessHours = { start: 9, end: 17, daysOff: [0, 6] } // Default: 9am-5pm, weekends off
}) => {
  // State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
  const [selectedDateString, setSelectedDateString] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const today = new Date();
  const timeSlotsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Convert Date to string format for calendar (YYYY-MM-DD) using local date parts
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Format a date for display
  const formatDateForDisplay = (date?: Date): string => {
    if (!date) return placeholder;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if date is today or tomorrow
    const isToday = 
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() && 
      date.getFullYear() === today.getFullYear();
      
    const isTomorrow = 
      date.getDate() === tomorrow.getDate() && 
      date.getMonth() === tomorrow.getMonth() && 
      date.getFullYear() === tomorrow.getFullYear();
    
    // Create date part
    let dateString = '';
    if (isToday) {
      dateString = 'Today';
    } else if (isTomorrow) {
      dateString = 'Tomorrow';
    } else {
      dateString = date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    // Add time if available
    if (date.getHours() !== 0 || date.getMinutes() !== 0) {
      // Format time: 3:30 PM
      const timeString = date.toLocaleTimeString(undefined, { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      
      return `${dateString} at ${timeString}`;
    }
    
    return dateString;
  };

  // Initialize the calendar with marked dates
  useEffect(() => {
    updateMarkedDates();
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (timeSlotsTimer.current !== null) clearTimeout(timeSlotsTimer.current);
    };
  }, []);

  // Update marked dates when selected date changes
  const updateMarkedDates = () => {
    const newMarkedDates: Record<string, any> = {};
    
    // Mark today
    const todayString = formatDateString(today);
    newMarkedDates[todayString] = { 
      marked: true, 
      dotColor: '#2196F3'
    };
    
    // Mark selected date
    if (selectedDate) {
      const selectedString = formatDateString(selectedDate);
      newMarkedDates[selectedString] = { 
        selected: true, 
        selectedColor: '#2196F3',
      };
      
      // If today is selected, merge the styles
      if (selectedString === todayString) {
        newMarkedDates[todayString] = { 
          ...newMarkedDates[todayString],
          selected: true, 
          selectedColor: '#2196F3',
        };
      }
      
      setSelectedDateString(selectedString);
    }
    
    setMarkedDates(newMarkedDates);
  };

  // Handle date selection from calendar
  const handleDayPress = (day: {
    day: number;
    month: number;
    year: number;
    timestamp: number;
    dateString: string;
  }) => {
    // Clear any existing timer
    if (timeSlotsTimer.current !== null) {
      clearTimeout(timeSlotsTimer.current);
      timeSlotsTimer.current = null;
    }
    // Build selected date without timezone issues
    const date = new Date(day.year, day.month - 1, day.day);
    setSelectedDate(date);
    // Close calendar and reset any open time slots
    setShowCalendar(false);
    setShowTimeSlots(false);
    // If day off, finalize selection
    const isDayOff = businessHours.daysOff?.includes(date.getDay());
    if (isDayOff) {
      onChange(date);
      return;
    }
    // Otherwise, open time slots after a short delay
    timeSlotsTimer.current = setTimeout(() => {
      setShowTimeSlots(true);
      timeSlotsTimer.current = null;
    }, 300);
  };

  // Is a date disabled based on business rules
  const isDateDisabled = (date: Date): boolean => {
    // Check minimum date
    if (minimumDate && date < minimumDate) {
      return true;
    }
    
    // Check maximum date
    if (maximumDate && date > maximumDate) {
      return true;
    }
    
    return false;
  };

  // Generate time slots for the selected date
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    const slots = [];
    const baseDate = new Date(selectedDate);
    baseDate.setHours(0, 0, 0, 0);
    
    // Check if today - if so, only show future times
    const isToday = 
      baseDate.getDate() === today.getDate() && 
      baseDate.getMonth() === today.getMonth() && 
      baseDate.getFullYear() === today.getFullYear();
    
    // Start from business hours
    const startHour = businessHours.start;
    const endHour = businessHours.end;
    
    // Generate slots
    const intervalValue = Number(timeIntervals);
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalValue) {
        const slotDate = new Date(baseDate);
        slotDate.setHours(hour, minute);
        
        // Skip past times if today
        if (isToday && slotDate <= new Date()) {
          continue;
        }
        
        // Format slot time
        const isPM = hour >= 12;
        const displayHour = hour % 12 || 12;
        const displayMinute = minute.toString().padStart(2, '0');
        const period = isPM ? 'PM' : 'AM';
        
        const label = `${displayHour}:${displayMinute} ${period}`;
        
        // Add slot
        slots.push({
          label,
          date: slotDate,
          // Generate colors for visual grouping
          isEarlyMorning: hour < 10,
          isMorning: hour >= 10 && hour < 12,
          isAfternoon: hour >= 12 && hour < 16,
          isEvening: hour >= 16,
        });
      }
    }
    
    return slots;
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (date: Date) => {
    setShowTimeSlots(false);
    onChange(date);
  };

  // Handle custom time selection
  const handleConfirmTime = (date: Date) => {
    setShowTimePicker(false);
    
    if (selectedDate) {
      // Combine date and time
      const combinedDate = new Date(selectedDate);
      combinedDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      
      onChange(combinedDate);
    }
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      {/* Date Display Button */}
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowCalendar(true)}
      >
        <View style={styles.dateButtonContent}>
          <MaterialIcons name="event" size={24} color="#2196F3" />
          <Text style={value ? styles.dateText : styles.placeholderText}>
            {value ? formatDateForDisplay(value) : placeholder}
          </Text>
        </View>
        <MaterialIcons name="arrow-drop-down" size={24} color="#757575" />
      </TouchableOpacity>
      
      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pickup Date</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <MaterialIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <Calendar
              current={selectedDateString || undefined}
              minDate={formatDateString(minimumDate)}
              maxDate={maximumDate ? formatDateString(maximumDate) : undefined}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              theme={{
                selectedDayBackgroundColor: '#2196F3',
                todayTextColor: '#2196F3',
                arrowColor: '#2196F3',
                dotColor: '#2196F3',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14
              }}
              disableAllTouchEventsForDisabledDays
            />
            
            <View style={styles.calendarFooter}>
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#2196F3', width: 24, height: 24, borderRadius: 12 }]} />
                  <Text style={styles.legendText}>Selected</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Time Slots Modal */}
      <Modal
        visible={showTimeSlots}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimeSlots(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timeSlotsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select Pickup Time
                <Text style={styles.modalSubtitle}>
                  {selectedDate && ` for ${formatDateForDisplay(selectedDate)}`}
                </Text>
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTimeSlots(false)}
              >
                <MaterialIcons name="close" size={24} color="#757575" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.timeSlotScrollView}>
              <View style={styles.timeSlotContainer}>
                {generateTimeSlots().map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      slot.isEarlyMorning && styles.earlyMorningSlot,
                      slot.isMorning && styles.morningSlot,
                      slot.isAfternoon && styles.afternoonSlot,
                      slot.isEvening && styles.eveningSlot,
                      value && 
                      value.getHours() === slot.date.getHours() && 
                      value.getMinutes() === slot.date.getMinutes() && 
                      styles.selectedTimeSlot
                    ]}
                    onPress={() => handleTimeSlotSelect(slot.date)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      value && 
                      value.getHours() === slot.date.getHours() && 
                      value.getMinutes() === slot.date.getMinutes() && 
                      styles.selectedTimeSlotText
                    ]}>
                      {slot.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.timeSlotsFooter}>
              <TouchableOpacity
                style={styles.customTimeButton}
                onPress={() => {
                  setShowTimeSlots(false);
                  setShowTimePicker(true);
                }}
              >
                <Text style={styles.customTimeText}>Custom Time</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.justDateButton}
                onPress={() => {
                  if (selectedDate) {
                    onChange(selectedDate);
                    setShowTimeSlots(false);
                  }
                }}
              >
                <Text style={styles.justDateText}>No Specific Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Native Time Picker Modal */}
      <DateTimePickerModal
        isVisible={showTimePicker}
        mode="time"
        date={value || new Date()}
        onConfirm={handleConfirmTime}
        onCancel={() => setShowTimePicker(false)}
        minuteInterval={timeIntervals}
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const timeSlotWidth = width > 400 ? '30%' : '45%';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%'
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#424242'
  },
  required: {
    color: '#F44336'
  },
  dateButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BDBDBD',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateText: {
    fontSize: 16,
    color: '#212121',
    marginLeft: 8
  },
  placeholderText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginLeft: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  calendarModal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  timeSlotsModal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121'
  },
  modalSubtitle: {
    fontWeight: 'normal',
    fontSize: 16,
    color: '#757575'
  },
  closeButton: {
    padding: 4
  },
  calendarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  legendText: {
    fontSize: 14,
    color: '#616161'
  },
  timeSlotScrollView: {
    maxHeight: 300
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between'
  },
  timeSlot: {
    width: timeSlotWidth,
    padding: 12,
    margin: 6,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
    alignItems: 'center'
  },
  earlyMorningSlot: {
    backgroundColor: '#E3F2FD', // Light blue
  },
  morningSlot: {
    backgroundColor: '#E8F5E9', // Light green
  },
  afternoonSlot: {
    backgroundColor: '#FFF9C4', // Light yellow
  },
  eveningSlot: {
    backgroundColor: '#FCE4EC', // Light pink
  },
  selectedTimeSlot: {
    backgroundColor: '#2196F3',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#424242'
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  timeSlotsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  customTimeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8
  },
  customTimeText: {
    color: '#424242',
    fontWeight: '500'
  },
  justDateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 8
  },
  justDateText: {
    color: '#424242',
    fontWeight: '500'
  }
});

export default PickupCalendar;