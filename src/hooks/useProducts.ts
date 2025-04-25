import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import { getAllProducts, addProduct, updateProduct, deleteProduct, getProductsByBusinessId, getProductsByBusinessAndCategoryId, getProductsByCategoryId } from '../localdb/services/productService';

export function useProducts(businessId?: string, categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!businessId && !categoryId) {
      setProducts([]);
      setError('No businessId or categoryId provided');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let results = [];
      if (businessId && categoryId) {
        results = await getProductsByBusinessAndCategoryId(businessId, categoryId);
      } else if (businessId) {
        results = await getProductsByBusinessId(businessId);
      } else if (categoryId) {
        results = await getProductsByCategoryId(categoryId);
      }
      setProducts(Array.from(results).map((item: any) => ({ ...item })));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [businessId, categoryId]);

  const createProduct = async (product: Product) => {
    if (!businessId && !categoryId) {
      setError('No businessId or categoryId provided');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Always include businessId and categoryId on creation if available
      await addProduct({ ...product, businessId, categoryId });
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
