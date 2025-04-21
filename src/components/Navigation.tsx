import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import Dashboard from "../screens/Dashboard/Dashboard";
import { CustomersScreen, OrdersScreen, ProductsScreen, EmployeesScreen } from '../screens/Categories';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';

const Stack = createNativeStackNavigator();

export default function Navigation({ user, refresh }: { user: AuthUser, refresh: number }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} refresh={refresh} />}
        </Stack.Screen>
        <Stack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Customers' }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
        <Stack.Screen name="Employees" component={EmployeesScreen} options={{ title: 'Team' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}