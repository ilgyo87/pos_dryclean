// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Button, View, Text, ActivityIndicator } from 'react-native'; // Added ActivityIndicator import
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
import CustomerEditScreen from './screens/CustomerEditScreen';
import TransactionSelectionScreen from './screens/TransactionSelectionScreen';
import ProductManagementScreen from './screens/ProductManagementScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import ReceiptScreen from './screens/ReceiptScreen';
import CustomerSearchScreen from './screens/CustomerSearchScreen';

// Configure Amplify with your project settings
Amplify.configure(outputs);

const client = generateClient<Schema>();
const Stack = createNativeStackNavigator();

// Sign out button component with explicit handling
function SignOutButton() {
  const { signOut } = useAuthenticator();
  return <Button title="Sign Out" onPress={signOut} />;
}

// Main application content
function AppContent() {
  const [hasBusinesses, setHasBusinesses] = useState<boolean | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { authStatus, user, signOut } = useAuthenticator((context) => [ // Destructure signOut
      context.authStatus,
      context.user,
      context.signOut,
  ]);
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    console.log("Auth status changed:", authStatus);
    if (authStatus === 'authenticated') {
      console.log("User authenticated, checking for businesses");
      checkForBusinesses();
    } else if (authStatus === 'unauthenticated') {
      // Reset state when user signs out
      setHasBusinesses(null);
      setBusinessId('');
      setBusinessName('');
      setLoading(true); // Go back to loading state until authenticated again
    }
  }, [authStatus, user]); // Add user to dependency array

  // Check if user has businesses
  const checkForBusinesses = async () => {
    // Use user directly from useAuthenticator hook
    if (!user?.userId) { // Use userId which is more reliable than username
      console.log("User ID not available yet");
      setLoading(false); // Stop loading if no user ID
      setHasBusinesses(false); // Assume no businesses without user ID
      return;
    }

    setLoading(true);
    try {
      console.log(`Checking for businesses for user ID: ${user.userId}`);
      // Filter by userId (assuming your schema uses userId or owner mapped to it)
      const result = await client.models.Business.list({
         filter: {
           // Adjust this filter based on your actual schema field for ownership
           // It might be owner, userId, etc. Make sure it matches amplify/data/resource.ts
           userId: { eq: user.userId } // Use userId
         }
       });

      console.log("Business check result:", JSON.stringify(result, null, 2)); // Pretty print result
      const businesses = result.data || [];
      const hasBusiness = businesses.length > 0;
      console.log("Has businesses:", hasBusiness);

      if (hasBusiness) {
        // Store the first business ID and name found
        setBusinessId(businesses[0].id);
        setBusinessName(businesses[0].name);
      }

      setHasBusinesses(hasBusiness);
    } catch (error) {
      console.error("Error checking for businesses:", error);
      setHasBusinesses(false); // Set to false on error
    } finally {
       setLoading(false); // Ensure loading is set to false
    }
  };

  const handleBusinessCreated = (newBusinessId: string, newBusinessName: string) => {
    setBusinessId(newBusinessId);
    setBusinessName(newBusinessName);
    setHasBusinesses(true);
    // Force dashboard to re-mount completely using the key
    setDashboardKey(prev => prev + 1);
    console.log(`Business created: ${newBusinessName} (${newBusinessId})`);
  };

  function WelcomeScreen() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>Welcome to the Dry Cleaning POS</Text>
        <Text style={{ textAlign: 'center' }}>It looks like you don't have a business set up yet.</Text>
        <Text style={{ textAlign: 'center' }}>Please create one to continue.</Text>
        {/* The modal will appear over this screen */}
      </View>
    );
  }

  // Determine modal visibility: show when not loading and user is authenticated but has no businesses
  const modalVisible = !loading && authStatus === 'authenticated' && hasBusinesses === false;
  console.log("Modal visibility state:", { loading, authStatus, hasBusinesses, modalVisible });

  if (loading && authStatus === 'authenticated') {
    // Show loading indicator only after authentication while checking for businesses
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading business data...</Text>
      </View>
    );
  }


  return (
    <NavigationContainer>
      {/* Main application navigation */}
      <Stack.Navigator>
        {authStatus === 'authenticated' && hasBusinesses === true ? (
          // Render business screens ONLY if authenticated AND hasBusinesses is true
          <>
            <Stack.Screen
              key={dashboardKey} // Force remount when business is created
              name="Dashboard"
              component={DashboardScreen}
              initialParams={{ businessId, businessName }}
              options={{
                headerShown: true,
                title: `Dashboard: ${businessName}`, // Show business name in title
                headerRight: () => <SignOutButton />
              }}
            />
            <Stack.Screen
              name="CustomerSearch"
              component={CustomerSearchScreen}
              initialParams={{ businessId, businessName }}
              options={{
                headerShown: true,
                title: "Customers",
                headerRight: () => <SignOutButton />
              }}
            />
            <Stack.Screen
              name="CustomerEdit"
              component={CustomerEditScreen}
              initialParams={{ businessId }}
              options={{
                headerShown: true,
                title: "Edit Customer",
                headerRight: () => <SignOutButton />
              }}
            />
            <Stack.Screen
              name="ProductManagement"
              component={ProductManagementScreen}
              initialParams={{ businessId, businessName }}
              options={{
                headerShown: true,
                title: "Products & Services",
                headerRight: () => <SignOutButton />
              }}
            />
            <Stack.Screen
              name="TransactionSelection"
              component={TransactionSelectionScreen}
              initialParams={{ businessId }}
              options={{
                headerShown: true,
                title: "New Transaction",
                headerRight: () => <SignOutButton />
              }}
            />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{
                headerShown: false // Typically no header needed here
              }}
            />
            <Stack.Screen
              name="Receipt"
              component={ReceiptScreen}
              options={{
                headerShown: false // Typically no header needed here
              }}
            />
          </>
        ) : (
          // Show Welcome screen if authenticated but no businesses, or during initial load before check completes
           // Or if loading is false, authenticated, but hasBusinesses is explicitly false
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              headerShown: true,
              title: "Welcome",
              headerRight: () => (authStatus === 'authenticated' ? <SignOutButton /> : null) // Show sign out only if authenticated
            }}
          />
        )}
      </Stack.Navigator>

      {/* Business modal - only visible when authenticated and no businesses exist */}
      {authStatus === 'authenticated' && ( // Ensure modal only renders if authenticated
         <CreateBusinessModal
           isVisible={modalVisible}
           onBusinessCreated={handleBusinessCreated}
           onCancel={signOut} // Pass signOut from useAuthenticator
         />
       )}
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