// src/screens/DashboardScreen.tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native'; // Added ActivityIndicator
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import { styles } from './styles/dashboardStyles';
import Toast from 'react-native-toast-message';
import { getQRCodeURL } from './../../shared/components/qrCodeGenerator';
// Use the generated Business type directly for better type safety
// import { BusinessData } from '../types/BusinessTypes'; // Remove this if using generated type
type BusinessData = Schema['Business']['type']; // Use the generated type

const client = generateClient<Schema>();

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

      if (!user?.userId && !businessId) {
        console.log("User or Business ID not available for fetching data.");
        setIsLoading(false); // Stop loading
        return;
      }

      try {
        console.log(`Fetching business data... ID: ${businessId}, User: ${user?.userId}`);
        // Initialize fetchedData to null
        let fetchedData: BusinessData | null = null;

        if (businessId) {
          const result = await client.models.Business.get({ id: businessId });
          if (result.data) {
            // The result.data should match the BusinessData type generated from the schema
            fetchedData = result.data;
          }
        } else if (user?.userId) {
          const { data: businesses } = await client.models.Business.list({
            filter: { owner: { eq: user.userId } },
            limit: 1 // Only need the first one if multiple exist for the owner
          });
          if (businesses && businesses.length > 0) {
            // businesses[0] should match the BusinessData type
            fetchedData = businesses[0];
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
  }, [user, businessId]);

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
  }, [route.params?.showSeededMessage]);

  const menuItems = [
    { title: 'Product Management', screen: 'ProductManagement', icon: '📦' },
    { title: 'Employee Management', screen: 'EmployeeManagement', icon: '👥' },
    { title: 'Appointments', screen: 'Appointments', icon: '📅' },
    { title: 'Order Management', screen: 'OrderManagement', icon: '📋' },
    { title: 'Customers', screen: 'CustomerEdit', icon: '👤' },
    { title: 'Reports', screen: 'Reports', icon: '📊' },
    { title: 'Settings', screen: 'Settings', icon: '⚙️' },
  ];

  const navigateToScreen = (screenName: string) => {
    // Only navigate if business data is loaded
    if (!businessData?.id) {
      Toast.show({ type: 'info', text1: 'Loading business data...' });
      return;
    }
    const currentBusinessId = businessData.id;
    const currentBusinessName = businessData.name || 'Business'; // Provide a fallback name

    const params: { businessId: string; businessName: string;[key: string]: any } = {
      businessId: currentBusinessId,
      businessName: currentBusinessName,
    };

    // Special case for Customer screen to ensure it goes to search/list first
    if (screenName === 'CustomerEdit') {
      navigation.navigate('CustomerEdit', params); 
    } else {
      navigation.navigate(screenName, params);
    }
  };

  // Show loading indicator while fetching
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  // Handle case where no business data could be loaded
  if (!businessData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Could not load business data.</Text>
        {/* Optionally add a button to retry or go back */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>
            {/* Now safe to access businessData.name */}
            {(businessData.name ? businessData.name.toUpperCase() : 'NO NAME')}
          </Text>
        </View>
        {/* Keep QR code display logic */}
        <View style={styles.qrCodeContainer}>
          {qrCodeUrl ? (
            <View style={styles.qrCodeWrapper}>
              <Image
                source={{ uri: qrCodeUrl }}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
                onError={(e) => console.log("Error loading QR image:", e.nativeEvent.error)}
              />
            </View>
          ) : (
            businessData.qrCode ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.noQrText}>No QR Code</Text>
            )
          )}
        </View>
        <Text style={styles.subtitle}>DASHBOARD</Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigateToScreen('CustomerSearch')}
      >
        <Text style={styles.startButtonText}>START TRANSACTION</Text>
      </TouchableOpacity>

      <FlatList
        data={menuItems}
        numColumns={2}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigateToScreen(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContentContainer} // Add some padding if needed
      />
    </View>
  );
}