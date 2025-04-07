import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EditCustomerModal from '../../shared/components/EditCustomerModal';
import BarcodeScannerModal from '../../shared/components/BarCodeScannerModal';
import QRCode from 'react-native-qrcode-svg';
import { generateQRCodeData, EntityType } from '../../shared/components/qrCodeGenerator';
import { styles } from './styles/customerEditStyles';

// Initialize Amplify client
const client = generateClient<Schema>();
type Customer = Schema['Customer']['type'];

// Define our route parameter types
type RootStackParamList = {
  CustomerEdit: { businessId: string; customerId?: string };
  CustomerSelection: undefined;
};

type CustomerEditScreenRouteProp = RouteProp<RootStackParamList, 'CustomerEdit'>;
type CustomerEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CustomerEditScreen = () => {
  const navigation = useNavigation<CustomerEditScreenNavigationProp>();
  const route = useRoute<CustomerEditScreenRouteProp>();
  const { businessId, customerId } = route.params || {};

  const [searchText, setSearchText] = useState('');
  const [quickSearchPhoneOrEmail, setQuickSearchPhoneOrEmail] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [foundExternalCustomer, setFoundExternalCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [barcodeModalVisible, setBarcodeModalVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Function to fetch all customers for current business
  const fetchCustomers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await client.models.Customer.list({
        filter: { businessID: { eq: businessId } }
      });

      if (result.data) {
        const customerData = result.data.map(customer => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email || undefined,
          address: customer.address || undefined,
          city: customer.city || undefined,
          state: customer.state || undefined,
          zipCode: customer.zipCode || undefined,
          notes: customer.notes || undefined,
          businessID: customer.businessID
        }));

        setCustomers(customerData as Customer[]);
        setFilteredCustomers(customerData as Customer[]);

        // No need to trigger QR generation anymore as we're generating them dynamically
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, client]);

  // Fetch all customers for the current business on component mount
  useEffect(() => {
    fetchCustomers();

    // If a customerId was passed in the route, open that customer
    if (customerId) {
      openCustomerById(customerId);
    }
  }, [businessId, customerId]);

  // We don't need the QR code generation effects anymore

  // Open a specific customer by ID
  const openCustomerById = async (id: string) => {
    try {
      const customerResult = await client.models.Customer.get({ id });
      if (customerResult.data) {
        const customer = {
          id: customerResult.data.id,
          firstName: customerResult.data.firstName,
          lastName: customerResult.data.lastName,
          phone: customerResult.data.phone,
          email: customerResult.data.email || undefined,
          address: customerResult.data.address || undefined,
          city: customerResult.data.city || undefined,
          state: customerResult.data.state || undefined,
          zipCode: customerResult.data.zipCode || undefined,
          notes: customerResult.data.notes || undefined,
          businessID: customerResult.data.businessID
        };
        handleSelectCustomer(customer as Customer);
      }
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
    }
  };

  // Check if customer exists whenever quickSearchPhoneOrEmail changes
  useEffect(() => {
    if (quickSearchPhoneOrEmail.length > 8) {
      checkCustomerExists(quickSearchPhoneOrEmail);
    } else {
      setFoundExternalCustomer(null);
      setShowQuickAdd(false);
    }
  }, [quickSearchPhoneOrEmail]);

  // Function to check if customer exists
  const checkCustomerExists = async (searchValue: string): Promise<void> => {
    if (!searchValue.trim()) return;

    setIsSearchingExternal(true);
    try {
      // First, check if customer exists in this business
      const localCustomerResult = await client.models.Customer.list({
        filter: {
          and: [
            {
              or: [
                { phone: { eq: searchValue.trim() } },
                { email: { eq: searchValue.trim().toLowerCase() } }
              ]
            },
            { businessID: { eq: businessId } }
          ]
        }
      });

      if (localCustomerResult.data && localCustomerResult.data.length > 0) {
        // Customer already exists in this business - show them in the list
        const existingCustomer = localCustomerResult.data[0];
        setFilteredCustomers([{
          ...existingCustomer,
          phone: existingCustomer.phone || '',
          email: existingCustomer.email || undefined,
          address: existingCustomer.address || undefined,
          city: existingCustomer.city || undefined,
          state: existingCustomer.state || undefined,
          zipCode: existingCustomer.zipCode || undefined,
          notes: existingCustomer.notes || undefined
        }]);
        setShowQuickAdd(false);
        return;
      }

      // Customer not found in this business - check other businesses
      const externalCustomerResult = await client.models.Customer.list({
        filter: {
          and: [
            {
              or: [
                { phone: { eq: searchValue.trim() } },
                { email: { eq: searchValue.trim().toLowerCase() } }
              ]
            },
            { businessID: { ne: businessId } } // Any business except the current one
          ]
        }
      });

      if (externalCustomerResult.data && externalCustomerResult.data.length > 0) {
        // Found in another business - offer to import
        const externalCustomer = externalCustomerResult.data[0];
        setFoundExternalCustomer({
          ...externalCustomer,
          phone: externalCustomer.phone || '',
          email: externalCustomer.email || undefined,
          address: externalCustomer.address || undefined,
          city: externalCustomer.city || undefined,
          state: externalCustomer.state || undefined,
          zipCode: externalCustomer.zipCode || undefined,
          notes: externalCustomer.notes || undefined
        });
        setShowQuickAdd(true);
      } else {
        // Not found anywhere - offer to create new
        setFoundExternalCustomer(null);
        setShowQuickAdd(true);
      }
    } catch (error) {
      console.error('Error checking if customer exists:', error);
      Alert.alert('Error', 'Failed to check for existing customer. Please try again.');
    } finally {
      setIsSearchingExternal(false);
    }
  };

  // Handle barcode scan
  const handleBarcodeScan = (scannedValue: string) => {
    setQuickSearchPhoneOrEmail(scannedValue);
    checkCustomerExists(scannedValue);
  };

  // Handle quick search text change
  const handleQuickSearchChange = (text: string): void => {
    setQuickSearchPhoneOrEmail(text);
  };

  // Import customer from another business
  const handleImportExternalCustomer = async (): Promise<void> => {
    if (!foundExternalCustomer) return;

    setIsLoading(true);
    try {
      // Create a new customer record in the current business linked to the external customer via globalId
      const result = await client.models.Customer.create({
        firstName: foundExternalCustomer.firstName,
        lastName: foundExternalCustomer.lastName,
        phone: foundExternalCustomer.phone,
        email: foundExternalCustomer.email,
        address: foundExternalCustomer.address,
        city: foundExternalCustomer.city,
        state: foundExternalCustomer.state,
        zipCode: foundExternalCustomer.zipCode,
        notes: foundExternalCustomer.notes,
        businessID: businessId,
      });

      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }

      // No need to generate QR code here as we're generating them dynamically in the render function

      Alert.alert(
        'Success',
        `Customer ${foundExternalCustomer.firstName} ${foundExternalCustomer.lastName} imported successfully!`
      );

      // Reset states and refresh list
      setQuickSearchPhoneOrEmail('');
      setFoundExternalCustomer(null);
      setShowQuickAdd(false);
      fetchCustomers();

    } catch (error) {
      console.error('Error importing external customer:', error);
      Alert.alert('Error', 'Failed to import customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle standard search for customers in the list
  const handleSearchTextChange = (text: string): void => {
    setSearchText(text);

    if (!text.trim()) {
      // If search is empty, show all customers
      setFilteredCustomers(customers);
      return;
    }

    // Filter customers based on search text
    const searchTerm = text.trim().toLowerCase();
    const filtered = customers.filter(customer =>
      customer.firstName?.toLowerCase().includes(searchTerm) ||
      customer.lastName?.toLowerCase().includes(searchTerm) ||
      customer.phone?.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm))
    );

    setFilteredCustomers(filtered);
  };

  // Handle new customer button - reset form fields and open the modal
  const handleNewCustomer = (fromQuickSearch = false): void => {
    setSelectedCustomer(null);
    setIsNewCustomer(true);

    // If coming from quick search, pre-fill the phone or email
    if (fromQuickSearch && quickSearchPhoneOrEmail) {
      // Pre-fill form fields if we have a found external customer
      if (foundExternalCustomer) {
        setSelectedCustomer(foundExternalCustomer);
      } else {
        // Just pre-fill the phone or email from quick search
        const isEmail = quickSearchPhoneOrEmail.includes('@');
        setSelectedCustomer({
          id: '',
          firstName: '',
          lastName: '',
          phone: isEmail ? '' : quickSearchPhoneOrEmail,
          email: isEmail ? quickSearchPhoneOrEmail : '',
          businessID: businessId,
          joinDate: new Date().toISOString(),
          credits: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as unknown as Customer);
      }
    }

    setModalVisible(true);
    setShowQuickAdd(false);
  };

  // Handle search button press for main search
  const handleSearch = async (): Promise<void> => {
    if (!searchText.trim()) {
      // If search is empty, show all customers
      fetchCustomers();
      return;
    }

    setIsLoading(true);
    try {
      // Search by name, phone, or email
      const searchTerm = searchText.trim().toLowerCase();

      // Create the filter conditions based on search and business
      const searchConditions = [
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } },
        { phoneNumber: { contains: searchTerm } },
        { email: { contains: searchTerm } }
      ];

      // Add business filter since we always have a business ID
      const filter = {
        and: [
          { or: searchConditions },
          { businessID: { eq: businessId } }
        ]
      };

      // Query the database for matching customers
      const result = await client.models.Customer.list({ filter });

      if (result.data) {
        const customerData = result.data.map(customer => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email || undefined,
          address: customer.address || undefined,
          city: customer.city || undefined,
          state: customer.state || undefined,
          zipCode: customer.zipCode || undefined,
          notes: customer.notes || undefined,
          businessID: customer.businessID
        }));

        setCustomers(customerData as Customer[]);
        setFilteredCustomers(customerData as Customer[]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      Alert.alert('Error', 'Failed to search customers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // View full QR code
  const viewFullQRCode = (customer: Customer) => {
    // In the future, this could be enhanced to show a modal with
    // a larger QR code that could be saved or shared
    Alert.alert(
      'QR Code',
      `Customer: ${customer.firstName} ${customer.lastName}\nThis QR code can be scanned for quick identification.`,
      [
        { text: 'OK', onPress: () => console.log('QR Code viewed') }
      ],
      { cancelable: true }
    );
  };

  // Handle customer selection for editing
  const handleSelectCustomer = (customer: Customer): void => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setModalVisible(true);
  };

  // Handle customer deletion
  const handleDeleteCustomer = async () => {
    if (!selectedCustomer?.id) return;

    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${selectedCustomer.firstName} ${selectedCustomer.lastName}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await client.models.Customer.delete({
                id: selectedCustomer.id
              });

              Alert.alert('Success', 'Customer deleted successfully');
              setModalVisible(false);
              fetchCustomers();
            } catch (error) {
              console.error('Error deleting customer:', error);
              Alert.alert('Error', 'Failed to delete customer. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  // Handle customer save from modal
  const handleSaveCustomer = async (customer: Customer): Promise<void> => {
    setIsLoading(true);
    try {
      if (isNewCustomer) {
        // Create new customer
        const result = await client.models.Customer.create({
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          notes: customer.notes,
          businessID: businessId,
        });

        if (result.errors) {
          throw new Error(result.errors.map(e => e.message).join(', '));
        }

        Alert.alert('Success', 'Customer created successfully!');
      } else {
        // Update existing customer
        if (!customer.id) {
          throw new Error('Customer ID is required for updates');
        }

        const result = await client.models.Customer.update({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          notes: customer.notes
        });

        if (result.errors) {
          throw new Error(result.errors.map(e => e.message).join(', '));
        }

        Alert.alert('Success', 'Customer updated successfully!');
      }

      // Reset states and refresh list
      setModalVisible(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      Alert.alert('Error', 'Failed to save customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render customer item
  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    // Create a BaseEntityData-compatible object from the Customer item
    const entityData = {
      id: item.id,
      name: fullName,
      phone: item.phone || undefined
    };
    const qrData = generateQRCodeData('Customer', entityData);

    return (
      <TouchableOpacity
        style={styles.customerItem}
        onPress={() => handleSelectCustomer(item)}
      >
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{fullName}</Text>
          <Text style={styles.customerDetail}>{item.phone}</Text>
          {item.email && <Text style={styles.customerDetail}>{item.email}</Text>}
        </View>
        <TouchableOpacity
          style={styles.qrCodeContainer}
          onPress={() => viewFullQRCode(item)}
        >
          <QRCode
            value={qrData}
            size={50}
            backgroundColor='white'
            color='black'
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Customer Management</Text>
        </View>

        {/* Quick Search Section */}
        <View style={styles.quickSearchContainer}>
          <TextInput
            ref={inputRef}
            style={styles.quickSearchInput}
            placeholder="Scan or enter phone/email"
            value={quickSearchPhoneOrEmail}
            onChangeText={handleQuickSearchChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setBarcodeModalVisible(true)}
          >
            <Text style={styles.buttonText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Add Section */}
        {showQuickAdd && (
          <View style={styles.quickAddContainer}>
            {isSearchingExternal ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : (
              <>
                {foundExternalCustomer ? (
                  <>
                    <Text style={styles.quickAddText}>
                      Found in another business: {foundExternalCustomer.firstName} {foundExternalCustomer.lastName}
                    </Text>
                    <TouchableOpacity
                      style={styles.quickAddButton}
                      onPress={handleImportExternalCustomer}
                    >
                      <Text style={styles.buttonText}>Import</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.quickAddText}>
                      No existing customer found with this contact info.
                    </Text>
                    <TouchableOpacity
                      style={styles.quickAddButton}
                      onPress={() => handleNewCustomer(true)}
                    >
                      <Text style={styles.buttonText}>Create New</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* Main Search Section */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, or email"
            value={searchText}
            onChangeText={handleSearchTextChange}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.searchTypeButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchTypeText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Customer List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : (
          <FlatList
            data={filteredCustomers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            style={styles.customerList}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No customers found</Text>
              </View>
            }
          />
        )}

        {/* New Customer Button */}
        <TouchableOpacity
          style={styles.newCustomerButton}
          onPress={() => handleNewCustomer()}
        >
          <Text style={styles.buttonText}>New Customer</Text>
        </TouchableOpacity>

        {/* Customer Edit Modal */}
        <EditCustomerModal
          visible={modalVisible}
          customerId={selectedCustomer?.id}
          businessId={businessId}
          isNewCustomer={isNewCustomer}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveCustomer}
          onDelete={handleDeleteCustomer}
        />

        {/* Barcode Scanner Modal */}
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          onClose={() => setBarcodeModalVisible(false)}
          onCodeScanned={handleBarcodeScan}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CustomerEditScreen;