// src/screens/Dashboard/Dashboard.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ActivityIndicator, SafeAreaView, Alert, Modal } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import { DashboardCategory } from "../../types";
import { DashboardGrid } from "./components/DashboardGrid";
import styles from "./styles/DashboardStyles";
import PredictiveSearch from "../../components/PredictiveSearch";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import { useDashboardData } from "./hooks/useDashboardData";

export default function Dashboard({ navigation }: { navigation?: any }) {
  const { business, isLoading } = useDashboardData();
  const customers = useSelector((state: RootState) => state.customer.customers);

  useEffect(() => {
    if (!business && navigation) {
      navigation.navigate("BusinessForm");
    }
  }, [business, navigation]);

  const handleCustomerSearch = (customer: any) => {
    if (business && navigation) {
      navigation.navigate("Checkout", {
        businessId: business.id,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        items: [],
        total: 0,
        pickupDate: new Date(Date.now() + 86400000).toISOString(),
        customerPreferences: customer.preferences || "",
        firstName: customer.firstName,
        lastName: customer.lastName
      });
    } else if (navigation) {
      navigation.navigate("Customers", {
        screen: "CustomerEdit",
        params: { customerId: customer.id }
      });
    }
  };

  // Example: You may want to compute counts from Redux state if needed
  const counts = {
    customers: customers.length,
    employees: useSelector((state: RootState) => state.employee.employees.length),
    orders: useSelector((state: RootState) => state.order.orders.length),
    products: useSelector((state: RootState) => state.item.items.length)
  };

  const categories: DashboardCategory[] = [
    { id: "customers", title: "Customers", icon: "people-outline", color: "#4285F4", count: counts.customers },
    { id: "orders", title: "Orders", icon: "receipt-outline", color: "#FBBC05", count: counts.orders },
    { id: "products", title: "Products", icon: "shirt-outline", color: "#8E44AD", count: counts.products },
    { id: "employees", title: "Team", icon: "people-circle-outline", color: "#34A853", count: counts.employees },
    { id: "reports", title: "Reports", icon: "bar-chart-outline", color: "#EA4335" },
    { id: "settings", title: "Settings", icon: "settings-outline", color: "#607D8B" },
  ];

  const navigateToSection = (sectionId: string) => {
    if (navigation) {
      switch (sectionId) {
        case "customers":
          navigation.navigate("Customers");
          break;
        case "employees":
          navigation.navigate("Employees");
          break;
        case "orders":
          navigation.navigate("Orders");
          break;
        case "reports":
          navigation.navigate("Reports");
          break;
        case "products":
          navigation.navigate("Products");
          break;
        case "settings":
          navigation.navigate("Settings");
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
      {/* Removed duplicate Modal for business creation. This is now handled globally in AuthenticatedApp. */}
    </SafeAreaView>
  );
}