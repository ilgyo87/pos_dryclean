import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '../localdb/services/productService';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await getAllProducts();
      // Convert Realm Results to plain Product objects
      setProducts(Array.from(results).map((item: any) => ({ ...item })));

    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = async (product: Product) => {
    setLoading(true);
    setError(null);
    try {
      await addProduct(product);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const editProduct = async (id: string, updates: Partial<Product>) => {
    setLoading(true);
    setError(null);
    try {
      await updateProduct(id, updates);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    editProduct,
    removeProduct,
  };
}
