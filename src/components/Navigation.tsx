// src/components/Navigation.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import { View, Text, StyleSheet, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import Dashboard from "../screens/Dashboard/Dashboard";
import CustomersScreen from "../screens/Customers/Customers";
import EmployeesScreen from "../screens/Employees/Employees";
import SignOutButton from "./SignOutButton";
import { NavigationProps } from "../types";
import Products from "../screens/Products/Products";
import Checkout from "../screens/Checkout/Checkout";
import Order from "../screens/Orders/Order";
import { PinInput } from "./PinInput";
import { useState, useEffect, useRef } from "react";
import { fetchEmployees } from "../store/slices/EmployeeSlice";
import { AppDispatch, RootState } from "../store";

const Stack = createNativeStackNavigator();

const CustomHeader = ({
  employee,
  title,
  onSwitchEmployee,
  onSignInOut
}: {
  employee: { id: string, name: string } | null,
  title: string,
  onSwitchEmployee: (employee: { id: string, name: string } | null) => void,
  onSignInOut: () => void
}) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerTitle}>{title}</Text>

    <View style={styles.employeeContainer}>
      <View style={styles.employeeNameAndSwitch}>
        <Text style={styles.employeeName}>
          {employee ? employee.name : "Employee Not Signed In"}
        </Text>
        <Pressable onPress={onSignInOut} style={styles.signInOutButton}>
          <Ionicons 
            name={employee ? "log-out-outline" : "log-in-outline"} 
            size={24} 
            color="#007AFF" 
          />
          <Text style={styles.signInOutText}>
            {employee ? "Sign Out" : "Sign In"}
          </Text>
        </Pressable>
      </View>
    </View>

    <View style={styles.signOutContainer}>
      <SignOutButton />
    </View>
  </View>
);


export default function Navigation({
  user,
  employee,
  onSwitchEmployee
}: NavigationProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { employees } = useSelector((state: RootState) => state.employee);
  
  // State for PIN input
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const pinRef = useRef(pin);
  
  // Fetch employees when component mounts
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchEmployees(user.userId));
    }
  }, [dispatch, user?.userId]);
  
  // Handle sign in/out button press
  const handleSignInOut = () => {
    if (employee) {
      // If employee is signed in, sign them out
      onSwitchEmployee(null);
    } else {
      // If no employee is signed in, show PIN modal
      setIsPinModalVisible(true);
      setPin("");
      setPinError(false);
    }
  };
  
  // Handle PIN submission
  const handlePinSubmit = () => {
    console.log("PIN received for processing:", pinRef.current, "Length:", pinRef.current.length);
    
    // If we're still not getting all 4 digits, don't proceed
    if (pinRef.current.length < 4) {
      console.log("PIN incomplete, not processing");
      return;
    }
    
    // Find employee with matching PIN
    const matchedEmployee = employees.find(emp => emp.pinCode === pinRef.current);
    
    if (matchedEmployee) {
      // Valid PIN - sign in the employee
      onSwitchEmployee({
        id: matchedEmployee.id,
        name: `${matchedEmployee.firstName} ${matchedEmployee.lastName}`
      });
      setIsPinModalVisible(false);
      setPin("");
    } else {
      // Invalid PIN - show error
      setPinError(true);
      setTimeout(() => {
        setPin("");
        // Keep modal open but reset the error after 2 seconds
        setTimeout(() => setPinError(false), 2000);
      }, 500);
    }
  };
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: "#ffffff",
          },
          headerTintColor: "#000000",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerBackVisible: true,
          headerTitle: (props) => (
            <CustomHeader
              employee={employee}
              title={props.children}
              onSwitchEmployee={onSwitchEmployee}
              onSignInOut={handleSignInOut}
            />
          ),
        }}
      >
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} />}
        </Stack.Screen>
        <Stack.Screen name="Customers">
          {(props) => <CustomersScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Employees">
          {(props) => <EmployeesScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Products">
          {(props) => <Products {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen name="Checkout">
          {(props) => <Checkout {...props} user={user} employee={employee} />}
        </Stack.Screen>
        <Stack.Screen name="Orders">
          {(props) => <Order {...props} user={user} employee={employee} />}
        </Stack.Screen>
      </Stack.Navigator>
      
      {/* PIN Input Modal */}
      <PinInput
        value={pin}
        onChange={(value) => {
          setPin(value);
          pinRef.current = value;
        }}
        maxLength={4}
        isVisible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
        onSubmit={handlePinSubmit}
        title={pinError ? "Invalid PIN" : "Enter Employee PIN"}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
  },
  employeeContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  employeeNameAndSwitch: {
    flexDirection: "row",
    alignItems: "center",
  },
  employeeName: {
    marginRight: 10,
    fontSize: 14,
    color: "#555555",
  },
  switchButton: {
    padding: 5,
  },
  signOutContainer: {
    marginLeft: "auto",
    paddingBottom: 65,
  },
  signInOutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#f0f8ff",
  },
  signInOutText: {
    marginLeft: 4,
    color: "#007AFF",
    fontWeight: "500",
    fontSize: 14,
  },
});