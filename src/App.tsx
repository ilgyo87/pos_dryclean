import React, { useState, useEffect, createContext, useContext } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CreateBusinessModal from './shared/components/CreateBusinessModal';
import outputs from "../amplify_outputs.json";
import Toast from 'react-native-toast-message';

// Screens
import DashboardScreen from './screens/Dashboard/DashboardScreen';
import CustomerEditScreen from './screens/CustomerManagement/CustomerEditScreen';
import TransactionSelectionScreen from './screens/Transaction/TransactionSelectionScreen';
import ProductManagementScreen from './screens/ProductManagement/ProductManagementScreen';
import CheckoutScreen from './screens/Transaction/components/CheckoutScreen';
import ReceiptScreen from './screens/Transaction/components/ReceiptScreen';
import CustomerSearchScreen from './screens/Transaction/CustomerSearchScreen';
import OrderManagementScreen from './screens/OrderManagement/index';
import EmployeeManagementScreen from './screens/EmployeeManagement/index';

// Define Types for Context
type BusinessContextType = {
  businessId: string;
  businessName: string;
  setBusinessId: (id: string) => void;
  setBusinessName: (name: string) => void;
  refreshBusiness: () => Promise<void>;
};

type EmployeeContextType = {
  employeeId: string | null;
  role: string | null;
  isOwner: boolean;
  canManageProducts: boolean;
  canManageEmployees: boolean;
  canViewReports: boolean;
};

// Create Contexts
export const BusinessContext = createContext<BusinessContextType>({
  businessId: '',
  businessName: '',
  setBusinessId: () => {},
  setBusinessName: () => {},
  refreshBusiness: async () => {},
});

export const EmployeeContext = createContext<EmployeeContextType>({
  employeeId: null,
  role: null,
  isOwner: false,
  canManageProducts: false,
  canManageEmployees: false,
  canViewReports: false,
});

// Add Route Type Definitions for type safety
export type RootStackParamList = {
  // Auth Screens
  Welcome: undefined;
  
  // Main Screens
  Dashboard: { 
    businessId?: string;
    businessName?: string;
    showSeededMessage?: boolean;
  };
  
  // Customer Management
  CustomerSearch: { 
    businessId: string;
    businessName: string;
  };
  CustomerEdit: { 
    businessId: string;
    customerId?: string;
  };
  
  // Product Management
  ProductManagement: { 
    businessId: string;
    businessName: string;
  };
  
  // Transaction Flow
  TransactionSelection: {
    businessId: string;
    customerId: string;
    customerName: string;
    customer: any; // Consider replacing with specific Customer type
  };
  Checkout: {
    businessId: string;
    customerId: string;
    customerName: string;
    items: any[]; // Consider replacing with specific CartItem type
    total: number;
    pickupDate: string;
    customerPreferences: string;
  };
  Receipt: {
    receiptHtml: string;
    transactionId: string;
  };
  
  // Employee Management
  EmployeeManagement: {
    businessId: string;
  };
  
  // Reports
  Reports: {
    businessId: string;
  };
  
  // Settings
  Settings: {
    businessId: string;
  };
};

// Configure Amplify with your project settings
Amplify.configure(outputs);

const client = generateClient<Schema>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Sign out button component with explicit handling
function SignOutButton() {
  const { signOut } = useAuthenticator();
  return <Text onPress={signOut} style={{ color: '#007AFF', padding: 10 }}>Sign Out</Text>;
}

// Welcome Screen
function WelcomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>Welcome to Dry Cleaning POS</Text>
      <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginHorizontal: 40 }}>
        Please create a business to continue using the application.
      </Text>
    </View>
  );
}

