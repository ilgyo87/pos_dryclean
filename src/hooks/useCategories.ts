import { useState, useCallback, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { addCategory, getAllCategories, getCategoriesByBusinessId } from '../localdb/services/categoryService';
import type { Category } from '../types';
import { Alert } from 'react-native';

const client = generateClient<Schema>();

export function useCategories(businessId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (businessId) {
        const realmResults = await getCategoriesByBusinessId(businessId);
        // Realm objects need to be mapped to plain JS objects
        const categoryData: Category[] = Array.from(realmResults).map((item: any) => ({
          _id: item._id,
          name: item.name,
          description: item.description || '',
          businessId: item.businessId,
          imageUrl: item.imageUrl || '',
          imageSource: item.imageSource || '',
          price: item.price || 0,
        }));
        setCategories(categoryData);
      } else {
        const realmResults = await getAllCategories();
        // Realm objects need to be mapped to plain JS objects
        const categoryData: Category[] = Array.from(realmResults).map((item: any) => ({
          _id: item._id,
          name: item.name,
          description: item.description || '',
          businessId: item.businessId,
          imageUrl: item.imageUrl || '',
          imageSource: item.imageSource || '',
          price: item.price || 0,
        }));
        setCategories(categoryData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create a new category
  const createCategory = async (categoryData: Omit<Category, '_id'>) => {
    try {
      setIsLoading(true);
      // Create category in Amplify data
      const response = await client.models.Category.create({
        name: categoryData.name,
        description: categoryData.description,
        price: categoryData.price,
        imageUrl: categoryData.imageUrl,
        businessId: categoryData.businessId,
      });

      if (!response.data) {
        throw new Error('Failed to create category in Amplify');
      }

      // Create in local Realm DB
      const newCategory: Category = {
        _id: response.data.id,
        name: categoryData.name,
        description: categoryData.description || '',
        businessId: categoryData.businessId,
        imageUrl: categoryData.imageUrl || '',
        imageSource: categoryData.imageSource || '',
        price: categoryData.price || 0,
      };

      await addCategory(newCategory);
      await fetchCategories(); // Refresh the list
      return newCategory;
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
      Alert.alert('Error', `Failed to create category: ${err.message}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
    createCategory,
  };
}