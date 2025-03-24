import React, { useState, useEffect } from 'react';
import { Button } from 'react-native';
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

// Sign out button component with explicit handling
const SignOutButton = () => {
  const { signOut } = useAuthenticator();

  const handleSignOut = () => {
    try {
      signOut();
      console.log('Sign out requested');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return <Button title="Sign Out" onPress={handleSignOut} />;
};

// Main app with authentication - wrapped in Authenticator.Provider
function AppContent() {
  const [hasBusinesses, setHasBusinesses] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { authStatus, user } = useAuthenticator();
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    console.log("Auth status changed:", authStatus);
    console.log("User:", user?.username);
    
    if (authStatus === 'authenticated') {
      console.log("User authenticated, checking for businesses");
      checkForBusinesses();
    }
  }, [authStatus]);

  const checkForBusinesses = async () => {
    try {
      setLoading(true);
      console.log("Checking for businesses...");
      
      // Filter by the current user's ID
      const result = await client.models.Business.list({
        filter: { owner: { eq: user?.username } }
      });

      console.log("Business check result:", JSON.stringify(result));
      
      // If we have at least one business, user has businesses
      const userHasBusinesses = result.data && result.data.length > 0;
      setHasBusinesses(userHasBusinesses);
      console.log("Has businesses:", userHasBusinesses);
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
    // Increment dashboard key to force remount
  setDashboardKey(prevKey => prevKey + 1);
  };

  // Log modal visibility state for debugging
  const modalVisible = !loading && hasBusinesses === false;
  console.log("Modal visibility state:", { loading, hasBusinesses, modalVisible });

  return (
    <NavigationContainer>
      {/* Main application navigation - always visible */}
      <Stack.Navigator>
        <Stack.Screen
          key={dashboardKey}
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
        visible={modalVisible}
        onBusinessCreated={handleBusinessCreated}
      />
    </NavigationContainer>
  );
}

// Root component with Provider and Auth UI
export default function App() {
  return (
    <SafeAreaProvider>
      <Authenticator.Provider>
        <Authenticator>
          <AppContent />
        </Authenticator>
      </Authenticator.Provider>
    </SafeAreaProvider>
  );
}