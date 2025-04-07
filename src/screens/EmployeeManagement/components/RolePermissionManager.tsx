// src/screens/EmployeeManagement/components/RolePermissionManager.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch
} from 'react-native';
import { styles } from '../styles/employeeManagementStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  EmployeeRole, 
  EmployeeStatus,
  EmployeePermissions
} from '../types/EmployeeTypes';

interface RolePermissionManagerProps {
  role: EmployeeRole;
  permissions: EmployeePermissions;
  onRoleChange: (role: EmployeeRole) => void;
  onPermissionsChange: (permissions: EmployeePermissions) => void;
  readOnly?: boolean;
}

const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  role,
  permissions,
  onRoleChange,
  onPermissionsChange,
  readOnly = false
}) => {
  // Role descriptions
  const roleDescriptions = {
    [EmployeeRole.ADMIN]: 'Full access to all system features and settings.',
    [EmployeeRole.MANAGER]: 'Can manage day-to-day operations but has limited access to system settings.',
    [EmployeeRole.STAFF]: 'Basic access to serve customers and process transactions.'
  };

  // Permission templates for each role
  const rolePermissionTemplates = {
    [EmployeeRole.ADMIN]: {
      manageEmployees: true,
      manageCustomers: true,
      manageProducts: true,
      manageOrders: true,
      viewReports: true,
      processTransactions: true,
      manageSettings: true
    },
    [EmployeeRole.MANAGER]: {
      manageEmployees: false,
      manageCustomers: true,
      manageProducts: true,
      manageOrders: true,
      viewReports: true,
      processTransactions: true,
      manageSettings: false
    },
    [EmployeeRole.STAFF]: {
      manageEmployees: false,
      manageCustomers: false,
      manageProducts: false,
      manageOrders: true,
      viewReports: false,
      processTransactions: true,
      manageSettings: false
    }
  };

  // Apply role template
  const applyRoleTemplate = (selectedRole: EmployeeRole) => {
    onRoleChange(selectedRole);
    onPermissionsChange(rolePermissionTemplates[selectedRole]);
  };

  // Toggle individual permission
  const togglePermission = (key: keyof EmployeePermissions) => {
    if (readOnly) return;
    
    const updatedPermissions = {
      ...permissions,
      [key]: !permissions[key]
    };
    onPermissionsChange(updatedPermissions);
  };

  // Get description for each permission
  const getPermissionDescription = (permission: keyof EmployeePermissions): string => {
    const descriptions: Record<keyof EmployeePermissions, string> = {
      manageEmployees: 'Add, edit, and remove employees',
      manageCustomers: 'Add, edit, and remove customers',
      manageProducts: 'Add, edit, and remove products and services',
      manageOrders: 'Create and manage customer orders',
      viewReports: 'Access business reports and analytics',
      processTransactions: 'Process payments and transactions',
      manageSettings: 'Change business settings and configurations'
    };
    
    return descriptions[permission] || '';
  };

  return (
    <View>
      {/* Role Selection */}
      <View style={styles.permissionSection}>
        <Text style={styles.permissionSectionTitle}>Role</Text>
        
        <View style={localStyles.roleContainer}>
          {Object.values(EmployeeRole).map((roleOption) => (
            <TouchableOpacity
              key={roleOption}
              style={[
                localStyles.roleButton,
                role === roleOption && localStyles.activeRoleButton,
                readOnly && localStyles.disabledButton
              ]}
              onPress={() => !readOnly && applyRoleTemplate(roleOption)}
              disabled={readOnly}
            >
              <Text 
                style={[
                  localStyles.roleButtonText,
                  role === roleOption && localStyles.activeRoleButtonText
                ]}
              >
                {roleOption}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={localStyles.roleDescription}>
          {roleDescriptions[role]}
        </Text>
      </View>

      {/* Permissions Section */}
      <View style={styles.permissionSection}>
        <View style={localStyles.permissionHeader}>
          <Text style={styles.permissionSectionTitle}>Permissions</Text>
          
          {!readOnly && (
            <TouchableOpacity 
              style={localStyles.resetButton}
              onPress={() => applyRoleTemplate(role)}
            >
              <Text style={localStyles.resetButtonText}>Reset to Defaults</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {Object.entries(permissions).map(([key, value]) => (
          <TouchableOpacity 
            key={key}
            style={[
              styles.permissionItem,
              readOnly && localStyles.readOnlyItem
            ]}
            onPress={() => togglePermission(key as keyof EmployeePermissions)}
            disabled={readOnly}
          >
            <View style={localStyles.permissionRow}>
              <View style={localStyles.permissionInfo}>
                <Text style={styles.permissionLabel}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={styles.permissionDescription}>
                  {getPermissionDescription(key as keyof EmployeePermissions)}
                </Text>
              </View>
              
              <Switch
                value={value}
                onValueChange={() => togglePermission(key as keyof EmployeePermissions)}
                disabled={readOnly}
                trackColor={{ false: '#d3d3d3', true: '#4CAF50' }}
                thumbColor={value ? '#fff' : '#f4f3f4'}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeRoleButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  roleButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  activeRoleButtonText: {
    color: '#fff',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
    marginBottom: 15,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resetButton: {
    padding: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#666',
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  permissionInfo: {
    flex: 1,
  },
  readOnlyItem: {
    opacity: 0.7,
  },
  disabledButton: {
    opacity: 0.7,
  }
});

export default RolePermissionManager;
