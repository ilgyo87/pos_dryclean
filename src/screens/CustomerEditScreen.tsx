import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import EditCustomerModal from '../components/EditCustomerModal';
import BarcodeScannerModal from '../components/BarCodeScannerModal';
import QRCode from 'react-native-qrcode-svg';
import * as QRCodeGenerator from '../utils/qrCodeGenerator';
import ViewShot from 'react-native-view-shot';

// Initialize Amplify client
const client = generateClient<Schema>();

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  globalId?: string;
  businessID: string;
  qrCodeImageUrl?: string;
}

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
  const [tempQrData, setTempQrData] = useState<string>('{}');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [selectedQRCustomer, setSelectedQRCustomer] = useState<string | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const qrRef = useRef<any>(null);
  const qrSize = 300;
  
  // Fetch all customers for the current business on component mount
  useEffect(() => {
    fetchCustomers();
    
    // If a customerId was passed in the route, open that customer
    if (customerId) {
      openCustomerById(customerId);
    }
  }, [businessId, customerId]);
  
  // Open a specific customer by ID
  const openCustomerById = async (id: string) => {
    try {
      const customerResult = await client.models.Customer.get({ id });
      if (customerResult.data) {
        const customer = {
          id: customerResult.data.id,
          firstName: customerResult.data.firstName,
          lastName: customerResult.data.lastName,
          phoneNumber: customerResult.data.phoneNumber,
          email: customerResult.data.email || undefined,
          address: customerResult.data.address || undefined,
          city: customerResult.data.city || undefined,
          state: customerResult.data.state || undefined,
          zipCode: customerResult.data.zipCode || undefined,
          notes: customerResult.data.notes || undefined,
          globalId: customerResult.data.globalId || undefined,
          businessID: customerResult.data.businessID,
          qrCodeImageUrl: customerResult.data.qrCodeImageUrl || undefined
        };
        handleSelectCustomer(customer as Customer);
      }
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
    }
  };
  
  // Check if customer exists whenever quickSearchPhoneOrEmail changes
  useEffect(() => {
    if (quickSearchPhoneOrEmail.length > 8) { // Only search when we have enough characters
      checkCustomerExists(quickSearchPhoneOrEmail);
    } else {
      // Reset states when input is cleared or too short
      setFoundExternalCustomer(null);
      setShowQuickAdd(false);
    }
  }, [quickSearchPhoneOrEmail]);
  
  // Function to fetch all customers for current business
  const fetchCustomers = async (): Promise<void> => {
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
          phoneNumber: customer.phoneNumber,
          email: customer.email || undefined,
          address: customer.address || undefined,
          city: customer.city || undefined,
          state: customer.state || undefined,
          zipCode: customer.zipCode || undefined,
          notes: customer.notes || undefined,
          globalId: customer.globalId || undefined,
          businessID: customer.businessID,
          qrCodeImageUrl: customer.qrCodeImageUrl || undefined
        }));
        
        setCustomers(customerData as Customer[]);
        setFilteredCustomers(customerData as Customer[]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to check if customer exists in our database and/or other businesses
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
                { phoneNumber: { eq: searchValue.trim() } },
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
          phoneNumber: existingCustomer.phoneNumber,
          email: existingCustomer.email || undefined,
          address: existingCustomer.address || undefined,
          city: existingCustomer.city || undefined,
          state: existingCustomer.state || undefined,
          zipCode: existingCustomer.zipCode || undefined,
          notes: existingCustomer.notes || undefined,
          globalId: existingCustomer.globalId || undefined,
          businessID: existingCustomer.businessID,
          qrCodeImageUrl: existingCustomer.qrCodeImageUrl || undefined
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
                { phoneNumber: { eq: searchValue.trim() } },
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
          phoneNumber: externalCustomer.phoneNumber,
          email: externalCustomer.email || undefined,
          address: externalCustomer.address || undefined,
          city: externalCustomer.city || undefined,
          state: externalCustomer.state || undefined,
          zipCode: externalCustomer.zipCode || undefined,
          notes: externalCustomer.notes || undefined,
          globalId: externalCustomer.globalId || externalCustomer.id, // Use existing globalId or the customer's id as the globalId
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
    // Process the scanned barcode value immediately
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
        phoneNumber: foundExternalCustomer.phoneNumber,
        email: foundExternalCustomer.email,
        address: foundExternalCustomer.address,
        city: foundExternalCustomer.city,
        state: foundExternalCustomer.state,
        zipCode: foundExternalCustomer.zipCode,
        notes: foundExternalCustomer.notes,
        globalId: foundExternalCustomer.globalId,
        businessID: businessId
      });
      
      if (result.errors) {
        throw new Error(result.errors.map(e => e.message).join(', '));
      }
      
      // After successfully importing, automatically generate QR code
      if (result.data && result.data.id) {
        try {
          await generateQRCodeForCustomer({
            ...foundExternalCustomer,
            id: result.data.id, 
            businessID: businessId
          } as Customer);
        } catch (qrError) {
          console.warn('Error generating QR code for imported customer:', qrError);
          // Continue even if QR generation fails
        }
      }
      
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
      customer.phoneNumber?.includes(searchTerm) ||
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
          phoneNumber: isEmail ? '' : quickSearchPhoneOrEmail,
          email: isEmail ? quickSearchPhoneOrEmail : '',
          businessID: businessId
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
          phoneNumber: customer.phoneNumber,
          email: customer.email || undefined,
          address: customer.address || undefined,
          city: customer.city || undefined,
          state: customer.state || undefined,
          zipCode: customer.zipCode || undefined,
          notes: customer.notes || undefined,
          globalId: customer.globalId || undefined,
          businessID: customer.businessID,
          qrCodeImageUrl: customer.qrCodeImageUrl || undefined
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
  
  // Generate QR code for a customer
  const generateQRCodeForCustomer = async (customer: Customer) => {
    if (!customer.id || !businessId) return;
    
    setGeneratingQR(true);
    setSelectedQRCustomer(customer.id);
    
    try {
      // Check if QR code already exists
      const existingQrCode = await QRCodeGenerator.createQRCodeIfNeeded(
        'Customer',
        customer.id,
        businessId
      );
      
      if (existingQrCode) {
        // QR code already exists, just refresh the list
        fetchCustomers();
        return;
      }
      
      // Generate QR code data
      const qrCodeData = QRCodeGenerator.generateQRCodeData('Customer', customer);
      setTempQrData(qrCodeData);
      
      // Wait for state update to ensure QR code renders with the right data
      setTimeout(async () => {
        try {
          // Capture the QR code as an image
          if (qrRef.current) {
            const uri = await qrRef.current.capture();
            
            // Convert URI to blob
            const response = await fetch(uri);
            const blob = await response.blob();
            
            // Save QR code image to S3
            await QRCodeGenerator.saveQRCodeToS3(
              'Customer',
              customer.id,
              businessId,
              blob
            );
            
            // Refresh the list to show the new QR code
            fetchCustomers();
            
          } else {
            throw new Error('QR code reference not available');
          }
        } catch (error) {
          console.error('Error capturing QR code:', error);
          Alert.alert('Error', 'Failed to generate QR code. Please try again.');
        } finally {
          setSelectedQRCustomer(null);
        }
      }, 500);
    } catch (error) {
      console.error('Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code. Please try again.');
      setSelectedQRCustomer(null);
    } finally {
      setGeneratingQR(false);
    }
  };
  
  // View full QR code
  const viewFullQRCode = (customer: Customer) => {
    if (customer.qrCodeImageUrl) {
      // Create a larger display or open a modal to show the QR code
      Alert.alert(
        'QR Code for ' + customer.firstName + ' ' + customer.lastName,
        'Use this QR code for quick customer identification.',
        [
          { text: 'OK', onPress: () => console.log('QR Code viewed') }
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert('No QR Code', 'This customer does not have a QR code yet. Generate one first.');
    }
  };
  
  // Handle customer selection for editing
  const handleSelectCustomer = (customer: Customer): void => {
    setSelectedCustomer(customer);
    setIsNewCustomer(false);
    setModalVisible(true);
  };
  
  // Handle modal close
  const handleCloseModal = () => {
    setModalVisible(false);
  };
  
  // Handle save customer from modal
  const handleSaveCustomer = (customerName: string) => {
    setModalVisible(false);
    Alert.alert('Success', `Customer ${customerName} ${isNewCustomer ? 'created' : 'updated'} successfully`);
    fetchCustomers();
    setQuickSearchPhoneOrEmail(''); // Clear quick search after saving
  };
  
  // Handle delete customer from modal
  const handleDeleteCustomer = () => {
    setModalVisible(false);
    Alert.alert('Success', 'Customer deleted successfully');
    fetchCustomers();
  };
  
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
                  {foundExternalCustomer.phoneNumber} • {foundExternalCustomer.email || 'No email'}
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => handleSelectCustomer(item)}
              >
                <View style={styles.customerItemContent}>
                  <View style={styles.customerInfoContainer}>
                    <Text style={styles.customerName}>
                      {item.firstName} {item.lastName}
                      {item.globalId && <Text style={styles.globalBadge}> • Shared</Text>}
                    </Text>
                    <Text style={styles.customerDetails}>
                      {item.phoneNumber} {item.email ? `• ${item.email}` : ''}
                    </Text>
                    {item.address ? (
                      <Text style={styles.customerAddress}>
                        {item.address}
                      </Text>
                    ) : null}
                  </View>
                  
                  <View style={styles.qrCodeContainer}>
                    {item.qrCodeImageUrl ? (
                      <TouchableOpacity onPress={() => viewFullQRCode(item)}>
                        <Image 
                          source={{ uri: item.qrCodeImageUrl }} 
                          style={styles.qrCodeImage}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.generateQrButton}
                        onPress={() => generateQRCodeForCustomer(item)}
                        disabled={generatingQR && selectedQRCustomer === item.id}
                      >
                        <Text style={styles.generateQrButtonText}>
                          {(generatingQR && selectedQRCustomer === item.id) ? '...' : 'Generate QR'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No customers to display. Search for a customer or create a new one.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
      
      {/* Customer Edit Modal */}
      <EditCustomerModal
        visible={modalVisible}
        customerId={selectedCustomer?.id}
        isNewCustomer={isNewCustomer}
        businessId={businessId || ''}
        onSave={handleSaveCustomer}
        onDelete={handleDeleteCustomer}
        onClose={handleCloseModal}
        initialCustomerData={selectedCustomer}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={barcodeModalVisible}
        onClose={() => setBarcodeModalVisible(false)}
        onCodeScanned={handleBarcodeScan}
      />

      {/* Hidden QR code for generation */}
      <ViewShot
        ref={qrRef}
        options={{ format: 'png', quality: 0.9 }}
        style={{ position: 'absolute', width: qrSize, height: qrSize, opacity: 0 }}
      >
        <QRCode
          value={tempQrData}
          size={qrSize}
          backgroundColor="white"
          color="black"
        />
      </ViewShot>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  quickSearchContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  quickSearchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickSearchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    fontSize: 16,
    marginRight: 8,
  },
  scanButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  scanButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchingIndicator: {
    position: 'absolute',
    right: 12,
  },
  quickAddContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  foundProfileText: {
    fontSize: 14,
    color: '#666',
  },
  foundProfileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  foundProfileDetails: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  quickActionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  importButton: {
    backgroundColor: '#4caf50',
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#ff9800',
  },
  newCustomerQuickButton: {
    backgroundColor: '#2196F3',
    marginTop: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noMatchText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    marginRight: 8,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  newCustomerButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  customersContainer: {
    flex: 1,
    padding: 16,
  },
  customerItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customerItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfoContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  globalBadge: {
    fontSize: 14,
    color: '#2196F3',
  },
  customerDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  qrCodeContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  qrCodeImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  generateQrButton: {
    backgroundColor: '#2196F3',
    padding: 6,
    borderRadius: 4,
  },
  generateQrButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
});

export default CustomerEditScreen;