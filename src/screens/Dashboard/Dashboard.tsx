// src/screens/Dashboard/Dashboard.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ActivityIndicator, SafeAreaView } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import type { DashboardCategory } from "../../types";
import { DashboardGrid } from "./components/DashboardGrid";
import styles from "./styles/DashboardStyles";
import PredictiveSearch from "../../components/PredictiveSearch";

const client = generateClient<Schema>();

export default function Dashboard({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [business, setBusiness] = useState<Schema['Business']['type'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Schema['Customer']['type'][]>([]);

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

      const businessResponse = await client.models.Business.list({
        filter: { userId: { eq: user.userId } }
      });

      if (businessResponse.data && businessResponse.data.length > 0) {
        setBusiness(businessResponse.data[0]);

        const customersResponse = await client.models.Customer.list();
        const employeesResponse = await client.models.Employee.list();
        const ordersResponse = await client.models.Order.list();
        const productsResponse = await client.models.Item.list();
        if (customersResponse.data) {
          setCustomers(customersResponse.data);
        }

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

  const handleCustomerSearch = (customer: Schema["Customer"]["type"]) => {
    navigation.navigate('Customers', {
      screen: 'CustomerEdit',
      params: { customerId: customer.id }
    });
  };

  useEffect(() => {
    if (user) {
      fetchBusinessData();
    }
  }, [user?.userId]);

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {business && (
          <View style={styles.header}>
            <Text style={styles.businessName}>{business.name}</Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <PredictiveSearch
            customers={customers}
            onCustomerSelect={handleCustomerSearch}
            placeholder="Search customers..."
          />
        </View>

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