// src/screens/EmployeeManagement/components/EmployeePerformanceTracker.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../../amplify/data/resource';
import { styles } from '../styles/employeeManagementStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Employee, EmployeeShift } from '../types/EmployeeTypes';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const client = generateClient<Schema>();
const screenWidth = Dimensions.get('window').width - 40; // Account for padding

interface EmployeePerformanceTrackerProps {
  employee: Employee;
  businessId: string;
}

const EmployeePerformanceTracker: React.FC<EmployeePerformanceTrackerProps> = ({
  employee,
  businessId
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [activeShift, setActiveShift] = useState<EmployeeShift | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalHours: 0,
    averageHoursPerShift: 0,
    totalShifts: 0,
    completedShifts: 0,
    transactionsProcessed: 0,
    salesAmount: 0,
  });
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');

  // Fetch employee shifts and performance data
  useEffect(() => {
    fetchEmployeeData();
  }, [employee.id, timeframe]);

  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch employee shifts - Fixed: removed sort parameter and added proper type checking
      const result = await client.models.EmployeeShift.list({
        filter: {
          and: [
            { employeeID: { eq: employee.id } },
            { businessID: { eq: businessId } },
            { clockIn: { ge: startDate.toISOString() } }
          ]
        }
      });

      if (result && result.data) {
        // Sort the data after fetching (client-side sorting)
        const sortedShifts = [...result.data].sort((a, b) => {
          return new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime();
        });
        
        setShifts(sortedShifts);
        
        // Check for active shift
        const active = sortedShifts.find(shift => shift.status === 'ACTIVE');
        setActiveShift(active || null);
        
        // Calculate performance metrics
        calculatePerformanceMetrics(sortedShifts);
      } else {
        // Handle case where no data is returned
        setShifts([]);
        setActiveShift(null);
        calculatePerformanceMetrics([]);
      }

      // Fetch transactions for this employee (if needed)
      // This would be implemented based on your transaction schema
      // For now, we'll use placeholder data

    } catch (error) {
      console.error('Error fetching employee performance data:', error);
      // Reset states on error
      setShifts([]);
      setActiveShift(null);
      calculatePerformanceMetrics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePerformanceMetrics = (employeeShifts: EmployeeShift[]) => {
    // Calculate total hours worked
    let totalHours = 0;
    let completedShifts = 0;
    
    employeeShifts.forEach(shift => {
      if (shift.duration) {
        totalHours += shift.duration;
      } else if (shift.clockIn && shift.clockOut) {
        const clockIn = new Date(shift.clockIn);
        const clockOut = new Date(shift.clockOut);
        const durationHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        totalHours += durationHours;
      }
      
      if (shift.status === 'COMPLETED') {
        completedShifts++;
      }
    });
    
    // Set performance metrics
    setPerformanceMetrics({
      totalHours: parseFloat(totalHours.toFixed(2)),
      averageHoursPerShift: employeeShifts.length > 0 ? parseFloat((totalHours / employeeShifts.length).toFixed(2)) : 0,
      totalShifts: employeeShifts.length,
      completedShifts,
      // Placeholder data for transactions and sales
      transactionsProcessed: Math.floor(Math.random() * 50 * (employeeShifts.length || 1)),
      salesAmount: parseFloat((Math.random() * 1000 * (employeeShifts.length || 1)).toFixed(2)),
    });
  };

  const handleClockIn = async () => {
    try {
      // Create a new shift
      const result = await client.models.EmployeeShift.create({
        employeeID: employee.id,
        businessID: businessId,
        clockIn: new Date().toISOString(),
        status: 'ACTIVE'
      });
      
      if (result && result.data) {
        setActiveShift(result.data);
        // Fixed: Use type-safe approach for state updates
        setShifts(prevShifts => {
            if (!result.data) return prevShifts;
            return [result.data as EmployeeShift, ...prevShifts];
          });
      }
    } catch (error) {
      console.error('Error clocking in:', error);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    
    try {
      const clockOut = new Date();
      const clockIn = new Date(activeShift.clockIn);
      const durationHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      
      // Update the active shift
      const result = await client.models.EmployeeShift.update({
        id: activeShift.id,
        clockOut: clockOut.toISOString(),
        duration: parseFloat(durationHours.toFixed(2)),
        status: 'COMPLETED'
      });
      
      if (result && result.data) {
        setActiveShift(null);
        // Fixed: Use type-safe approach for state updates
        setShifts(prevShifts => {
            if (!result.data) return prevShifts;
            return prevShifts.map(shift => shift.id === result.data?.id ? result.data : shift);
          });
        
        // Update performance metrics with a safe copy of the shifts
        if (shifts.length > 0) {
            const updatedShifts = shifts
              .map(shift => shift.id === result.data?.id ? result.data : shift)
              .filter(shift => shift !== null && shift !== undefined);
              
            calculatePerformanceMetrics(updatedShifts);
          }
      }
    } catch (error) {
      console.error('Error clocking out:', error);
    }
  };

  // Generate chart data for hours worked
  const generateHoursChartData = () => {
    // Group shifts by day, week, or month depending on timeframe
    const groupedData: {[key: string]: number} = {};
    const labels: string[] = [];
    const data: number[] = [];
    
    // Format date based on timeframe
    const formatDate = (date: Date) => {
      switch (timeframe) {
        case 'week':
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        case 'month':
          return date.toLocaleDateString('en-US', { day: 'numeric' });
        case 'year':
          return date.toLocaleDateString('en-US', { month: 'short' });
      }
    };
    
    // Initialize groupedData with empty values
    const initializeGroupedData = () => {
      const today = new Date();
      
      switch (timeframe) {
        case 'week':
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const key = formatDate(date);
            groupedData[key] = 0;
          }
          break;
        case 'month':
          for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const key = formatDate(date);
            groupedData[key] = 0;
          }
          break;
        case 'year':
          for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(today.getMonth() - i);
            const key = formatDate(date);
            groupedData[key] = 0;
          }
          break;
      }
    };
    
    initializeGroupedData();
    
    // Populate with actual data
    shifts.forEach(shift => {
      if (shift.duration) {
        const shiftDate = new Date(shift.clockIn);
        const key = formatDate(shiftDate);
        
        if (groupedData[key] !== undefined) {
          groupedData[key] += shift.duration;
        }
      }
    });
    
    // Convert to arrays for chart
    Object.keys(groupedData).forEach(key => {
      labels.push(key);
      data.push(parseFloat(groupedData[key].toFixed(1)));
    });
    
    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        }
      ],
    };
  };

  // Render clock in/out button
  const renderClockButton = () => {
    if (activeShift) {
      return (
        <TouchableOpacity
          style={[styles.clockButton, styles.clockOutButton]}
          onPress={handleClockOut}
        >
          <Text style={styles.clockButtonText}>Clock Out</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity
          style={[styles.clockButton, styles.clockInButton]}
          onPress={handleClockIn}
        >
          <Text style={styles.clockButtonText}>Clock In</Text>
        </TouchableOpacity>
      );
    }
  };

  // Render timeframe selector
  const renderTimeframeSelector = () => (
    <View style={localStyles.timeframeContainer}>
      <TouchableOpacity
        style={[localStyles.timeframeButton, timeframe === 'week' && localStyles.activeTimeframe]}
        onPress={() => setTimeframe('week')}
      >
        <Text style={[localStyles.timeframeText, timeframe === 'week' && localStyles.activeTimeframeText]}>
          Week
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[localStyles.timeframeButton, timeframe === 'month' && localStyles.activeTimeframe]}
        onPress={() => setTimeframe('month')}
      >
        <Text style={[localStyles.timeframeText, timeframe === 'month' && localStyles.activeTimeframeText]}>
          Month
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[localStyles.timeframeButton, timeframe === 'year' && localStyles.activeTimeframe]}
        onPress={() => setTimeframe('year')}
      >
        <Text style={[localStyles.timeframeText, timeframe === 'year' && localStyles.activeTimeframeText]}>
          Year
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render performance metrics
  const renderPerformanceMetrics = () => (
    <View style={styles.performanceCard}>
      <Text style={styles.performanceHeader}>Performance Summary</Text>
      
      <View style={styles.performanceRow}>
        <Text style={styles.performanceLabel}>Total Hours Worked</Text>
        <Text style={styles.performanceValue}>{performanceMetrics.totalHours} hrs</Text>
      </View>
      
      <View style={styles.performanceRow}>
        <Text style={styles.performanceLabel}>Average Hours Per Shift</Text>
        <Text style={styles.performanceValue}>{performanceMetrics.averageHoursPerShift} hrs</Text>
      </View>
      
      <View style={styles.performanceRow}>
        <Text style={styles.performanceLabel}>Total Shifts</Text>
        <Text style={styles.performanceValue}>{performanceMetrics.totalShifts}</Text>
      </View>
      
      <View style={styles.performanceRow}>
        <Text style={styles.performanceLabel}>Completed Shifts</Text>
        <Text style={styles.performanceValue}>{performanceMetrics.completedShifts}</Text>
      </View>
      
      <View style={styles.performanceRow}>
        <Text style={styles.performanceLabel}>Transactions Processed</Text>
        <Text style={styles.performanceValue}>{performanceMetrics.transactionsProcessed}</Text>
      </View>
      
      <View style={styles.performanceRow}>
        <Text style={styles.performanceLabel}>Sales Amount</Text>
        <Text style={styles.performanceValue}>${performanceMetrics.salesAmount.toFixed(2)}</Text>
      </View>
    </View>
  );

  // Render hours chart
  const renderHoursChart = () => {
    const chartData = generateHoursChartData();
    
    // Check if we have valid data before rendering chart
    if (!chartData || !chartData.labels || chartData.labels.length === 0) {
      return (
        <View style={styles.performanceCard}>
          <Text style={styles.performanceHeader}>Hours Worked</Text>
          <Text style={localStyles.noDataText}>No shift data available for this period</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.performanceCard}>
        <Text style={styles.performanceHeader}>Hours Worked</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Math.max(screenWidth, chartData.labels.length * 50)} // Ensure enough width for all labels
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#2196F3',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </View>
    );
  };

  // Render recent shifts
  const renderRecentShifts = () => (
    <View style={styles.performanceCard}>
      <Text style={styles.performanceHeader}>Recent Shifts</Text>
      
      {shifts.length === 0 ? (
        <Text style={localStyles.noDataText}>No shifts recorded in this period</Text>
      ) : (
        shifts.slice(0, 5).map((shift) => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Text style={styles.shiftDate}>
                {new Date(shift.clockIn).toLocaleDateString()}
              </Text>
              <Text 
                style={[
                  styles.shiftStatus, 
                  shift.status === 'ACTIVE' ? styles.activeShift : styles.completedShift
                ]}
              >
                {shift.status}
              </Text>
            </View>
            
            <View style={styles.shiftTimes}>
              <Text style={styles.shiftTime}>
                In: {new Date(shift.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.shiftTime}>
                {shift.clockOut 
                  ? `Out: ${new Date(shift.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Currently Active'
                }
              </Text>
            </View>
            
            {shift.duration && (
              <Text style={styles.shiftDuration}>
                Duration: {shift.duration.toFixed(2)} hrs
              </Text>
            )}
            
            {shift.notes && (
              <Text style={styles.shiftNotes}>{shift.notes}</Text>
            )}
          </View>
        ))
      )}
      
      {shifts.length > 5 && (
        <TouchableOpacity style={localStyles.viewAllButton}>
          <Text style={localStyles.viewAllText}>View All Shifts</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      {/* Clock In/Out Button */}
      {renderClockButton()}
      
      {/* Timeframe Selector */}
      {renderTimeframeSelector()}
      
      {/* Performance Metrics */}
      {renderPerformanceMetrics()}
      
      {/* Hours Chart */}
      {renderHoursChart()}
      
      {/* Recent Shifts */}
      {renderRecentShifts()}
    </ScrollView>
  );
};

const localStyles = StyleSheet.create({
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTimeframe: {
    backgroundColor: '#2196F3',
  },
  timeframeText: {
    fontSize: 14,
    color: '#333',
  },
  activeTimeframeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  viewAllButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
});

export default EmployeePerformanceTracker;
