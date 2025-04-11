// src/screens/Dashboard/Dashboard.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ActivityIndicator, SafeAreaView } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { DashboardCategory } from "../../types";
import { DashboardGrid } from "./components/DashboardGrid";
import { SearchBar } from "../../components/SearchBar";
import styles from "./styles/DashboardStyles";

// Create the client
const client = generateClient<Schema>();

export default function Dashboard({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [business, setBusiness] = useState<Schema['Business']['type'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({
    customers: 0,
    employees: 0,
    orders: 0,
    products: 0
  });

  const fetchBusinessData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Fetch business by userId
      const businessResponse = await client.models.Business.list({
        filter: { userId: { eq: user.userId } }
      });
      
      if (businessResponse.data && businessResponse.data.length > 0) {
        setBusiness(businessResponse.data[0]);
        
        // Now fetch counts for each entity
        const customersResponse = await client.models.Customer.list();
        const employeesResponse = await client.models.Employee.list();
        const ordersResponse = await client.models.Order.list();
        const productsResponse = await client.models.Item.list();
        
        setCounts({
          customers: customersResponse.data?.length || 0,
          employees: employeesResponse.data?.length || 0,
          orders: ordersResponse.data?.length || 0,
          products: productsResponse.data?.length || 0
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user?.userId]);

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBusinessData();
    }, [user?.userId])
  );

  const categories: DashboardCategory[] = [
    { id: 'customers', title: 'Customers', icon: 'people-outline', color: '#4285F4', count: counts.customers },
    { id: 'orders', title: 'Orders', icon: 'receipt-outline', color: '#FBBC05', count: counts.orders },
    { id: 'products', title: 'Products', icon: 'shirt-outline', color: '#8E44AD', count: counts.products },
    { id: 'employees', title: 'Team', icon: 'people-circle-outline', color: '#34A853', count: counts.employees },
    { id: 'reports', title: 'Reports', icon: 'bar-chart-outline', color: '#EA4335' },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', color: '#607D8B' },
  ];

  const navigateToSection = (sectionId: string) => {
    // Handle navigation to different sections
    if (navigation) {
      switch (sectionId) {
        case 'customers':
          navigation.navigate('Customers');
          break;
        case 'employees':
          navigation.navigate('Employees');
          break;
        case 'orders':
          navigation.navigate('Orders');
          break;
        case 'reports':
          navigation.navigate('Reports');
          break;
        case 'products':
          navigation.navigate('Products');
          break;
        case 'settings':
          navigation.navigate('Settings');
          break;
        default:
          console.log(`No navigation defined for ${sectionId}`);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {business && (
          <View style={styles.header}>
            <Text style={styles.businessName}>{business.name}</Text>
          </View>
        )}
        
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.gridContainer}>
          <DashboardGrid 
            categories={categories}
            onCardPress={navigateToSection}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}