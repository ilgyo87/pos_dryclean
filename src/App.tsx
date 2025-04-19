import React, { useEffect, useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import Toast from 'react-native-toast-message';
import Navigation from './components/Navigation';
import SignOutButton from './components/SignOutButton';
import outputs from '../amplify_outputs.json';
import type { Schema } from '../amplify/data/resource';
import BusinessForm from './components/BusinessForm';

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
        
        const { data, errors } = await client.models.Business.list({
          filter: {
            userId: {
              eq: userId
            }
          }
        });
        
        if (data && !errors) {
          setIsBusinessAvailable(data.length > 0);
        } else {
          setIsBusinessAvailable(false);
        }
      } catch (error) {
        console.info("Error checking business:", error);
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
          <BusinessForm
            visible={!isBusinessAvailable}
            onClose={() => setIsBusinessAvailable(true)}
            onSuccess={() => setIsBusinessAvailable(true)}
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