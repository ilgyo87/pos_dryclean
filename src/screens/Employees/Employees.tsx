// src/screens/Employees/Employees.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, SafeAreaView, Text, ActivityIndicator } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import EmployeeList from "./components/EmployeeList";
import EmployeeToolbar from "./components/EmployeeToolbar";
import { useEmployeesData } from "./hooks/useEmployeeData";
import styles from "./styles/EmployeeStyles";
import { Schema } from "../../../amplify/data/resource";
import CreateFormModal from "../../components/CreateFormModal";
import SearchBar from "../../components/SearchBar";

export default function Employees({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingEmployee, setEditingEmployee] = useState<Schema["Employee"]["type"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [user?.userId])
  );

  const { employees, isLoading, fetchEmployees, refreshing, setRefreshing, createEmployee, updateEmployee, deleteEmployee } = useEmployeesData(user);

  useEffect(() => {
    console.log(`Employee count: ${employees?.length || 0}`);
  }, [employees]);

  const handleCreateEmployee = () => {
    if (!user) return;
    setModalType('create');
    setEditingEmployee(null);
    setIsModalVisible(true);
  };

  const handleEditEmployee = (employee: Schema["Employee"]["type"]) => {
    setModalType('edit');
    setEditingEmployee(employee);
    setIsModalVisible(true);
  };

  const filteredEmployees = employees?.filter(employee => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      employee.firstName?.toLowerCase().includes(searchLower) ||
      employee.lastName?.toLowerCase().includes(searchLower) ||
      employee.email?.toLowerCase().includes(searchLower) ||
      employee.phoneNumber?.includes(searchQuery)
    );
  });

  const handleEmployeeSearch = (employee: Schema["Employee"]["type"]) => {
    // Instead of navigating, open the edit modal
    setModalType('edit');
    setEditingEmployee(employee);
    setIsModalVisible(true);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const closeModal = () => {
    setIsModalVisible(false);
    // Refresh the employee list when modal closes
    fetchEmployees();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Employees</Text>
        </View>

        <View style={styles.searchContainer}>
          <SearchBar 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search employees..."
          />
        </View>

        <EmployeeToolbar onCreatePress={handleCreateEmployee} />

        <EmployeeList
          employees={filteredEmployees || []}
          onEmployeePress={handleEditEmployee}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchEmployees().finally(() => setRefreshing(false));
          }}
        />
        
        {isModalVisible && (
          <CreateFormModal
            visible={isModalVisible}
            onClose={closeModal}
            params={{
              userId: user?.userId,
              fetchEmployees,
              createEmployee,
              updateEmployee,
              deleteEmployee,
              ...(editingEmployee ? { employee: editingEmployee } : {})
            }}
            type="Employee"
            createOrEdit={modalType}
          />
        )}
      </View>
    </SafeAreaView>
  );
}