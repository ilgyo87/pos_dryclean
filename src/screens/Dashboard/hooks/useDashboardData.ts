// src/screens/Dashboard/hooks/useDashboardData.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

export const useDashboardData = (user: AuthUser | null) => {
  const [business, setBusiness] = useState<Schema["Business"]["type"]>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [counts, setCounts] = useState({
    customers: 0,
    employees: 0,
    orders: 0,
    products: 0,
  });

  const fetchCounts = async () => {
    try {
      // Fetch counts of various entities
      const [customersResult, employeesResult, ordersResult, productsResult] = await Promise.all([
        client.models.Customer.list(),
        client.models.Employee.list(),
        client.models.Order.list(),
        client.models.Item.list()
      ]);

      setCounts({
        customers: customersResult.data?.length || 0,
        employees: employeesResult.data?.length || 0,
        orders: ordersResult.data?.length || 0,
        products: productsResult.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const fetchBusiness = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: businesses, errors } = await client.models.Business.list({
        filter: { userId: { eq: user.userId } }
      });

      if (errors) {
        console.error("Error fetching business:", errors);
        Alert.alert("Error", "Failed to fetch business data.");
        setBusiness(undefined);
      } else if (businesses && businesses.length > 0) {
        setBusiness(businesses[0]);
        await fetchCounts();
      } else {
        setBusiness(undefined);
      }
    } catch (error) {
      console.error("Error in fetchBusiness:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    business,
    isLoading,
    counts,
    fetchBusiness,
    fetchCounts
  };
};

export default useDashboardData;