import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { getFirstBusiness, addBusiness } from '../../localdb/services/businessService';
import { useNavigation } from '@react-navigation/native';
import { AuthUser } from "aws-amplify/auth";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Business } from '../../types';

export default function Dashboard({ user, refresh }: { user: AuthUser | null, refresh: number }) {
  const [business, setBusiness] = useState<Business | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigation = useNavigation<any>();
  const client = generateClient<Schema>();

  const { user: authUser } = useAuthenticator((context) => [context.user]);



  const fetchBusiness = useCallback(async () => {
    console.log('fetchBusiness called');
    setIsLoading(true);
    try {
      if (!user?.userId) {
        setBusiness(undefined);
        setIsLoading(false);
        return;
      }
      let locals = await getFirstBusiness(user.userId);
      console.log('[Dashboard] getFirstBusiness result:', locals);
      if (!locals) {
        // Try API fetch
        const { data } = await client.models.Business.list({
          filter: { owner: { contains: user.userId } }
        });
        console.log('[Dashboard] API business list:', data);
        if (data && data.length > 0) {
          // Save to local DB
          const ownerEmail = authUser?.signInDetails?.loginId || '';

          for (const apiObj of data) {
            await addBusiness({
              _id: apiObj.id,
              businessName: apiObj.businessName,
              firstName: apiObj.firstName || '',
              lastName: apiObj.lastName || '',
              phone: apiObj.phone || '',
              email: ownerEmail,
              userId: apiObj.owner || user.userId,
            });
          }
          // Re-query local
          locals = await getFirstBusiness(user.userId);
        }
      }
      setBusiness(locals);
    } catch (err) {
      let message = '';
      if (typeof err === 'object' && err && 'message' in err) {
        message = (err as any).message;
      } else {
        message = String(err);
      }
      console.error('[Dashboard] Error fetching business:', err, JSON.stringify(err));
      Alert.alert('Error', `Failed to load business data. ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId, refresh]);

  useEffect(() => {
    fetchBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBusiness]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {business ? (
        <View>
          <Text style={styles.businessName}>{business.businessName}</Text>
          <Text>Address: {business.address}</Text>
          <Text>Phone: {business.phone}</Text>
          {/* categories */}
          {(() => {
            const counts = { customers: 0, orders: 0, products: 0, employees: 0 };
            const categories = [
              { id: 'customers', title: 'Customers', count: counts.customers },
              { id: 'orders', title: 'Orders', count: counts.orders },
              { id: 'products', title: 'Products', count: counts.products },
              { id: 'employees', title: 'Team', count: counts.employees },
            ];
            return categories.map(cat => <Text key={cat.id}>{cat.title}: {cat.count}</Text>);
          })()}
        </View>
      ) : (
        <View>
          <Text>Business not created. Please create a business.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateBusiness')}>
            <Text style={styles.createButton}>Create Business</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#007bff', // or any color you prefer for the box
    color: 'white', // text color
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5, // for rounded corners
    textAlign: 'center',
    alignSelf: 'center', // center the button itself
    marginTop: 10, // some spacing from the text above
  }
});