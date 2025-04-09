import React from "react";
import { Button, View, StyleSheet } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import outputs from "../amplify_outputs.json";
import Dashboard from "../src/screens/Dashboard";
import BusinessCreate from "./components/BusinessCreate";

Amplify.configure(outputs);

const Stack = createNativeStackNavigator();

const SignOutButton = () => {
  const { signOut } = useAuthenticator();
  return (
    <View style={styles.signOutButton}>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
};

const RootStack = () => {
  return (
    <NavigationContainer>
      <SignOutButton />
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD" component={Dashboard} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <Authenticator.Provider>
        <Authenticator>
          <SafeAreaView style={styles.container}>
            <RootStack />
            <BusinessCreate />
          </SafeAreaView>
        </Authenticator>
      </Authenticator.Provider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  signOutButton: {
    alignSelf: "flex-end",
  },
});