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
import { styles } from '../styles/screens/customerEditStyles';

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
  const [tempQrData, setTempQrData] = useState<string | null>(null);
  const [qrGeneratingCustomers, setQrGeneratingCustomers] = useState<string[]>([]);
  // ADD: State to trigger capture
  const [customerToCapture, setCustomerToCapture] = useState<Customer | null>(null);

  const inputRef = useRef<TextInput>(null);
  // CORRECT Ref Type
  const qrRef = useRef<ViewShot>(null); // Use ViewShot type
  const qrSize = 300; // Keep consistent size
  
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
        
        // Automatically trigger QR generation for customers without QR codes
        const customersWithoutQR = customerData.filter(c => !c.qrCodeImageUrl);
        if (customersWithoutQR.length > 0) {
          // Generate for the first customer without a QR code
          // This could be enhanced to handle multiple in a queue
          generateQRCodeForCustomer(customersWithoutQR[0] as Customer);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      Alert.alert('Error', 'Failed to load customers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, client]); // Added client to dependency array for correctness

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
  
  // Effect to automatically generate QR codes for customers without them
  useEffect(() => {
    const customersWithoutQR = filteredCustomers.filter(customer => !customer.qrCodeImageUrl);
    if (customersWithoutQR.length > 0 && !isLoading && !customerToCapture) {
      // Generate QR code for the first customer without one
      // Only if we're not already generating a code and not loading customers
      const customerToGenerate = customersWithoutQR[0];
      if (!qrGeneratingCustomers.includes(customerToGenerate.id)) {
        console.log(`Automatically generating QR code for customer: ${customerToGenerate.id}`);
        generateQRCodeForCustomer(customerToGenerate);
      }
    }
  }, [filteredCustomers, isLoading, qrGeneratingCustomers, customerToCapture]); // Removed generatingQR dependency

  // ADD: useEffect to handle the QR code capture after state updates
  useEffect(() => {
    const currentQrRef = qrRef.current; // Capture the current value
    // Only proceed if we have a customer to capture and the ref is ready
    if (customerToCapture && currentQrRef) { // Use the captured value in the check
      const customer = customerToCapture; // Capture the value for closure

      // Define the capture logic as an async function
      const captureAndSave = async () => {
        // --- START: Corrected Order of Checks ---
        // 1. Ensure qrRef is valid *before* trying to use it
        if (!currentQrRef) {
          console.error("Cannot capture QR code: qrRef became null.");
          setCustomerToCapture(null); // Clear potentially stale state
          return; // Stop execution
        }
        
        // 2. Ensure 'customer' is still valid when the function runs
        if (!customer) {
          console.error("Cannot capture QR code: customer became null or undefined.");
          setCustomerToCapture(null); // Clear potentially stale state
          return; // Stop execution
        }

        // 3. Ensure 'businessID' exists (especially if it might be optional on the type)
        if (!customer.businessID) {
           console.error(`Cannot save QR code for customer ${customer.id}: businessID is missing.`);
           // Clear state and generating status as we can't proceed
           setCustomerToCapture(null);
           setQrGeneratingCustomers(prev => prev.filter(id => id !== customer?.id)); // Use optional chaining here just in case
           return; // Stop execution
        }
        // --- END: Corrected Order of Checks ---
        
        try {
          console.log(`Attempting to capture QR for ${customer.id} with data: ${tempQrData}`);
          
          // Add an explicit check for currentQrRef
          if (!currentQrRef) {
            console.error(`QR Code reference (currentQrRef) is not available for customer ${customer.id}.`);
            setCustomerToCapture(null);
            setQrGeneratingCustomers(prev => prev.filter(id => id !== customer?.id));
            return; // Stop execution if ref is not set
          }

          // Check if the capture method exists and is a function
          if (typeof currentQrRef.capture === 'function') {
            const uri = await currentQrRef.capture(); // Now we know capture exists and is callable
            
            // Add a check for the result of capture
            if (!uri) {
              console.error(`Failed to capture QR code image for ${customer.id}. URI is null or undefined.`);
              setCustomerToCapture(null);
              setQrGeneratingCustomers(prev => prev.filter(id => id !== customer?.id));
              return; // Stop execution
            }
  
            console.log('Capture successful, URI:', uri);

            // Convert URI to blob
            const imageResponse = await fetch(uri);
            const blob = await imageResponse.blob();
            console.log('Blob created successfully');

            // Save QR code image to S3
            await QRCodeGenerator.saveQRCodeToS3(
              'Customer',
              customer.id,
              customer.businessID, // Safe to use now
              blob
            );
            console.log('QR code saved to S3');

            // Refresh the list to show the new QR code
            fetchCustomers();

          } else {
            // Handle the case where capture method doesn't exist
            console.error(`The 'capture' method is not available on the QR code ref for customer ${customer.id}.`);
            setCustomerToCapture(null);
            setQrGeneratingCustomers(prev => prev.filter(id => id !== customer?.id));
            return; // Stop execution
          }
        } catch (error) {
          console.error(`Error capturing or saving QR code for ${customer.id}:`, error);
          // Optionally show an alert to the user
          // Alert.alert('QR Code Error', 'Failed to generate or save the QR code.');
        } finally {
          // Clear the trigger and the generating status regardless of success/failure
          setCustomerToCapture(null);
          // Accessing customer.id here is also safer due to the check above
          setQrGeneratingCustomers(prev => prev.filter(id => id !== customer.id));
        }
      };

      // Call the capture logic. A small delay might still be needed for rendering complex SVGs,
      // but this is more robust than relying solely on setTimeout from the start.
      // Let's try without a delay first. If issues persist, add a small (e.g., 100ms) delay here.
      const captureTimeout = setTimeout(() => {
         captureAndSave();
      }, 100); // Small delay to ensure render completes

      // Cleanup function for the timeout
      return () => clearTimeout(captureTimeout);

    } else if (customerToCapture && !qrRef.current) {
        console.warn(`Capture triggered for ${customerToCapture.id}, but qrRef is not ready.`);
        // Reset trigger if ref isn't ready to avoid getting stuck
         setCustomerToCapture(null);
         setQrGeneratingCustomers(prev => prev.filter(id => id !== customerToCapture.id));
    }
  }, [customerToCapture, qrRef, tempQrData, fetchCustomers]); // Consider reviewing dependencies if issues arise

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
  
  // MODIFY: generateQRCodeForCustomer function
  const generateQRCodeForCustomer = async (customer: Customer) => {
    if (!customer || !customer.id || !businessId) {
        console.warn('generateQRCodeForCustomer called with invalid customer or businessId');
        return;
    }

    // Check if we're already generating a QR code for this customer
    // Check if we're already generating/capturing for this customer
    if (qrGeneratingCustomers.includes(customer.id) || customerToCapture?.id === customer.id) {
        console.log(`QR generation/capture already in progress for ${customer.id}`);
        return;
    }

    console.log(`Starting QR generation process for customer: ${customer.id}`);
    setQrGeneratingCustomers(prev => [...prev, customer.id]); // Mark as generating immediately

    try {
      // Note: createQRCodeIfNeeded might trigger its own generation if called elsewhere.
      //       Consider simplifying if this causes redundant checks/generations.
      const entityData = await QRCodeGenerator.getEntityData('Customer', customer.id);
      if (entityData?.qrCodeImageUrl) {
        console.log(`QR code already exists for ${customer.id}, refreshing list.`);
        fetchCustomers(); // Refresh to ensure UI is up-to-date
        setQrGeneratingCustomers(prev => prev.filter(id => id !== customer.id)); // Remove generating status
        return;
      }

      // Generate QR code data
      const qrCodeData = QRCodeGenerator.generateQRCodeData('Customer', customer);
      // Set the data and trigger the capture effect
      console.log(`Setting tempQrData for ${customer.id} and triggering capture effect.`);
      setTempQrData(qrCodeData);       // Update the data for the hidden QRCode component
      setCustomerToCapture(customer);  // Set the trigger for the useEffect

    } catch (error) {
      console.error(`Error during QR code generation setup for ${customer.id}:`, error);
      // Reset generating status on error during setup
      setQrGeneratingCustomers(prev => prev.filter(id => id !== customer.id));
      setCustomerToCapture(null); // Ensure trigger is cleared on error too
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
      // Auto-generate QR code if it doesn't exist
      generateQRCodeForCustomer(customer);
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
  
  // Render QR code or loading indicator
  // MODIFY: renderQRCode to potentially call generateQRCodeForCustomer differently if needed
  const renderQRCode = (customer: Customer) => {
    if (customer.qrCodeImageUrl) {
      // Show the existing QR code image
      return (
        <TouchableOpacity onPress={() => viewFullQRCode(customer)}>
          <Image 
            source={{ uri: customer.qrCodeImageUrl }} 
            style={styles.qrCodeImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    } else {
      // Show placeholder and auto-generate QR
      // Let's rely on the useEffect that checks for customers without QR codes
      // instead of calling generateQRCodeForCustomer directly here on every render.
      // This prevents potential infinite loops or excessive calls.
      // The useEffect hook added earlier should handle triggering the generation.
      return (
        <View style={styles.qrPlaceholder}>
          <Text style={styles.qrPlaceholderText}>QR</Text>
        </View>
      );
    }
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
              <View style={styles.customerItem}>
                <TouchableOpacity
                  style={styles.customerItemContent}
                  onPress={() => handleSelectCustomer(item)}
                >
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
                    {qrGeneratingCustomers.includes(item.id) ? (
                      <View style={styles.qrGeneratingContainer}>
                        <ActivityIndicator size="small" color="#2196F3" />
                      </View>
                    ) : (
                      renderQRCode(item)
                    )}
                  </View>
                </TouchableOpacity>
                
                <View style={styles.customerActionsContainer}>
                  <TouchableOpacity 
                    style={styles.customerAction}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.customerAction, styles.deleteAction]}
                    onPress={() => {
                      // Set selected customer and prompt for deletion
                      setSelectedCustomer(item);
                      Alert.alert(
                        'Delete Customer',
                        `Are you sure you want to delete ${item.firstName} ${item.lastName}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: handleDeleteCustomer }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
        style={{ position: 'absolute', bottom: -qrSize * 2, left: 0, width: qrSize, height: qrSize, backgroundColor: 'white', opacity: 0, zIndex: -1 }} // Position off-screen, ensure background is white for capture
      >
        {/* Ensure tempQrData is not empty or invalid JSON before rendering */}
        {tempQrData ? (
          <QRCode
            value={tempQrData} // Use the temporary data to render the QR code for capture
            size={qrSize}       // Use the defined size
            backgroundColor="white" // Match ViewShot background
            color="black"
          />
        ) : (
          // Render nothing or a placeholder if no data is ready for capture
          <View style={{ width: qrSize, height: qrSize, backgroundColor: 'white' }} />
        )}
      </ViewShot>
    </SafeAreaView>
  );
};


export default CustomerEditScreen;