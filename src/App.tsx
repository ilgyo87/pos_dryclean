import React, { useState, useEffect } from 'react';
import { Button, View, Text } from 'react-native';
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
function SignOutButton() {
  const { signOut } = useAuthenticator();
  return <Button title="Sign Out" onPress={signOut} />;
}

// Welcome screen component
function WelcomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to Dry Cleaning POS</Text>
      <Text>Please create a business to continue</Text>
    </View>
  );
}

// Main application content
function AppContent() {
  const [hasBusinesses, setHasBusinesses] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { authStatus, user } = useAuthenticator();
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    console.log("Auth status changed:", authStatus);
    if (authStatus === 'authenticated') {
      console.log("User authenticated, checking for businesses");
      checkForBusinesses();
    }
  }, [authStatus]);

  // Check if user has businesses
  const checkForBusinesses = async () => {
    if (!user?.username) {
      console.log("User not loaded yet");
      return;
    }

    setLoading(true);
    try {
      console.log("Checking for businesses...");
      const result = await client.models.Business.list({
        filter: {
          owner: { eq: user.username }
        }
      });

      console.log("Business check result:", JSON.stringify(result));
      const hasBusiness = result.data && result.data.length > 0;
      console.log("Has businesses:", hasBusiness);
      setHasBusinesses(hasBusiness);
      setLoading(false);
    } catch (error) {
      console.error("Error checking for businesses:", error);
      setHasBusinesses(false);
      setLoading(false);
    }
  };

  const handleBusinessCreated = (businessId: string, businessName: string) => {
    setHasBusinesses(true);
    // Force dashboard to re-mount completely using the key
    setDashboardKey(prev => prev + 1);
    console.log(`Business created: ${businessName} (${businessId})`);
  };

  function WelcomeScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Welcome to Dry Cleaning POS</Text>
        <Text>Please create a business to continue</Text>
      </View>
    );
  }

  // Log modal visibility state for debugging
  const modalVisible = !loading && hasBusinesses === false;
  console.log("Modal visibility state:", { loading, hasBusinesses, modalVisible });

  return (
    <NavigationContainer>
      {/* Main application navigation */}
      <Stack.Navigator>
        {hasBusinesses ? (
          // Only render Dashboard when we have businesses
          <Stack.Screen
            key={dashboardKey} // Force remount when business is created
            name="Dashboard"
            component={DashboardScreen}
            options={{
              headerShown: true,
              title: "DASHBOARD",
              headerRight: () => <SignOutButton />
            }}
          />
        ) : (
          // Add a placeholder screen when no businesses
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              headerShown: true,
              title: "WELCOME",
              headerRight: () => <SignOutButton />
            }}
          />
        )}
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