import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
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
import { RouteProp, useRoute } from '@react-navigation/native';

// Initialize Amplify client
const client = generateClient<Schema>();

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
}

// Define a type for the route parameters
type TransactionScreenRouteParams = {
  businessId: string;
  businessName: string;
};

const TransactionsScreen = () => {
  // Get route and params using useRoute hook
  const route = useRoute();
  const { businessId, businessName } = route.params as TransactionScreenRouteParams;
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { user } = useAuthenticator();
  
  // Handle search/enter button

  
  // Handle new customer button - simply open the modal
  const handleNewCustomer = () => {
    setModalVisible(true);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
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
      
      // Build the complete filter
      let filter: any = { or: searchConditions };
      
      // Add business filter since we always have a business ID
      filter = {
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
          email: customer.email || undefined, // Convert null to undefined
          address: customer.address || undefined, // Convert null to undefined
          businessID: customer.businessID,
        }));
        
        setCustomers(customerData as unknown as Customer[]);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      Alert.alert('Error', 'Failed to search customers. Please try again.');
    } finally {
      setIsLoading(false);
      setSearchText('');
    }
  };
  
  // Handle customer creation from modal
  const handleCustomerCreated = (customerId: string, customerName: string) => {
    Alert.alert('Success', `Customer ${customerName} created successfully!`);
    
    // Reload the customer list
    handleSearch();
  };
  
  // Handle customer selection for transaction
  const handleSelectCustomer = (customer: Customer) => {
    console.log('Selected customer:', customer);
    // You would typically navigate to the order screen here
    // navigation.navigate('CreateOrder', { customer });
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
            onChangeText={setSearchText}
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
        ) : customers.length > 0 ? (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => handleSelectCustomer(item)}
              >
                <Text style={styles.customerName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.customerDetails}>
                  {item.phoneNumber} {item.email ? `• ${item.email}` : ''}
                </Text>
                {item.address ? (
                  <Text style={styles.customerAddress}>
                    {item.address}
                  </Text>
                ) : null}
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No customers to display. Search for a customers or create a new one.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
      
      {/* Customer creation modal - always available regardless of business state */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginLeft: 8,
  },
  newCustomerButton: {
    backgroundColor: '#34a853',
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  customersContainer: {
    flex: 1,
  },
  customerItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  customerAddress: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default TransactionsScreen;