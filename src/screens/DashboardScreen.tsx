// src/screens/DashboardScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from '../styles/screens/dashboardStyles';

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [businessName] = useState('My Business');

  const menuItems = [
    { title: 'Product Management', screen: 'ProductManagement', icon: '📦' },
    { title: 'Employee Management', screen: 'EmployeeManagement', icon: '👥' },
    { title: 'Appointments', screen: 'Appointments', icon: '📅' },
    { title: 'Order Management', screen: 'OrderManagement', icon: '📋' },
    { title: 'Customers', screen: 'Customers', icon: '👤' },
    { title: 'Reports', screen: 'Reports', icon: '📊' },
    { title: 'Settings', screen: 'Settings', icon: '⚙️' },
  ];

  const navigateToScreen = (screenName: string) => {
    // Simple placeholder for navigation
    console.log(`Navigate to ${screenName}`);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>{businessName.toUpperCase()}</Text>
        </View>
        <Text style={styles.subtitle}>DASHBOARD</Text>
      </View>

      {/* Start Transaction Button */}
      <TouchableOpacity style={styles.startButton}>
        <Text style={styles.startButtonText}>Start Transaction</Text>
      </TouchableOpacity>

      <View style={styles.menuGrid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigateToScreen(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

