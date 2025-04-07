// src/screens/EmployeeManagement/EmployeeManagementScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import { styles } from './styles/employeeManagementStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CreateEmployeeModal from './components/CreateEmployeeModal';
import EmployeeDetailModal from './components/EmployeeDetailModal';
import QRCodeModal from './components/QRCodeModal';
import Toast from 'react-native-toast-message';

// Use the generated Employee type directly for better type safety
type EmployeeData = Schema['Employee']['type'];
type EmployeeShiftData = Schema['EmployeeShift']['type'];

const client = generateClient<Schema>();

export default function EmployeeManagementScreen({ route }: { route: any }) {
  const { businessId, businessName } = route.params || {};
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  // State variables
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [qrCodeModalVisible, setQrCodeModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch employees when component mounts or businessId changes
  useEffect(() => {
    fetchEmployees();
  }, [businessId]);

  // Filter employees when search query or employees list changes
  useEffect(() => {
    filterEmployees();
  }, [searchQuery, employees, activeTab]);

  // Fetch employees from the database
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      if (!businessId) {
        console.log("Business ID not available for fetching employees.");
        setIsLoading(false);
        return;
      }

      const { data: fetchedEmployees } = await client.models.Employee.list({
        filter: { businessID: { eq: businessId } }
      });

      if (fetchedEmployees) {
        console.log(`Fetched ${fetchedEmployees.length} employees`);
        setEmployees(fetchedEmployees);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      Toast.show({ type: 'error', text1: 'Failed to load employees' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees based on search query and active tab
  const filterEmployees = () => {
    let filtered = [...employees];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(employee => 
        employee.firstName?.toLowerCase().includes(query) || 
        employee.lastName?.toLowerCase().includes(query) ||
        employee.email?.toLowerCase().includes(query) ||
        employee.phoneNumber?.includes(query)
      );
    }
    
    // Filter by status/role
    if (activeTab !== 'all') {
      if (activeTab === 'active') {
        filtered = filtered.filter(employee => employee.status === 'ACTIVE');
      } else if (activeTab === 'inactive') {
        filtered = filtered.filter(employee => employee.status === 'INACTIVE' || employee.status === 'SUSPENDED');
      } else {
        // Filter by role (admin, manager, staff)
        filtered = filtered.filter(employee => employee.role === activeTab.toUpperCase());
      }
    }
    
    setFilteredEmployees(filtered);
  };

  // Handle employee creation
  const handleEmployeeCreated = (newEmployee: EmployeeData) => {
    setEmployees(prev => [...prev, newEmployee]);
    Toast.show({ type: 'success', text1: 'Employee created successfully' });
  };

  // Handle employee update
  const handleEmployeeUpdated = (updatedEmployee: EmployeeData) => {
    setEmployees(prev => 
      prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
    );
    setSelectedEmployee(updatedEmployee);
    Toast.show({ type: 'success', text1: 'Employee updated successfully' });
  };

  // Handle employee deletion
  const handleDeleteEmployee = async (employeeId: string) => {
    Alert.alert(
      "Delete Employee",
      "Are you sure you want to delete this employee? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await client.models.Employee.delete({ id: employeeId });
              setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
              Toast.show({ type: 'success', text1: 'Employee deleted successfully' });
            } catch (error) {
              console.error('Error deleting employee:', error);
              Toast.show({ type: 'error', text1: 'Failed to delete employee' });
            }
          }
        }
      ]
    );
  };

  // Open employee detail modal
  const openEmployeeDetail = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setDetailModalVisible(true);
  };

  // Open QR code modal
  const openQRCodeModal = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setQrCodeModalVisible(true);
  };

  // Render role badge with appropriate color
  const renderRoleBadge = (role: string, status: string = 'ACTIVE') => {
    if (status !== 'ACTIVE') {
      return (
        <View style={[styles.roleBadge, styles.inactiveRole]}>
          <Text style={styles.roleBadgeText}>INACTIVE</Text>
        </View>
      );
    }

    let badgeStyle;
    switch (role) {
      case 'ADMIN':
        badgeStyle = styles.adminRole;
        break;
      case 'MANAGER':
        badgeStyle = styles.managerRole;
        break;
      case 'STAFF':
        badgeStyle = styles.staffRole;
        break;
      default:
        badgeStyle = styles.staffRole;
    }

    return (
      <View style={[styles.roleBadge, badgeStyle]}>
        <Text style={styles.roleBadgeText}>{role}</Text>
      </View>
    );
  };

  // Render employee item
  const renderEmployeeItem = ({ item }: { item: EmployeeData }) => (
    <TouchableOpacity 
      style={styles.employeeCard}
      onPress={() => openEmployeeDetail(item)}
    >
      <View style={styles.employeeHeader}>
        <Text style={styles.employeeName}>{item.firstName} {item.lastName}</Text>
        {renderRoleBadge(item.role || 'STAFF', item.status || 'ACTIVE')}
      </View>
      
      <View style={styles.employeeInfo}>
        <Icon name="email-outline" size={16} color="#666" />
        <Text style={styles.employeeInfoText}>{item.email || 'No email'}</Text>
      </View>
      
      <View style={styles.employeeInfo}>
        <Icon name="phone-outline" size={16} color="#666" />
        <Text style={styles.employeeInfoText}>{item.phoneNumber || 'No phone'}</Text>
      </View>
      
      <View style={styles.employeeInfo}>
        <Icon name="calendar-outline" size={16} color="#666" />
        <Text style={styles.employeeInfoText}>
          Hired: {item.hireDate ? new Date(item.hireDate).toLocaleDateString() : 'Unknown'}
        </Text>
      </View>
      
      <View style={styles.employeeActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openQRCodeModal(item)}
        >
          <Icon name="qrcode" size={24} style={styles.qrIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => openEmployeeDetail(item)}
        >
          <Icon name="pencil" size={24} style={styles.editIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDeleteEmployee(item.id)}
        >
          <Icon name="delete" size={24} style={styles.deleteIcon} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="account-off-outline" size={64} color="#999" />
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'No employees match your search' 
          : 'No employees found. Add your first employee to get started.'}
      </Text>
    </View>
  );

  // Show loading indicator while fetching
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Employee Management</Text>
        <Text style={styles.subtitle}>{businessName || 'Your Business'}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search employees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
          onPress={() => setActiveTab('admin')}
        >
          <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>Admin</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'manager' && styles.activeTab]}
          onPress={() => setActiveTab('manager')}
        >
          <Text style={[styles.tabText, activeTab === 'manager' && styles.activeTabText]}>Manager</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'staff' && styles.activeTab]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabText, activeTab === 'staff' && styles.activeTabText]}>Staff</Text>
        </TouchableOpacity>
      </View>

      {/* Add employee button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setCreateModalVisible(true)}
      >
        <Icon name="account-plus" size={24} color="white" />
        <Text style={styles.addButtonText}>Add New Employee</Text>
      </TouchableOpacity>

      {/* Employee list */}
      <FlatList
        data={filteredEmployees}
        renderItem={renderEmployeeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.employeeList}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Create Employee Modal */}
      <CreateEmployeeModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onEmployeeCreated={handleEmployeeCreated}
        businessId={businessId}
      />

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          visible={detailModalVisible}
          onClose={() => setDetailModalVisible(false)}
          employee={selectedEmployee}
          onEmployeeUpdated={handleEmployeeUpdated}
          businessId={businessId}
        />
      )}

      {/* QR Code Modal */}
      {selectedEmployee && (
        <QRCodeModal
          visible={qrCodeModalVisible}
          onClose={() => setQrCodeModalVisible(false)}
          employee={selectedEmployee}
          onEmployeeUpdated={handleEmployeeUpdated}
        />
      )}
    </View>
  );
}
