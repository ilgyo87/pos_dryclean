import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './../../../../amplify/data/resource';

const client = generateClient<Schema>();

export function useServices() {
  const [services, setServices] = useState<Schema["Category"]["type"][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: fetchedServices, errors } = await client.models.Category.list();
        if (errors) {
          const errorMsg = 'Error fetching services: ' + errors.map(e => e.message).join(', ');
          console.error(errorMsg);
          setError(errorMsg);
          Alert.alert("Error", "Could not fetch services.");
        } else {
          setServices(fetchedServices);
        }
      } catch (err: any) {
        const errorMsg = 'Unexpected error fetching services: ' + err.message;
        console.error(errorMsg, err);
        setError(errorMsg);
        Alert.alert("Error", "An unexpected error occurred while fetching services.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []); // Runs once on mount

  // Consider adding a function here to manually refetch services if needed
  // const refetchServices = () => { /* ... */ };

  return { services, isLoading, error };
}
