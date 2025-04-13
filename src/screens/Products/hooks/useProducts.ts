import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './../../../../amplify/data/resource';

const client = generateClient<Schema>();

export function useProducts(selectedServiceId: string | null) {
  const [products, setProducts] = useState<Schema["Item"]["type"][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch if no service is selected
    if (!selectedServiceId) {
      setProducts([]); // Clear products
      setIsLoading(false); // Ensure loading is off
      setError(null);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      setProducts([]); // Clear previous products while loading new ones
      try {
        const { data: fetchedProducts, errors } = await client.models.Item.list({
          filter: {
            categoryId: { eq: selectedServiceId }
          }
        });
        if (errors) {
          const errorMsg = 'Error fetching products: ' + errors.map(e => e.message).join(', ');
          console.error(errorMsg);
          setError(errorMsg);
          Alert.alert("Error", "Could not fetch products for the selected service.");
        } else {
          setProducts(fetchedProducts);
        }
      } catch (err: any) {
        const errorMsg = 'Unexpected error fetching products: ' + err.message;
        console.error(errorMsg, err);
        setError(errorMsg);
        Alert.alert("Error", "An unexpected error occurred while fetching products.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedServiceId]); // Dependency array includes selectedServiceId

  // Consider adding a function here to manually refetch products if needed
  // const refetchProducts = () => { /* ... */ };

  return { products, isLoading, error };
}
