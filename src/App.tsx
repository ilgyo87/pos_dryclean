import React, { useState, useEffect } from 'react';
import { Button} from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CreateBusinessModal from './components/CreateBusinessModal';
import DashboardScreen from './screens/DashboardScreen';
import outputs from "../amplify_outputs.json";

// Configure Amplify with your project settings
Amplify.configure(outputs);

const client = generateClient<Schema>();
const Stack = createNativeStackNavigator();

// Sign out button component
const SignOutButton = () => {
  const { signOut } = useAuthenticator();
  return <Button title="Sign Out" onPress={signOut} />;
};

export default function App() {
  const [hasBusinesses, setHasBusinesses] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForBusinesses();
  }, []);

  const checkForBusinesses = async () => {
    try {
      setLoading(true);
      const result = await client.models.Business.list({
        limit: 1
      });

      // If we have at least one business, user has businesses
      setHasBusinesses(result.data && result.data.length > 0);
    } catch (error) {
      console.error('Error checking for businesses:', error);
      // Default to showing the modal if we can't check
      setHasBusinesses(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessCreated = (businessId: string, businessName: string) => {
    // Update state to hide modal
    setHasBusinesses(true);

    console.log(`Business created: ${businessName} (${businessId})`);
  };

  return (
    <SafeAreaProvider>
      <Authenticator.Provider>
        <NavigationContainer>
          {/* Main application navigation - always visible */}
          <Stack.Navigator>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={{
                headerShown: true,
                title: "DASHBOARD",
                headerRight: () => <SignOutButton />
              }}
            />
            {/* Add other screens here as needed */}
          </Stack.Navigator>

          {/* Business modal - only visible when no businesses exist */}
          <CreateBusinessModal
            visible={!loading && hasBusinesses === false}
            onBusinessCreated={handleBusinessCreated}
          />
        </NavigationContainer>
      </Authenticator.Provider>
    </SafeAreaProvider>
  );
}