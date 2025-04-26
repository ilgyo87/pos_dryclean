import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import Dashboard from "../screens/Dashboard/Dashboard";
import OrdersScreen from '../screens/Categories/Orders/OrdersScreen';
import CustomersScreen from '../screens/Categories/Customers/CustomersScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import EmployeesScreen from '../screens/Categories/Employees/EmployeesScreen';
import ProductsScreen from '../screens/Categories/Products/ProductsScreen';
import PrinterManagementScreen from './PrinterManagementScreen';

const Stack = createNativeStackNavigator();

import { View, Text, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { EmployeePinModal } from './EmployeePinModal';
import { getAllEmployees } from '../localdb/services/employeeService';

export default function Navigation({ user, business, refresh }: { user: AuthUser, business?: any, refresh: number }) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [employees, setEmployees] = useState<Array<{ _id: string; firstName: string; lastName: string; pin: string }>>([]);
  const [signedInEmployee, setSignedInEmployee] = useState<{ employeeId: string; firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    getAllEmployees().then((all) => {
      const arr = Array.from(all).map((e: any) => typeof e.toJSON === 'function' ? e.toJSON() : { ...e });
      setEmployees(arr);
    });
  }, [showPinModal]);

  // Check if we have a valid business with ID
  const businessToUse = business || null;
  const businessId = businessToUse?.id || businessToUse?._id || '';

  console.log(`[Navigation] Business ID: ${businessId}, Name: ${businessToUse?.businessName || 'None'}`);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="DASHBOARD"
          screenOptions={({ navigation, route }) => ({
            headerTitle: () => (
              signedInEmployee ? (
                <TouchableOpacity onPress={() => setSignedInEmployee(null)}>
                  <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>
                    {signedInEmployee.firstName} {signedInEmployee.lastName}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShowPinModal(true)}>
                  <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>Employee Sign In</Text>
                </TouchableOpacity>
              )
            ),
          })}
        >
          <Stack.Screen name="DASHBOARD">
            {(props) => <Dashboard {...props} user={user} business={businessToUse} refresh={refresh} {...(signedInEmployee || {})} />}
          </Stack.Screen>
          <Stack.Screen name="Customers">
            {(props) => <CustomersScreen {...props} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen name="Orders">
            {(props) => <OrdersScreen {...props} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen name="Products">
            {(props) => <ProductsScreen {...props} business={businessToUse} businessId={businessId} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen name="Employees">
            {(props) => <EmployeesScreen {...props} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {(props) => <SettingsScreen {...props} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen name="Reports">
            {(props) => <ReportsScreen {...props} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen name="Checkout">
            {(props) => <CheckoutScreen {...props} employeeId={signedInEmployee?.employeeId} firstName={signedInEmployee?.firstName} lastName={signedInEmployee?.lastName} />}
          </Stack.Screen>
          <Stack.Screen
            name="PrinterManagement"
            component={PrinterManagementScreen}
            options={{ title: 'Printer Setup' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <EmployeePinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={(emp) => {
          setSignedInEmployee(emp);
          setShowPinModal(false);
        }}
        employees={employees}
      />
    </>
  );
}