// src/screens/DashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource'; // Import generated Schema
import { getQRCodeURL } from '../utils/qrCodeGenerator';
import Toast from 'react-native-toast-message';
import { styles } from '../styles/screens/dashboardStyles';

// Use the generated Business type directly for better type safety
type BusinessData = Schema['Business']['type']; // Define BusinessData using the generated schema type

const client = generateClient<Schema>(); // Use the generated Schema type with the client

export default function DashboardScreen({ route }: { route: any }) {
  const { businessId } = route.params || {};
  const { user } = useAuthenticator();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state

  // Fetch business data when component mounts or user/businessId changes
  useEffect(() => {
    const fetchBusinessData = async () => {
      setIsLoading(true); // Start loading
      setBusinessData(null); // Reset previous data
      setQrCodeUrl('');

      // Ensure user ID is available before fetching based on owner field
      // Amplify uses user.userId for owner checks usually
      const currentUserId = user?.userId;
      if (!currentUserId && !businessId) {
        console.log("User or Business ID not available for fetching data.");
        setIsLoading(false); // Stop loading
        return;
      }

      try {
        console.log(`Fetching business data... Business ID: ${businessId}, User Owner ID: ${currentUserId}`);
        // Initialize fetchedData to null
        let fetchedData: BusinessData | null = null;

        if (businessId) {
          const result = await client.models.Business.get({ id: businessId });
          if (result.data) {
            // The result.data should match the BusinessData type generated from the schema
            fetchedData = result.data;
          }
        } else if (currentUserId) { // Use the captured user ID
          // Use 'owner' field as defined in schema for filtering
          const { data: businesses } = await client.models.Business.list({
            filter: { owner: { eq: currentUserId } },
            limit: 1 // Only need the first one if multiple exist for the owner
          });
          if (businesses && businesses.length > 0) {
            // businesses[0] should match the BusinessData type
            fetchedData = businesses[0];
          } else {
             console.log("No Business found associated with owner ID:", currentUserId);
          }
        }

        if (fetchedData) {
          console.log("Fetched Business Data:", fetchedData);
          setBusinessData(fetchedData);

          // Fetch QR code URL if the business has a qrCode field
          if (fetchedData.qrCode) {
            try {
                const url = await getQRCodeURL(fetchedData.qrCode);
                console.log('Generated QR Code URL:', url);
                setQrCodeUrl(url);
            } catch (qrError) {
                console.error("Error fetching QR Code URL:", qrError);
                // Optionally show a toast or message about QR code failure
                Toast.show({ type: 'error', text1: 'Could not load QR Code' });
            }
          } else {
            console.log("Business has no QR code key stored.");
            setQrCodeUrl(''); // Ensure QR code URL is cleared if no key
          }
        } else {
          console.log("No business data found.");
          // Keep businessData as null
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
         Toast.show({ type: 'error', text1: 'Failed to load business data' });
        // Keep businessData as null
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome
      }
    };

    fetchBusinessData();
  }, [user, businessId]); // Dependency array includes user and businessId

  // Add a new separate useEffect for handling the seeded data message
  useEffect(() => {
    if (route.params?.showSeededMessage) {
      // Show a toast or notification
      Toast.show({
        type: 'success',
        text1: 'Business created successfully',
        text2: 'Preset services added. Edit them anytime.',
        visibilityTime: 5000, // Increased visibility time
        position: 'bottom', // Show at the bottom
      });
       // Optional: Clear the param to prevent showing the message again on navigation changes
       // This depends on your navigation setup
       // navigation.setParams({ showSeededMessage: undefined });
    }
  }, [route.params?.showSeededMessage, navigation]); // Added navigation to dependency array if setParams is used

  const menuItems = [
    { title: 'Product Management', screen: 'ProductManagement', icon: '📦' },
    { title: 'Employee Management', screen: 'EmployeeManagement', icon: '👥' },
    { title: 'Appointments', screen: 'Appointments', icon: '📅' },
    { title: 'Order Management', screen: 'OrderManagement', icon: '📋' },
    { title: 'Customers', screen: 'CustomerSearch', icon: '👤' }, // Changed screen to CustomerSearch
    { title: 'Settings', screen: 'BusinessSettings', icon: '⚙️' },
    // { title: 'Point of Sale', screen: 'PointOfSale', icon: '🛒' }, // Removed POS temporarily
    // { title: 'Reports', screen: 'Reports', icon: '📊' }, // Removed Reports temporarily
  ];

  const navigateToScreen = (screenName: string) => {
    // Only navigate if business data is loaded
    if (!businessData?.id) {
         Toast.show({ type: 'info', text1: 'Loading business data...' });
        return;
    }
    const currentBusinessId = businessData.id;
    const currentBusinessName = businessData.name || 'Business'; // Provide a fallback name

    const params: { businessId: string; businessName: string; [key: string]: any } = {
      businessId: currentBusinessId,
      businessName: currentBusinessName,
    };

     // Special case for Customer screen to ensure it goes to search/list first
    if (screenName === 'CustomerEdit') {
        navigation.navigate('CustomerSearch', params); // Redirect CustomerEdit to CustomerSearch
    } else {
        navigation.navigate(screenName, params);
    }
  };

  // Loading state UI
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  // No business data found UI
  if (!businessData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Business Found</Text>
        <Text style={styles.subtitle}>Could not load business details. Please try again later or contact support.</Text>
        {/* Optionally add a button to retry or navigate elsewhere */}
      </View>
    );
  }

  // Main dashboard UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{businessData?.name || 'Business Dashboard'}</Text>
      {qrCodeUrl ? (
        <View style={styles.qrCodeContainer}>
          <Text style={styles.qrCodeLabel}>Business QR Code:</Text>
          <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
        </View>
      ) : (
          <Text style={styles.noQrCodeText}>QR Code not available</Text>
      )}
      <FlatList
        data={menuItems}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateToScreen(item.screen)}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.screen}
        numColumns={2} // Arrange items in two columns
        columnWrapperStyle={styles.row} // Style for the row wrapper
      />
        <Toast />
    </View>
  );
}