import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { v4 as uuidv4 } from 'uuid';
import CreateCustomerModal from '../../shared/components/CreateCustomerModal';
import { styles } from './styles/customerSearchStyles';

// Route params type
type CustomerSearchScreenRouteParams = {
  businessId: string;
};

// Customer type
const client = generateClient<Schema>();
type Customer = Schema['Customer']['type'];

const CustomerSearchScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { businessId } = route.params as CustomerSearchScreenRouteParams;
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanQrModalVisible, setScanQrModalVisible] = useState(false);
  const [searchingGlobally, setSearchingGlobally] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState<Customer[]>([]);
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
        setCustomers(customersData);
        setFilteredCustomers(customersData);
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

  // Format phone number to E.164 format for storage
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // For US numbers, format as +1XXXXXXXXXX
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    // If number already has country code
    if (digits.length > 10 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return digits;
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
  const searchGlobalCustomers = async (phone: string) => {
    setSearchingGlobally(true);
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const result = await client.models.Customer.list({
        filter: { phone: { eq: formattedPhone } }
      });

      if (result.errors) {
        console.error('Error searching customers:', result.errors);
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
        cognitoUserId: existingCustomer.cognitoUserId, // Link to the same customer across businesses
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
  const handleNewCustomerCreated = (customer: Customer) => {
    // Add the new customer to the list
    setCustomers(prevCustomers => [customer, ...prevCustomers]);
    setFilteredCustomers(prevFiltered => [customer, ...prevFiltered]);
    setModalVisible(false);
    // Select the new customer
    handleSelectCustomer(customer);
  };

  // Handle customer selection for transaction
  const handleSelectCustomer = (customer: Customer) => {
    // Navigate to TransactionSelectionScreen instead of NewTransaction
    navigation.navigate('TransactionSelection', {
      customer: customer, // Pass the entire customer object
      businessId: businessId
    });
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
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Add New Customer</Text>
      </TouchableOpacity>
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
        </>
      )}

      {/* Create Customer Modal */}
      <CreateCustomerModal
        visible={modalVisible}
        businessId={businessId}
        onClose={() => setModalVisible(false)}
        onCustomerCreated={(customer: unknown) => handleNewCustomerCreated(customer as Customer)}
        initialData={{ phone: searchText.length > 5 ? searchText : undefined }}
      />

      {/* QR Code Scanner Modal would go here */}
      <Modal
        visible={scanQrModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setScanQrModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Scan Customer QR Code</Text>
          {/* QR Code Scanner component would go here */}
          <Button title="Cancel" onPress={() => setScanQrModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

export default CustomerSearchScreen;