import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { getAllCategories, addCategory, updateCategory, deleteCategory } from '../localdb/services/categoryService';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getAllCategories();
      setCategories(Array.from(results).map((item: any) => ({ ...item })));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

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