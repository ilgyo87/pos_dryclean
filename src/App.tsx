// src/App.tsx
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Amplify } from "aws-amplify";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import outputs from "../amplify_outputs.json";
import BusinessCreate from "./components/BusinessCreate";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import SignOutButton from "./components/SignOutButton";
import Navigation from "./components/Navigation";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function AuthenticatedApp() {
  const { user } = useAuthenticator((context) => [context.user]);
  const [isBusinessAvailable, setIsBusinessAvailable] = useState(false);

  const business = client.queries.fetchBusiness({
    userId: user?.userId
  })

  useEffect(() => {
    setIsBusinessAvailable(false);
  }, [business]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SignOutButton />
      <View style={{ flex: 1 }}>
        <Navigation user={user} />
        {!isBusinessAvailable && (
          <BusinessCreate
            user={user!}
            onCloseModal={() => {
              setIsBusinessAvailable(false);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <AuthenticatedApp />
      </Authenticator>
    </Authenticator.Provider>
  );
}