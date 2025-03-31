import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from '../styles/screens/dashboardStyles';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import QRCode from 'react-native-qrcode-svg'; 
import Svg from 'react-native-svg'; 
import { generateQRCodeData } from '../utils/qrCodeGenerator'; 
import Toast from 'react-native-toast-message';

// Initialize Amplify client
const client = generateClient<Schema>();

// Define the Business type based on the schema
type BusinessData = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  owner: string;
};

export default function DashboardScreen({ route }: { route: any }) {
  const { businessId } = route.params || {}; 
  const { user } = useAuthenticator();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [businessData, setBusinessData] = useState<BusinessData | null>(null); 
  const [qrCodeString, setQrCodeString] = useState<string>(''); 
  
  // Fetch business data when component mounts or user/businessId changes
  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!user?.username && !businessId) {
        console.log("User or Business ID not available for fetching data.");
        setBusinessData(null); 
        return;
      }

      try {
        console.log(`Fetching business data... ID: ${businessId}, User: ${user?.username}`);
        let fetchedData: BusinessData | null = null;

        if (businessId) {
          const result = await client.models.Business.get({ id: businessId });
          if (result.data) {
            fetchedData = result.data as BusinessData; 
          }
        } else if (user?.username) {
          const result = await client.models.Business.list({
            filter: { owner: { eq: user.username } }
          });
          if (result.data && result.data.length > 0) {
            fetchedData = result.data[0] as BusinessData; 
          }
        }

        if (fetchedData) {
          console.log("Fetched Business Data:", fetchedData);
          setBusinessData(fetchedData);
        } else {
          console.log("No business data found.");
          setBusinessData(null); 
        }
      } catch (error) {
        console.error('Error fetching business data:', error);
        setBusinessData(null); 
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
        text2: 'We\'ve added some preset services to get you started. You can edit them anytime.',
        visibilityTime: 4000,
      });
    }
  }, [route.params?.showSeededMessage]);
  
  // Generate QR Code string when businessData is available
  useEffect(() => {
    if (businessData) {
      const qrString = generateQRCodeData('Business', businessData);
      console.log("Generated QR String:", qrString);
      setQrCodeString(qrString);
    } else {
      setQrCodeString(''); 
    }
  }, [businessData]);
  
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
    const currentBusinessId = businessData?.id || '';
    const currentBusinessName = businessData?.name || '';

    const params: { businessId: string; businessName: string; [key: string]: any } = {
      businessId: currentBusinessId,
      businessName: currentBusinessName,
    };

    if (screenName === 'CustomerEdit') {
      navigation.navigate(screenName, params);
    } else {
      navigation.navigate(screenName, params); 
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>
            {(businessData?.name ? businessData.name.toUpperCase() : 'LOADING...')}
          </Text>
        </View>
        {qrCodeString ? (
          <View style={styles.qrCodeContainer}> 
            <View style={styles.qrCodeWrapper}> 
              <QRCode
                value={qrCodeString}
                size={100} 
                logoBackgroundColor='transparent'
              />
            </View>
          </View>
        ) : (
          <View style={styles.qrCodeContainer} /> 
        )}
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
        contentContainerStyle={styles.menuGrid}
      />
      <Toast />
    </View>
  );
}