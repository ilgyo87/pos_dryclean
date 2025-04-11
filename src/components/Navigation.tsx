// src/components/Navigation.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import Dashboard from "../screens/Dashboard/Dashboard";
// Import additional screens
import CustomersScreen from "../screens/Customers/Customers";
// import EmployeesScreen from "../screens/Employees/Employees";
// import OrdersScreen from "../screens/Orders/Orders";
// import ReportsScreen from "../screens/Reports/Reports";
// import ProductsScreen from "../screens/Products/Products";
// import SettingsScreen from "../screens/Settings/Settings";

const Stack = createNativeStackNavigator();

export default function Navigation({ user }: { user: AuthUser }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Customers">
          {(props) => <CustomersScreen {...props} user={user} />}
        </Stack.Screen>
        {/* <Stack.Screen name="Employees">
          {(props) => <EmployeesScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Orders">
          {(props) => <OrdersScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Reports">
          {(props) => <ReportsScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Products">
          {(props) => <ProductsScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {(props) => <SettingsScreen {...props} user={user} />}
        </Stack.Screen> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}