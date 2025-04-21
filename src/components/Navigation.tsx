import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import Dashboard from "../screens/Dashboard/Dashboard";
import BusinessForm from "../components/BusinessForm";

const Stack = createNativeStackNavigator();

export default function Navigation({ user, refresh }: { user: AuthUser, refresh: number }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} refresh={refresh} />}
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
                props.navigation.goBack();
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}