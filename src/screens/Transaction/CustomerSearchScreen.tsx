import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';
import CreateCustomerModal from '../../shared/components/CreateCustomerModal';
import BarcodeScannerModal from '../../shared/components/BarCodeScannerModal';
import { styles } from './styles/customerSearchStyles';
import { getQRCodeURL } from '../../shared/components/qrCodeGenerator';
import QRCode from 'react-native-qrcode-svg';

// Route params type
type CustomerSearchScreenRouteParams = {
  businessId: string;
};

const client = generateClient<Schema>();
type Customer = Schema['Customer']['type'];

const CustomerSearchScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { businessId } = route.params as CustomerSearchScreenRouteParams;
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<(Customer & { qrCodeUrl?: string })[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<(Customer & { qrCodeUrl?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanQrModalVisible, setScanQrModalVisible] = useState(false);
  const [searchingGlobally, setSearchingGlobally] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<Customer[]>([]);
  const [loadingQrCodes, setLoadingQrCodes] = useState<Record<string, boolean>>({});
  const inputRef = useRef<TextInput>(null);
  const { user } = useAuthenticator();

  // Fetch all customers for the current business on component mount
  useEffect(() => {
    fetchCustomers();
  }, [businessId]);

  // Function to fetch all customers for current business
  const fetchCustomers = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await client.models.Customer.list({
        filter: { businessID: { eq: businessId } }
      });

      if (result.errors) {
        console.error('Errors fetching customers:', result.errors);
        Alert.alert('Error', 'Failed to fetch customers');
      } else {
        const customersData = result.data as unknown as Customer[] || [];
        console.log('Fetched customers:', customersData.length);
        
        // Process customers and load QR code URLs
        const customersWithQrCode = await Promise.all(
          customersData.map(async customer => {
            const customerWithQrCode = { ...customer } as Customer & { qrCodeUrl?: string };
            
            // Load QR code URL if available
            if (customer.qrCode) {
              try {
                setLoadingQrCodes(prev => ({ ...prev, [customer.id]: true }));
                const qrCodeUrl = await getQRCodeURL(customer.qrCode);
                customerWithQrCode.qrCodeUrl = qrCodeUrl;
              } catch (error) {
                console.error(`Error loading QR code for customer ${customer.id}:`, error);
              } finally {
                setLoadingQrCodes(prev => ({ ...prev, [customer.id]: false }));
              }
            }
            
            return customerWithQrCode;
          })
        );
        
        setCustomers(customersWithQrCode);
        setFilteredCustomers(customersWithQrCode);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a unique QR code for a customer
  const generateQrCode = () => {
    return uuidv4();
  };

  // Generate a global ID for a customer (to link across businesses)
  const generateGlobalId = () => {
    return uuidv4();
  };

  // Search customers based on input text
  const handleSearch = (text: string) => {
    setSearchText(text);

    if (!text.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const lowerCaseQuery = text.toLowerCase();
    const filtered = customers.filter(customer => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const phone = customer.phone || '';
      const email = customer.email?.toLowerCase() || '';

      return fullName.includes(lowerCaseQuery) ||
        phone.includes(lowerCaseQuery) ||
        email.includes(lowerCaseQuery);
    });

    setFilteredCustomers(filtered);
  };

  // Format phone number for display (without +1 prefix)
  const formatPhoneNumberForDisplay = (phone: string) => {
    if (!phone) return '';

    // Remove the +1 prefix if it exists
    if (phone.startsWith('+1')) {
      return phone.substring(2);
    }
    // Remove just the + if it exists with another country code
    if (phone.startsWith('+')) {
      return phone.substring(1);
    }
    return phone;
  };

  // Search for existing customer profiles globally by phone number
  const searchGlobalCustomers = async (phone: string): Promise<Customer[]> => {
    setSearchingGlobally(true);
    try {
      const formattedPhone = phone; // Assume phone is already formatted correctly
      const result = await client.models.Customer.list({
        filter: { phone: { eq: formattedPhone } }
      });

      if (result.errors) {
        console.error('Error searching customers:', result.errors);
        return []; // Return empty array instead of undefined
      } else if (result.data && result.data.length > 0) {
        // Filter out customers from the current business
        const otherBusinessCustomers = result.data.filter(c => c.businessID !== businessId);
        setGlobalSearchResults(otherBusinessCustomers as unknown as Customer[]);
        return otherBusinessCustomers as unknown as Customer[];
      } else {
        setGlobalSearchResults([]);
        return [];
      }
    } catch (error) {
      console.error('Error searching global customers:', error);
      setGlobalSearchResults([]);
      return [];
    } finally {
      setSearchingGlobally(false);
    }
  };

  // Handle QR code scan result
  const handleQrCodeScanned = async (qrCode: string) => {
    setScanQrModalVisible(false);
    setIsLoading(true);

    try {
      // Search for customer by QR code
      const result = await client.models.Customer.list({
        filter: { qrCode: { eq: qrCode } }
      });

      if (result.errors) {
        console.error('Error searching by QR code:', result.errors);
        Alert.alert('Error', 'Failed to search by QR code');
      } else if (result.data && result.data.length > 0) {
        const existingCustomer = result.data[0] as Customer;

        // Check if this customer already belongs to this business
        if (existingCustomer.businessID === businessId) {
          // Customer already belongs to this business
          handleSelectCustomer(existingCustomer);
        } else {
          // Create a new customer for this business but link it with the global ID
          const newCustomer = await createCustomerFromExisting(existingCustomer);
          if (newCustomer) {
            handleNewCustomerCreated(newCustomer);
            Alert.alert('Success', 'Customer added to this business');
          } else {
            Alert.alert('Error', 'Failed to add customer to this business');
          }
        }
      } else {
        Alert.alert('Not Found', 'No customer found with this QR code');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new customer based on an existing one from another business
  const createCustomerFromExisting = async (existingCustomer: Customer) => {
    try {
      // Use the same global ID if it exists, or create a new one
      const globalId = existingCustomer.cognitoUserId || generateGlobalId();

      const result = await client.models.Customer.create({
        businessID: businessId,
        firstName: existingCustomer.firstName,
        lastName: existingCustomer.lastName,
        phone: existingCustomer.phone,
        email: existingCustomer.email || undefined,
        qrCode: existingCustomer.qrCode, // Use the same QR code for recognition
        cognitoUserId: globalId, // Link to the same customer across businesses
      });

      if (result.errors) {
        console.error('Error creating customer:', result.errors);
        return null;
      }

      return result.data as Customer;
    } catch (error) {
      console.error('Error creating customer from existing:', error);
      return null;
    }
  };

  // Handle when a new customer is created
  const handleNewCustomerCreated = async (customer: Customer) => {
    console.log('New customer created:', customer);
    
    // Add the QR code URL if available
    const customerWithQrCode = { ...customer } as Customer & { qrCodeUrl?: string };
    
    if (customer.qrCode) {
      try {
        setLoadingQrCodes(prev => ({ ...prev, [customer.id]: true }));
        const qrCodeUrl = await getQRCodeURL(customer.qrCode);
        customerWithQrCode.qrCodeUrl = qrCodeUrl;
      } catch (error) {
        console.error(`Error loading QR code for new customer ${customer.id}:`, error);
      } finally {
        setLoadingQrCodes(prev => ({ ...prev, [customer.id]: false }));
      }
    }
    
    // Add the new customer to the list
    setCustomers(prevCustomers => [customerWithQrCode, ...prevCustomers]);
    setFilteredCustomers(prevFiltered => [customerWithQrCode, ...prevFiltered]);
    setModalVisible(false);
    
    // Select the new customer
    handleSelectCustomer(customer);
  };

  // Handle customer selection for transaction
  const handleSelectCustomer = (customer: Customer) => {
    // Navigate to TransactionSelectionScreen
    navigation.navigate('TransactionSelection', {
      customer: customer, // Pass the entire customer object
      businessId: businessId,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`
    });
  };

  // Render QR code or placeholder
  const renderQrCode = (customer: Customer & { qrCodeUrl?: string }) => {
    if (loadingQrCodes[customer.id]) {
      return (
        <View style={styles.qrCodePlaceholder}>
          <ActivityIndicator size="small" color="#0000ff" />
        </View>
      );
    }
    
    if (customer.qrCodeUrl) {
      return (
        <Image 
          source={{ uri: customer.qrCodeUrl }} 
          style={styles.qrCodeImage} 
          resizeMode="contain"
        />
      );
    } else if (customer.qrCode) {
      // We have a QR code key but no loaded URL yet
      return (
        <View style={styles.qrCodePlaceholder}>
          <QRCode
            value={customer.id}
            size={50}
            backgroundColor="white"
            color="black"
          />
        </View>
      );
    } else {
      // No QR code available
      return (
        <View style={styles.qrCodePlaceholder}>
          <Text style={styles.qrPlaceholderText}>No QR</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search by name, phone, or email"
          value={searchText}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanQrModalVisible(true)}>
          <Text style={styles.scanButtonText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading customers...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => handleSelectCustomer(item)}
              >
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.customerPhone}>{formatPhoneNumberForDisplay(item.phone || '')}</Text>
                  {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
                </View>
                
                {/* QR Code display */}
                <View style={styles.qrCodeContainer}>
                  {renderQrCode(item)}
                </View>
                
                <View style={styles.selectButtonContainer}>
                  <Text style={styles.selectButtonText}>Select</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No customers found</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>Add New Customer</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal
        visible={modalVisible}
        businessId={businessId}
        onClose={() => setModalVisible(false)}
        onCustomerCreated={handleNewCustomerCreated}
        searchGlobalCustomers={searchGlobalCustomers}
        initialData={{ phoneNumber: searchText.length > 5 ? searchText : undefined }}
      />

      {/* BarCode Scanner Modal */}
      <BarcodeScannerModal
        visible={scanQrModalVisible}
        onClose={() => setScanQrModalVisible(false)}
        onCodeScanned={handleQrCodeScanned}
      />
    </View>
  );
};

export default CustomerSearchScreen;