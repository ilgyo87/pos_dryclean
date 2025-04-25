// src/components/Navigation.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Import screens
import Dashboard from '../screens/Dashboard/Dashboard';
import CustomersScreen from '../screens/Categories/Customers/CustomersScreen';
import OrdersScreen from '../screens/Categories/Orders/OrdersScreen';
import EmployeesScreen from '../screens/Categories/Employees/EmployeesScreen';
import ProductsScreen from '../screens/Categories/Products/ProductsScreen';
import PrinterSetupScreen from '../screens/Settings/PrinterSetupScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';

const Stack = createNativeStackNavigator();

import { useAuthenticator } from '@aws-amplify/ui-react-native';
import React, { useState } from 'react';

export default function Navigation() {
  const { user } = useAuthenticator();
  const [refresh, setRefresh] = useState(0);
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#f8f9fa',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Dashboard"
          options={{ title: 'Dashboard' }}
          children={(props) => (
            <Dashboard {...props} user={user} refresh={refresh} />
          )}
        />
        <Stack.Screen 
          name="Customers" 
          component={CustomersScreen}
          options={{ title: 'Customers' }}
        />
        <Stack.Screen 
          name="Orders" 
          component={OrdersScreen}
          options={{ title: 'Orders' }}
        />  
        <Stack.Screen 
          name="Employees" 
          component={EmployeesScreen}
          options={{ title: 'Employees' }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen}
          options={{ title: 'Products' }}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen 
          name="PrinterSetup" 
          component={PrinterSetupScreen}
          options={{ title: 'Printer Setup' }}
        />
        <Stack.Screen 
          name="Checkout" 
          component={CheckoutScreen}
          options={{ title: 'Checkout' }}
        />
        <Stack.Screen 
          name="Reports" 
          component={ReportsScreen}
          options={{ title: 'Reports' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}