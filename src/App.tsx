import React, { useEffect, useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import Toast from 'react-native-toast-message';
import Navigation from './components/Navigation';
import BusinessCreateModal from './components/BusinessCreateModal';
import SignOutButton from './components/SignOutButton';
import outputs from '../amplify_outputs.json';
import type { Schema } from '../amplify/data/resource';

Amplify.configure(outputs);
const client = generateClient<Schema>();

function AuthenticatedApp() {
  const { user } = useAuthenticator((context) => [context.user]);
  const userId = user?.userId;
  const [isBusinessAvailable, setIsBusinessAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkUserBusiness() {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        
        const { data, errors } = await client.queries.fetchBusiness({
          userId: userId
        });
        
        if (data && !errors) {
          setIsBusinessAvailable(true);
        } else {
          setIsBusinessAvailable(false);
        }
      } catch (error) {
        console.error("Error checking business:", error);
        setIsBusinessAvailable(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkUserBusiness();
  }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SignOutButton />
      <View style={{ flex: 1 }}>
        <Navigation user={user} />
        {!isBusinessAvailable && !isLoading && (
          <BusinessCreateModal
            userId={userId}
            onCloseModal={() => {
              setIsBusinessAvailable(true);
            }}
          />
        )}
      </View>
      <Toast />
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