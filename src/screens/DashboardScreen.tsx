import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from '../styles/screens/dashboardStyles';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from "@aws-amplify/ui-react-native";

// Initialize Amplify client
const client = generateClient<Schema>();

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [businessName, setBusinessName] = useState('loading...');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthenticator();

  // Add this useEffect to listen to navigation focus events
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Dashboard screen focused, refreshing data');
      fetchBusinessData();
    });
    return unsubscribe;
  }, [navigation]);
  
  useEffect(() => {
    // Fetch the business data when component mounts
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching business data for dashboard...");
      
      // Fetch businesses for the current user
      const result = await client.models.Business.list({
        filter: { owner: { eq: user?.username } }
      });
      
      // If businesses exist, use the first one
      if (result.data && result.data.length > 0) {
        console.log("Found business:", result.data[0].name);
        setBusinessName(result.data[0].name);
      } else {
        setBusinessName('My Business'); // Fallback name
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
      setBusinessName('My Business'); // Fallback name
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of your code remains the same...
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

