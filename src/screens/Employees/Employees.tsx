// src/screens/Employees/Employees.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, SafeAreaView, Text, ActivityIndicator } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import EmployeeList from "./components/EmployeeList";
import EmployeeToolbar from "./components/EmployeeToolbar";
import styles from "./styles/EmployeeStyles";
import { Schema } from "../../../amplify/data/resource";
import CreateFormModal from "../../components/CreateFormModal";
import SearchBar from "../../components/SearchBar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { fetchEmployees } from "../../store/slices/EmployeeSlice";

export default function Employees({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [editingEmployee, setEditingEmployee] = useState<Schema["Employee"]["type"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const { employees, isLoading, error } = useSelector((state: RootState) => state.employee);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch employees when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?.userId) {
        dispatch(fetchEmployees(user.userId));
      }
    }, [user?.userId, dispatch])
  );

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
      employee.phoneNumber?.includes(searchQuery) ||
      employee.role?.toLowerCase().includes(searchLower)
    );
  });

  const handleRefresh = async () => {
    if (user?.userId) {
      setRefreshing(true);
      await dispatch(fetchEmployees(user.userId));
      setRefreshing(false);
    }
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
    if (user?.userId) {
      dispatch(fetchEmployees(user.userId));
    }
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
          onRefresh={handleRefresh}
        />
        
        {isModalVisible && (
          <CreateFormModal
            visible={isModalVisible}
            onClose={closeModal}
            params={{
              userId: user?.userId,
              employee: editingEmployee
            }}
            type="Employee"
            createOrEdit={modalType}
          />
        )}
      </View>
    </SafeAreaView>
  );
}