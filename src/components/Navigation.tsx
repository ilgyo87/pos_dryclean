import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import Dashboard from "../screens/Dashboard/Dashboard";
import { OrdersScreen, ProductsScreen, EmployeesScreen } from '../screens/Categories';
import { useBusiness } from '../hooks/useBusiness';
import CustomersScreen from '../screens/Categories/Customers/CustomersScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';

const Stack = createNativeStackNavigator();

import { ActivityIndicator, View } from 'react-native';

export default function Navigation({ user, refresh }: { user: AuthUser, refresh: number }) {
  const { business } = useBusiness({ userId: user?.userId, authUser: user });
  console.log('[Navigation] Passing business:', business);

  if (!business) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} refresh={refresh} />}
        </Stack.Screen>
        <Stack.Screen name="Customers" component={CustomersScreen} options={{ title: 'Customers' }} />
        <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
        <Stack.Screen name="Products">
          {(props) => <ProductsScreen {...props} business={business} />}
        </Stack.Screen>
        <Stack.Screen name="Employees" component={EmployeesScreen} options={{ title: 'Team' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}