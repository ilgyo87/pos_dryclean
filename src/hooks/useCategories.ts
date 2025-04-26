import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { 
  getAllCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  getCategoriesByBusinessId
} from '../localdb/services/categoryService';

export function useCategories(businessId?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // // console.log(`[useCategories] Fetching categories with businessId: '${businessId || ''}'`);
      
      let results;
      if (businessId) {
        // If businessId is provided, filter categories by business
        results = await getCategoriesByBusinessId(businessId);
        // // console.log(`[useCategories] Fetched ${results.length} categories for business '${businessId}'`);
      } else {
        // Otherwise get all categories
        results = await getAllCategories();
        // // console.log(`[useCategories] Fetched ${results.length} categories (all businesses)`);
      }
      
      setCategories(Array.from(results).map((item: any) => ({ ...item })));
    } catch (err: any) {
      console.error('[useCategories] Error fetching categories:', err);
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create a new category
  const createCategory = async (category: Category) => {
    setLoading(true);
    setError(null);
    try {
      await addCategory(category);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const editCategory = async (id: string, updates: Partial<Category>) => {
    setLoading(true);
    setError(null);
    try {
      await updateCategory(id, updates);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const removeCategory = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCategory(id);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    editCategory,
    removeCategory,
  };
}