// Business Context Provider Component
function BusinessContextProvider({ children }: { children: React.ReactNode }) {
  const [businessId, setBusinessId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const { user } = useAuthenticator();

  // Function to refresh business data
  const refreshBusiness = async () => {
    if (!user?.username) return;
    
    try {
      const result = await client.models.Business.list({
        filter: { owner: { eq: user.username } }
      });
      
      if (result.data && result.data.length > 0) {
        setBusinessId(result.data[0].id);
        setBusinessName(result.data[0].name);
      }
    } catch (error) {
      console.error("Error refreshing business data:", error);
    }
  };

  useEffect(() => {
    refreshBusiness();
  }, [user?.username]);

  return (
    <BusinessContext.Provider 
      value={{ 
        businessId, 
        businessName, 
        setBusinessId, 
        setBusinessName,
        refreshBusiness
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

// Employee Context Provider Component
function EmployeeContextProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthenticator();
  const { businessId } = useContext(BusinessContext);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [permissions, setPermissions] = useState({
    canManageProducts: false,
    canManageEmployees: false,
    canViewReports: false
  });

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!user?.username || !businessId) return;
      
      try {
        // First check if user is the business owner
        const businessResult = await client.models.Business.get({ id: businessId });
        
        if (businessResult.data && businessResult.data.owner === user.username) {
          // User is the business owner - has all permissions
          setIsOwner(true);
          setRole('OWNER');
          setPermissions({
            canManageProducts: true,
            canManageEmployees: true,
            canViewReports: true
          });
          return;
        }
        
        // Otherwise, check if user is an employee
        const employeesResult = await client.models.Employee.list({
          filter: {
            and: [
              { businessID: { eq: businessId } },
              { phoneNumber: { eq: user.username } } // Assuming phone number is used as username
            ]
          }
        });
        
        if (employeesResult.data && employeesResult.data.length > 0) {
          const employee = employeesResult.data[0];
          setEmployeeId(employee.id);
          setRole(employee.role);
          
          // Set permissions based on role
          // This is simplified - you might want to have a more complex permission system
          const isManager = employee.role === 'MANAGER';
          setPermissions({
            canManageProducts: isManager,
            canManageEmployees: isManager,
            canViewReports: isManager || employee.role === 'SUPERVISOR'
          });
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      }
    };
    
    fetchEmployeeData();
  }, [user?.username, businessId]);

  return (
    <EmployeeContext.Provider
      value={{
        employeeId,
        role,
        isOwner,
        canManageProducts: permissions.canManageProducts,
        canManageEmployees: permissions.canManageEmployees,
        canViewReports: permissions.canViewReports
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

// Main application content
function AppContent() {
  const [hasBusinesses, setHasBusinesses] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { authStatus, user } = useAuthenticator();
  const [dashboardKey, setDashboardKey] = useState(0);
  const { businessId, businessName, setBusinessId, setBusinessName } = useContext(BusinessContext);
  const { role, isOwner } = useContext(EmployeeContext);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      checkForBusinesses();
    }
  }, [authStatus]);

  // Check if user has businesses
  const checkForBusinesses = async () => {
    if (!user?.username) {
      console.log("User not loaded yet");
      return;
    }

    setLoading(true);
    try {
      const result = await client.models.Business.list({
        filter: {
          owner: { eq: user.username }
        }
      });

      const hasBusiness = result.data && result.data.length > 0;

      if (hasBusiness && result.data && result.data.length > 0) {
        // Store the business ID and name
        setBusinessId(result.data[0].id);
        setBusinessName(result.data[0].name);
      }

      setHasBusinesses(hasBusiness);
      setLoading(false);
    } catch (error) {
      console.error("Error checking for businesses:", error);
      setHasBusinesses(false);
      setLoading(false);
    }
  };

  const handleBusinessCreated = (newBusinessId: string, newBusinessName: string) => {
    setBusinessId(newBusinessId);
    setBusinessName(newBusinessName);
    setHasBusinesses(true);
    // Force dashboard to re-mount completely using the key
    setDashboardKey(prev => prev + 1);
    console.log(`Business created: ${newBusinessName} (${newBusinessId})`);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  // Modal visibility state for debugging
  const modalVisibility = !loading && hasBusinesses === false;

  return (
    <NavigationContainer>
      {/* Main application navigation */}
      <Stack.Navigator screenOptions={{ headerRight: () => <SignOutButton /> }}>
        {hasBusinesses ? (
          <>
            {/* Main Screens */}
            <Stack.Group>
              <Stack.Screen
                key={dashboardKey}
                name="Dashboard"
                component={DashboardScreen}
                initialParams={{ businessId, businessName }}
                options={{
                  headerShown: true,
                  title: "DASHBOARD"
                }}
              />
            </Stack.Group>

            {/* Customer Management */}
            <Stack.Group>
              <Stack.Screen
                name="CustomerSearch"
                component={CustomerSearchScreen}
                initialParams={{ businessId, businessName }}
                options={{
                  headerShown: true,
                  title: "CUSTOMERS"
                }}
              />
              <Stack.Screen
                name="CustomerEdit"
                component={CustomerEditScreen}
                initialParams={{ businessId }}
                options={{
                  headerShown: true,
                  title: "CUSTOMER MANAGEMENT"
                }}
              />
            </Stack.Group>

            {/* Product Management */}
            <Stack.Group>
              <Stack.Screen
                name="ProductManagement"
                component={ProductManagementScreen}
                initialParams={{ businessId, businessName }}
                options={{
                  headerShown: true,
                  title: "PRODUCT MANAGEMENT"
                }}
              />
            </Stack.Group>

            {/* Transaction Flow */}
            <Stack.Group>
              <Stack.Screen
                name="TransactionSelection"
                component={TransactionSelectionScreen}
                initialParams={{ businessId }}
                options={{
                  headerShown: true,
                  title: "TRANSACTION"
                }}
              />
              <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
              <Stack.Screen
                name="Receipt"
                component={ReceiptScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal'
                }}
              />
            </Stack.Group>

            {/* Employee Management */}
            <Stack.Group>
              <Stack.Screen
                name="EmployeeManagement"
                component={EmployeeManagementScreen}
                initialParams={{ businessId }}
                options={{
                  headerShown: true,
                  title: "EMPLOYEE MANAGEMENT"
                }}
              />
            </Stack.Group>

            {/* Order Management */}
            {/* <Stack.Group>
              <Stack.Screen
                name="OrderManagement"
                component={OrderManagementScreen}
                initialParams={{ businessId }}
                options={{
                  headerShown: true,
                  title: "ORDER MANAGEMENT"
                }}
              />
            </Stack.Group> */}

            {/* Future screens can be added here in their respective groups */}
          </>
        ) : (
          // Welcome screen when no businesses
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              headerShown: true,
              title: "WELCOME"
            }}
          />
        )}
      </Stack.Navigator>

      {/* Business modal - only visible when no businesses exist */}
      <CreateBusinessModal
        isVisible={modalVisibility} 
        onCancel={() => setModalVisible(false)} 
        onBusinessCreated={handleBusinessCreated}
      />
      
      {/* Toast messages */}
      <Toast />
    </NavigationContainer>
  );
}

// Root component with Provider and Auth UI
export default function App() {
  return (
    <SafeAreaProvider>
      <Authenticator.Provider>
        <Authenticator>
          <BusinessContextProvider>
            <EmployeeContextProvider>
              <AppContent />
            </EmployeeContextProvider>
          </BusinessContextProvider>
        </Authenticator>
      </Authenticator.Provider>
    </SafeAreaProvider>
  );
}