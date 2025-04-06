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
import { generateQRCodeData } from '../../shared/components/qrCodeGenerator';
import { styles } from './styles/customerEditStyles';
import { Customer } from '../../shared/types/CustomerTypes';
// Import QRCode directly for dynamic generation

// Initialize Amplify client
const client = generateClient<Schema>();

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
          joinDate: customer.joinDate,
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
          id: existingCustomer.id,
          firstName: existingCustomer.firstName,
          lastName: existingCustomer.lastName,
          phone: existingCustomer.phone || '',
          email: existingCustomer.email || undefined,
          address: existingCustomer.address || undefined,
          city: existingCustomer.city || undefined,
          state: existingCustomer.state || undefined,
          zipCode: existingCustomer.zipCode || undefined,
          joinDate: existingCustomer.joinDate,
          notes: existingCustomer.notes || undefined,
          businessID: existingCustomer.businessID
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
          id: '', // Will be created with a new ID
          firstName: externalCustomer.firstName,
          lastName: externalCustomer.lastName,
          phone: externalCustomer.phone || '',
          email: externalCustomer.email || undefined,
          address: externalCustomer.address || undefined,
          city: externalCustomer.city || undefined,
          state: externalCustomer.state || undefined,
          zipCode: externalCustomer.zipCode || undefined,
          notes: externalCustomer.notes || undefined,
          joinDate: externalCustomer.joinDate,
          businessID: businessId // Will be assigned to the current business
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
        joinDate: new Date().toISOString()
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
          joinDate: new Date().toISOString()
        });
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

  // We don't need the QR code generation method anymore since we're generating QR codes dynamically

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
    
    setIsLoading(true);
    try {
      const result = await client.models.Customer.delete({
        id: selectedCustomer.id
      });
      
      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }
      
      setModalVisible(false);
      Alert.alert('Success', 'Customer deleted successfully');
      fetchCustomers();
      
    } catch (error) {
      console.error('Error deleting customer:', error);
      Alert.alert('Error', 'Failed to delete customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render QR code directly using the library instead of loading from S3
  const renderQRCode = (customer: Customer) => {
    // Use the utility to generate consistent QR code data
    const qrData = generateQRCodeData('Customer', customer);
    
    return (
      <TouchableOpacity onPress={() => viewFullQRCode(customer)}>
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={qrData}
            size={60}
            backgroundColor="white"
            color="black"
          />
        </View>
      </TouchableOpacity>
    );
  };

  // Render each customer item in the list
  const renderItem = ({ item }: { item: Customer }) => (
    <View style={styles.customerItem}>
      <TouchableOpacity
        style={styles.customerItemContent}
        onPress={() => handleSelectCustomer(item)}
      >
        <View style={styles.customerInfoContainer}>
          <Text style={styles.customerName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.customerDetails}>
            {item.phone} {item.email ? `• ${item.email}` : ''}
          </Text>
          {item.address ? (
            <Text style={styles.customerAddress}>
              {item.address}
            </Text>
          ) : null}
        </View>
        
        <View style={styles.qrCodeContainer}>
          {renderQRCode(item)}
        </View>
      </TouchableOpacity>
      
      <View style={styles.customerActionsContainer}>
        <TouchableOpacity 
          style={[styles.customerAction, { flex: 1 }]}
          onPress={() => handleSelectCustomer(item)}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Quick Search Section */}
      <View style={styles.quickSearchContainer}>
        <Text style={styles.quickSearchTitle}>Quick Customer Lookup</Text>
        <View style={styles.quickSearchInputContainer}>
          <TextInput
            style={styles.quickSearchInput}
            value={quickSearchPhoneOrEmail}
            onChangeText={handleQuickSearchChange}
            placeholder="Enter phone number or email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={() => setBarcodeModalVisible(true)}
          >
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
          {isSearchingExternal && (
            <ActivityIndicator size="small" color="#2196F3" style={styles.searchingIndicator} />
          )}
        </View>
        
        {/* Quick Add Customer UI */}
        {showQuickAdd && (
          <View style={styles.quickAddContainer}>
            {foundExternalCustomer ? (
              <>
                <Text style={styles.foundProfileText}>
                  Found customer in another business:
                </Text>
                <Text style={styles.foundProfileName}>
                  {foundExternalCustomer.firstName} {foundExternalCustomer.lastName}
                </Text>
                <Text style={styles.foundProfileDetails}>
                  {foundExternalCustomer.phone} • {foundExternalCustomer.email || 'No email'}
                </Text>
                <View style={styles.quickActionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.importButton]}
                    onPress={handleImportExternalCustomer}
                    disabled={isLoading}
                  >
                    <Text style={styles.actionButtonText}>
                      {isLoading ? 'Importing...' : 'Import Customer'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleNewCustomer(true)}
                  >
                    <Text style={styles.actionButtonText}>
                      Edit & Create
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.noMatchText}>
                  No existing customer found with this {quickSearchPhoneOrEmail.includes('@') ? 'email' : 'phone number'}.
                </Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.newCustomerQuickButton]}
                  onPress={() => handleNewCustomer(true)}
                >
                  <Text style={styles.actionButtonText}>
                    Create New Customer
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Header section with search and buttons */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearchTextChange}
            placeholder="Name, Phone Number, or Email"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Searching...' : 'Search'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.newCustomerButton}
          onPress={() => handleNewCustomer(false)}
        >
          <Text style={styles.buttonText}>New Customer</Text>
        </TouchableOpacity>
      </View>
      
      {/* Customer list section */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.customersContainer}
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : filteredCustomers.length > 0 ? (
          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No customers to display. Search for a customer or create a new one.
            </Text>
          </View>
        )}
        
        {/* Edit Customer Modal */}
        <EditCustomerModal
          visible={modalVisible}
          customerId={selectedCustomer?.id}
          isNewCustomer={isNewCustomer}
          businessId={businessId || ''}
          onSave={(customerName) => {
            setModalVisible(false);
            Alert.alert('Success', `Customer ${customerName} ${isNewCustomer ? 'created' : 'updated'} successfully`);
            fetchCustomers();
          }}
          onDelete={handleDeleteCustomer}
          onClose={() => {
            setModalVisible(false);
            setSelectedCustomer(null);
            fetchCustomers(); // Re-fetch customers after modal closes
          }}
          initialCustomerData={selectedCustomer}
        />

        {/* Barcode Scanner Modal */}
        <BarcodeScannerModal
          visible={barcodeModalVisible}
          onClose={() => setBarcodeModalVisible(false)}
          onCodeScanned={handleBarcodeScan}
        />
      </KeyboardAvoidingView>
      
      {/* No need for hidden ViewShot component anymore */}
    </SafeAreaView>
  );
};

export default CustomerEditScreen;