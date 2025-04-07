// src/screens/EmployeeManagement/EmployeeDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '../../../amplify/data/resource';
import { styles } from './styles/employeeDetailsStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EmployeePerformanceTracker from './components/EmployeePerformanceTracker';
import RolePermissionManager from './components/RolePermissionManager';
import EmployeeQRCodeGenerator from './components/EmployeeQRCodeGenerator';
import { Employee, EmployeeRole, EmployeeStatus, EmployeePermissions } from './types/EmployeeTypes';
import Toast from 'react-native-toast-message';

const client = generateClient<Schema>();

export default function EmployeeDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  const { employeeId, businessId } = route.params as { employeeId: string; businessId: string };
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'permissions' | 'qrcode'>('info');
  
  // Fetch employee data
  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);
  
  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
      const { data, errors } = await client.models.Employee.get({ id: employeeId });
      
      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      
      if (data) {
        setEmployee(data);
      } else {
        Alert.alert('Error', 'Employee not found');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error fetching employee:', error);
      Alert.alert('Error', `Failed to load employee: ${error.message}`);
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle employee update
  const handleEmployeeUpdate = async (updatedData: Partial<Employee>) => {
    if (!employee) return;
    
    try {
      const { data, errors } = await client.models.Employee.update({
        id: employee.id,
        ...updatedData
      });
      
      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      
      if (data) {
        setEmployee(data);
        Toast.show({ type: 'success', text1: 'Employee updated successfully' });
      }
    } catch (error: any) {
      console.error('Error updating employee:', error);
      Toast.show({ type: 'error', text1: `Failed to update employee: ${error.message}` });
    }
  };
  
  // Handle role and permissions update
  const handleRolePermissionsUpdate = async (role: EmployeeRole, permissions: EmployeePermissions) => {
    if (!employee) return;
    
    try {
      const permissionsString = JSON.stringify(permissions);
      
      const { data, errors } = await client.models.Employee.update({
        id: employee.id,
        role,
        permissions: permissionsString
      });
      
      if (errors) {
        throw new Error(errors.map(e => e.message).join(', '));
      }
      
      if (data) {
        setEmployee(data);
        Toast.show({ type: 'success', text1: 'Role and permissions updated' });
      }
    } catch (error: any) {
      console.error('Error updating role and permissions:', error);
      Toast.show({ type: 'error', text1: `Failed to update: ${error.message}` });
    }
  };
  
  // Handle QR code generation
  const handleQRCodeGenerated = (qrCodeKey: string) => {
    if (!employee) return;
    
    setEmployee({
      ...employee,
      qrCode: qrCodeKey
    });
    
    Toast.show({ type: 'success', text1: 'QR code generated successfully' });
  };
  
  // Handle employee status change
  const handleStatusChange = async (newStatus: EmployeeStatus) => {
    if (!employee) return;
    
    Alert.alert(
      `${newStatus === EmployeeStatus.ACTIVE ? 'Activate' : 'Deactivate'} Employee`,
      `Are you sure you want to ${newStatus === EmployeeStatus.ACTIVE ? 'activate' : 'deactivate'} this employee?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              const { data, errors } = await client.models.Employee.update({
                id: employee.id,
                status: newStatus
              });
              
              if (errors) {
                throw new Error(errors.map(e => e.message).join(', '));
              }
              
              if (data) {
                setEmployee(data);
                Toast.show({ 
                  type: 'success', 
                  text1: `Employee ${newStatus === EmployeeStatus.ACTIVE ? 'activated' : 'deactivated'} successfully` 
                });
              }
            } catch (error: any) {
              console.error('Error updating employee status:', error);
              Toast.show({ type: 'error', text1: `Failed to update status: ${error.message}` });
            }
          }
        }
      ]
    );
  };
  
  // Render employee info tab
  const renderInfoTab = () => {
    if (!employee) return null;
    
    return (
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{employee.firstName} {employee.lastName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{employee.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{employee.phoneNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{employee.role}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[
              styles.infoValue, 
              { color: employee.status === EmployeeStatus.ACTIVE ? '#4CAF50' : '#F44336' }
            ]}>
              {employee.status}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hire Date:</Text>
            <Text style={styles.infoValue}>
              {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hourly Rate:</Text>
            <Text style={styles.infoValue}>
              {employee.hourlyRate ? `$${employee.hourlyRate.toFixed(2)}` : 'Not set'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login:</Text>
            <Text style={styles.infoValue}>
              {employee.lastLogin ? new Date(employee.lastLogin).toLocaleString() : 'Never'}
            </Text>
          </View>
        </View>
        
        {/* Status Change Buttons */}
        <View>
          {employee.status === EmployeeStatus.ACTIVE ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleStatusChange(EmployeeStatus.INACTIVE)}
            >
              <Icon name="account-off" size={24} color="white" />
              <Text style={styles.actionButtonText}>Deactivate Employee</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.successButton]}
              onPress={() => handleStatusChange(EmployeeStatus.ACTIVE)}
            >
              <Icon name="account-check" size={24} color="white" />
              <Text style={styles.actionButtonText}>Activate Employee</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditEmployee', { employee, businessId })}
          >
            <Icon name="account-edit" size={24} color="white" />
            <Text style={styles.actionButtonText}>Edit Employee</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading employee details...</Text>
      </View>
    );
  }
  
  // Render employee not found
  if (!employee) {
    return (
      <View style={styles.emptyState}>
        <Icon name="account-question" size={64} color="#999" />
        <Text style={styles.emptyStateText}>Employee not found</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{employee.firstName} {employee.lastName}</Text>
        <Text style={styles.subtitle}>{employee.role} • {employee.status}</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
          onPress={() => setActiveTab('performance')}
        >
          <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>Performance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'permissions' && styles.activeTab]}
          onPress={() => setActiveTab('permissions')}
        >
          <Text style={[styles.tabText, activeTab === 'permissions' && styles.activeTabText]}>Permissions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qrcode' && styles.activeTab]}
          onPress={() => setActiveTab('qrcode')}
        >
          <Text style={[styles.tabText, activeTab === 'qrcode' && styles.activeTabText]}>QR Code</Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <ScrollView>
        {activeTab === 'info' && renderInfoTab()}
        
        {activeTab === 'performance' && (
          <EmployeePerformanceTracker
            employee={employee}
            businessId={businessId}
          />
        )}
        
        {activeTab === 'permissions' && (
          <View style={styles.contentContainer}>
            <View style={styles.card}>
              <RolePermissionManager
                role={employee.role as EmployeeRole}
                permissions={employee.permissions ? JSON.parse(employee.permissions) : {
                  manageEmployees: false,
                  manageCustomers: false,
                  manageProducts: false,
                  manageOrders: false,
                  viewReports: false,
                  processTransactions: false,
                  manageSettings: false
                }}
                onRoleChange={(role) => {}}
                onPermissionsChange={(permissions) => {}}
                readOnly={true}
              />
              
              <TouchableOpacity
                style={[styles.actionButton, { marginTop: 20 }]}
                onPress={() => navigation.navigate('EditPermissions', { 
                  employee, 
                  onUpdate: handleRolePermissionsUpdate 
                })}
              >
                <Icon name="shield-edit" size={24} color="white" />
                <Text style={styles.actionButtonText}>Edit Permissions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {activeTab === 'qrcode' && (
          <View style={styles.contentContainer}>
            <EmployeeQRCodeGenerator
              employee={employee}
              onQRCodeGenerated={handleQRCodeGenerated}
              size={250}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
