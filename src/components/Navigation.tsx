// src/components/Navigation.tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthUser } from "@aws-amplify/auth";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import Dashboard from "../screens/Dashboard/Dashboard";
import CustomersScreen from "../screens/Customers/Customers";
import EmployeesScreen from "../screens/Employees/Employees";
import SignOutButton from "./SignOutButton";
import { NavigationProps } from "../types";
import Products from "../screens/Products/Products";

const Stack = createNativeStackNavigator();

const CustomHeader = ({
  employee,
  title,
  onSwitchEmployee
}: {
  employee: { id: string, name: string } | null,
  title: string,
  onSwitchEmployee: () => void
}) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerTitle}>{title}</Text>

    <View style={styles.employeeContainer}>
      <View style={styles.employeeNameAndSwitch}>
        <Text style={styles.employeeName}>
          {employee ? employee.name : "Employee Not Signed In"}
        </Text>
        <Pressable onPress={onSwitchEmployee} style={styles.switchButton}>
          <Image
            source={require('../../assets/alter.png')}
            style={{ width: 24, height: 24 }}
          />        
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
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackVisible: true,
          headerTitle: (props) => (
            <CustomHeader
              employee={employee}
              title={props.children}
              onSwitchEmployee={onSwitchEmployee}
            />
          ),
        }}
      >
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} />}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  signOutContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginTop: -60,
  },
  employeeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  employeeNameAndSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  employeeName: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginRight: 40, // Space between name and button
    marginLeft: 90,
  },

  switchButton: {
    padding: 8,
    marginTop: 1,
    borderRadius: 5,
  },
});