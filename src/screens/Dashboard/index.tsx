import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { getFirstBusiness, addBusiness } from '../../localdb/services/businessService';
import Realm from 'realm';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AuthUser } from "aws-amplify/auth";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Business } from '../../types';

import { useRoute } from '@react-navigation/native';

export default function Dashboard({ user }: { user: AuthUser | null }) {
  const [business, setBusiness] = useState<Business | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigation = useNavigation<any>();

  const client = generateClient<Schema>();
  const fetchBusiness = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user?.userId) {
        setBusiness(undefined);
        setIsLoading(false);
        return;
      }
      let locals = await getFirstBusiness(user.userId);
      console.log('[Dashboard] getFirstBusiness result:', locals);
      console.log('[Dashboard] userId:', user.userId);
      if (!locals) {
        // Try API fetch
        const apiBiz = await client.models.Business.list({
          filter: { owner: { contains: user.userId } }
        });
        console.log('[Dashboard] API business list:', apiBiz.data);
        if (apiBiz.data.length > 0) {
          const apiObj = apiBiz.data[0];
          console.log('[Dashboard] Saving business with userId:', apiObj.owner ?? user.userId);
          await addBusiness({
            _id: apiObj.id,
            businessName: apiObj.businessName ?? '',
            firstName: apiObj.firstName ?? '',
            lastName: apiObj.lastName ?? '',
            phone: apiObj.phone ?? '',
            userId: apiObj.owner ?? user.userId,
            // Add any other fields your local schema expects
          });
          // Debug: print all local businesses
          const realm = await Realm.open({ path: 'pos-dryclean.realm' });
          const allBusinesses = realm.objects('Business');
          console.log('[Dashboard] All local businesses (unfiltered):', JSON.stringify(allBusinesses, null, 2));
          console.log('[Dashboard] Querying business with userId:', user.userId);
          locals = await getFirstBusiness(user.userId);
          console.log('[Dashboard] getFirstBusiness (after sync) result:', locals);
        }
      }
      if (locals) setBusiness(locals);
      else setBusiness(undefined);
    } catch (e) {
      console.error('Error fetching local business:', e);
      setBusiness(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

    const route = useRoute();
  const refresh = (route as any).params?.refresh;

  // Initial fetch on mount and when refresh param changes
  useEffect(() => { fetchBusiness(); }, [fetchBusiness, refresh]);
  // Refetch when screen focus changes (for navigation-based flows)
  useFocusEffect(
    useCallback(() => { fetchBusiness(); }, [fetchBusiness])
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
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
    fontSize: 18,
    fontWeight: '500',
    color: 'blue',
    marginBottom: 8,
  }
});