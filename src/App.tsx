// src/App.tsx
import React, { useEffect, useState } from "react";
import { Button, View, StyleSheet } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AuthUser } from 'aws-amplify/auth';
import outputs from "../amplify_outputs.json";
import Dashboard from "./screens/Dashboard";
import BusinessCreate from "./components/BusinessCreate";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

Amplify.configure(outputs);

const Stack = createNativeStackNavigator();

const client = generateClient<Schema>();

// SignOutButton Component (Correctly uses useAuthenticator)
const SignOutButton = () => {
  const { signOut } = useAuthenticator();
  return (
    <View style={styles.signOutButton}>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
};

const RootStack = ({ user }: { user: AuthUser | null }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DASHBOARD">
        <Stack.Screen name="DASHBOARD">
          {(props) => <Dashboard {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => {
  const { user } = useAuthenticator((context) => [context.user]);
  const [isBusinessCreateVisible, setIsBusinessCreateVisible] = useState(false);
  const [isLoadingBusinessCheck, setIsLoadingBusinessCheck] = useState(true);

  const checkBusiness = async () => {
    if (!user) {
      setIsLoadingBusinessCheck(false);
      setIsBusinessCreateVisible(false);
      return;
    }
    try {
      const result = await client.models.Business.list({
        filter: { userId: { eq: user.userId } },
      });
      console.log("Business check result:", result);
      setIsBusinessCreateVisible(result.data?.length === 0);
    } catch (error) {
      console.error("Error checking business:", error);
      setIsBusinessCreateVisible(false);
    } finally {
      setIsLoadingBusinessCheck(false);
    }
  };

  useEffect(() => {
    setIsLoadingBusinessCheck(true);
    checkBusiness();
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <SignOutButton />
      <RootStack user={user} />
      {!isLoadingBusinessCheck && user && (
        <BusinessCreate
          isVisible={isBusinessCreateVisible}
          user={user}
          onCloseModal={() => {
            setIsBusinessCreateVisible(false);
          }}
        />
      )}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signOutButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
});