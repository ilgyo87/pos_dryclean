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
  const { user } = useAuthenticator();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [businessName, setBusinessName] = useState('');
  
  // Fetch business name when component mounts
  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        console.log("Fetching business name...");
        const result = await client.models.Business.list({
          filter: { owner: { eq: user?.username } }
        });
        
        if (result.data && result.data.length > 0) {
          console.log("Found business:", result.data[0].name);
          setBusinessName(result.data[0].name);
        }
      } catch (error) {
        console.error('Error fetching business name:', error);
      }
    };
    
    if (user?.username) {
      fetchBusinessName();
    }
  }, [user]);
  
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
    navigation.navigate(screenName);
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
        <Text style={styles.startButtonText}>START TRANSACTION</Text>
      </TouchableOpacity>

      {/* Menu Grid */}
      <FlatList
        data={menuItems}
        numColumns={2}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigateToScreen(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.menuGrid}
      />
    </View>
  );
}