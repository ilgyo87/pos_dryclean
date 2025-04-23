// src/hooks/useCustomers.ts
import { useEffect, useState } from 'react';
import { getRealm } from '../localdb/getRealm';
import { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let realm: Realm;
    let customersCollection: Realm.Results<any>;
    let isMounted = true;
    let unmounted = false;
    setIsLoading(true);

    const mapCustomer = (item: any): Customer => ({
      _id: item._id,
      firstName: item.firstName,
      lastName: item.lastName,
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      zipCode: item.zipCode || '',
      businessId: item.businessId || '',
      cognitoId: item.cognitoId || '',
      notes: item.notes || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt || null,
    });

    const loadCustomers = async () => {
      try {
        realm = await getRealm();
        customersCollection = realm.objects('Customer');
        let listener: ((collection: Realm.Results<any>, changes: Realm.CollectionChangeSet) => void) | null = null;

        if (isMounted && customersCollection.isValid()) {
          try {
            const data = Array.from(customersCollection).map(mapCustomer);
            setCustomers(data);
          } catch (e) {
            console.error('[Realm][useCustomers] ERROR: Tried to access invalidated Results in initial load', e);
          }
        }

        listener = (collection: Realm.Results<any>, changes: Realm.CollectionChangeSet) => {
          if (!isMounted) {
            console.log('[Realm][useCustomers] Listener: Not mounted, skip update');
            return;
          }
          if (!realm || realm.isClosed) {
            console.log('[Realm][useCustomers] Listener: Realm is closed, skip update');
            return;
          }
          if (!collection.isValid()) {
            console.log('[Realm][useCustomers] Listener: Collection invalid, skip update');
            return;
          }
          if (unmounted) {
            console.warn('[Realm][useCustomers] setCustomers attempted after unmount');
            return;
          }
          try {
            const mapped = Array.from(collection).map(mapCustomer);
            setCustomers(mapped);
            if (mapped.length > 0) {
              console.log('[DEBUG][useCustomers] typeof first:', typeof mapped[0], 'instanceof Object:', mapped[0] instanceof Object, 'constructor:', mapped[0].constructor.name);
            }
          } catch (e) {
            console.error('[Realm][useCustomers] ERROR: Tried to access invalidated Results in listener', e);
          }
        };

        if (customersCollection && customersCollection.isValid() && realm && !realm.isClosed && listener) {
          customersCollection.addListener(listener as any);
          console.log('[Realm][useCustomers] Listener added');
        }

        // Store cleanup function on closure
        (loadCustomers as any).cleanup = () => {
          if (customersCollection && customersCollection.removeListener && listener) {
            customersCollection.removeListener(listener as any);
            console.log('[Realm][useCustomers] Listener removed');
          }
        };
      } catch (err: unknown) {
        setError((err as Error).message || 'Failed to open Realm');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();

    return () => {
      isMounted = false;
      unmounted = true;
      setCustomers([]); // Defensive: clear state so no stale refs remain
      if (typeof (loadCustomers as any).cleanup === 'function') {
        (loadCustomers as any).cleanup();
      }
      if (realm && !realm.isClosed) {
        realm.close();
        console.log('[Realm][useCustomers] Realm closed');
      }
    };
  }, []);

  return {
    customers,
    isLoading,
    error,
    refetch: async () => {}, // No-op for backward compatibility
  };
}