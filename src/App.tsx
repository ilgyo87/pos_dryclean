import React, { useEffect, useState } from "react";
import { Button, View, StyleSheet } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import outputs from "../amplify_outputs.json";
import Dashboard from "../src/screens/Dashboard";
import BusinessCreate from "./components/BusinessCreate";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

Amplify.configure(outputs);

const Stack = createNativeStackNavigator();

const client = generateClient<Schema>();

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
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD" component={Dashboard} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => {
  const { user } = useAuthenticator((context) => [context.user]);
  const [isBusinessCreateVisible, setIsBusinessCreateVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const checkBusiness = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const result = await client.models.Business.list({
        filter: { userId: { eq: user.userId } },
      });
      console.log("Business check result:", result);
      setIsBusinessCreateVisible(result.data?.length === 0);
    } catch (error) {
      console.error("Error checking business:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkBusiness();
  }, [user]);

  return (
    <View>
      <SignOutButton />
      <RootStack />
      {user && <BusinessCreate isVisible={isBusinessCreateVisible} user={user} onCloseModal={() => setIsBusinessCreateVisible(false)} />}
    </View>
  );
};

export default function App() {

  return (
    <Authenticator.Provider>
      <Authenticator>
        <SafeAreaView style={styles.container}>
          <AppContent />
        </SafeAreaView>
      </Authenticator>
    </Authenticator.Provider>
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