// src/screens/TransactionScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import CreateCustomerModal from '../components/CreateCustomerModal';
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { useRoute, useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { styles } from '../styles/screens/transactionStyles';

// Initialize Amplify client
const client = generateClient<Schema>();

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

// Define a type for the route parameters
type TransactionScreenRouteParams = {
  businessId: string;
  businessName: string;
};

const TransactionsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { businessId } = route.params as TransactionScreenRouteParams;
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [modalVisible, setModalVisible] = useState(false);
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
      
      if (result.data) {
        const customerData = result.data.map(customer => ({
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phoneNumber: customer.phoneNumber
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
  
  // Handle real-time filtering as user types
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
      customer.phoneNumber?.includes(searchTerm)
    );
    
    setFilteredCustomers(filtered);
  };
  
  // Handle Enter key when there's just one customer
  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }): void => {
    if (nativeEvent.key === 'Enter' && filteredCustomers.length === 1) {
      handleSelectCustomer(filteredCustomers[0]);
    }
  };
  
  // Handle new customer button - open the modal
  const handleNewCustomer = (): void => {
    setModalVisible(true);
  };

  // Handle search button press
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
  
  // Handle customer creation from modal
  const handleCustomerCreated = (customerId: string, customerName: string): void => {
    // Close the modal first
    setModalVisible(false);
    
    // Then show success message and refresh the list
    Alert.alert('Success', `Customer ${customerName} created successfully!`);
    fetchCustomers();
  };
  
  // Handle customer selection for transaction
  const handleSelectCustomer = (customer: Customer): void => {
    // Navigate to the transaction selection screen
    navigation.navigate('TransactionSelection', {
      customer,
      businessId
    });
  };
  
  return (
    <SafeAreaView style={styles.container}>
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
            onKeyPress={handleKeyPress}
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
          onPress={handleNewCustomer}
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
            <Text>Loading customers...</Text>
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
                <Text style={styles.customerName}>
                  {item.firstName} {item.lastName}
                </Text>
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
      
      <CreateCustomerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCustomerCreated={handleCustomerCreated}
        businessId={businessId}
        initialData={{}}
      />
    </SafeAreaView>
  );
};

export default TransactionsScreen;