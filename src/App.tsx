import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import Toast from 'react-native-toast-message';
import Navigation from './components/Navigation';
import SignOutButton from './components/SignOutButton';
import outputs from '../amplify_outputs.json';
import { LogBox } from 'react-native';
import BusinessForm from './components/BusinessForm';

LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered.',
]);
import type { Schema } from '../amplify/data/resource';

Amplify.configure(outputs);
const client = generateClient<Schema>();

// Maximum time to wait for initial loading
const MAX_LOADING_TIME = 3000;

function AuthenticatedApp() {
  const { user } = useAuthenticator((context) => [context.user]);
  const userId = user?.userId;
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  
  // Use this to force-end loading state after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log("[App] Force ending loading state after timeout");
        setIsLoading(false);
      }
    }, MAX_LOADING_TIME);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Check for business directly in App.tsx
  useEffect(() => {
    let isMounted = true;
    
    async function checkUserBusiness() {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        console.log("[App] Checking for existing business...");
        
        const { data, errors } = await client.models.Business.list({
          filter: {
            userId: {
              eq: userId
            }
          }
        });
        
        if (!isMounted) return;
        
        if (data && !errors && data.length > 0) {
          console.log(`[App] Found business: ${data[0].businessName}`);
          setBusiness(data[0]);
        } else {
          console.log("[App] No businesses found");
          setBusiness(null);
        }
      } catch (error) {
        console.error("[App] Error checking business:", error);
        if (isMounted) setBusiness(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    checkUserBusiness();
    
    return () => {
      isMounted = false;
    };
  }, [userId, refresh]);

  // Show success toast
  const showSuccessToast = () => {
    Toast.show({
      type: 'success',
      text1: 'Success!',
      text2: 'Business created successfully',
      position: 'bottom',
      visibilityTime: 4000,
    });
  };

  // Handle business creation directly in App.tsx
  const handleBusinessCreated = () => {
    console.log("[App] Business created successfully");
    
    // Close the modal
    setShowBusinessModal(false);
    
    // Show success toast
    showSuccessToast();
    
    // Trigger a refresh to fetch the business
    console.log("[App] Triggering refresh to fetch business");
    setRefresh(prev => prev + 1);
  };

  // Handle modal close
  const handleCloseModal = () => {
    console.log("[App] Business modal closed");
    setShowBusinessModal(false);
  };

  // If still loading, show a loading screen with a timeout
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <SignOutButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no business found, show create business screen
  if (!business) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <SignOutButton />
        <View style={styles.noBusiness}>
          <Text style={styles.noBusinessTitle}>Welcome to POS Dryclean!</Text>
          <Text style={styles.noBusinessText}>
            To get started, please create a business profile.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowBusinessModal(true)}
          >
            <Text style={styles.createButtonText}>Create Business</Text>
          </TouchableOpacity>

          <BusinessForm
            visible={showBusinessModal}
            onClose={handleCloseModal}
            onSuccess={handleBusinessCreated}
          />
        </View>
        <Toast />
      </SafeAreaView>
    );
  }

  // If we have a business, show normal navigation
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SignOutButton />
      <View style={{ flex: 1 }}>
        <Navigation user={user} refresh={refresh} business={business} />
      </View>
      <Toast />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <AuthenticatedApp />
      </Authenticator>
    </Authenticator.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noBusiness: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  noBusinessTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  noBusinessText: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});