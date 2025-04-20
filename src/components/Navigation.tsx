import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import Dashboard from "../screens/Dashboard";
import BusinessForm from "../components/BusinessForm";

const Stack = createNativeStackNavigator();

export default function Navigation({ user }: { user: AuthUser }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen
          name="CreateBusiness"
          options={{ title: 'Create Business' }}
        >
          {(props) => (
            <BusinessForm
              visible
              onClose={() => props.navigation.goBack()}
              onSuccess={() => {
  props.navigation.navigate('DASHBOARD', { refresh: Date.now() });
}}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}