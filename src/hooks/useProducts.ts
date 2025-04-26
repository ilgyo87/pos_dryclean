// src/hooks/useProducts.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { 
  getAllProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsByBusinessId, 
  getProductsByBusinessAndCategoryId, 
  getProductsByCategoryId 
} from '../localdb/services/productService';

export function useProducts(businessId?: string, categoryId?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track if component is mounted
  const isMountedRef = useRef(true);

  const fetchProducts = useCallback(async () => {
    // Skip if component is unmounted
    if (!isMountedRef.current) return;
    
    // Skip if we don't have necessary IDs
    if (!businessId && !categoryId) {
      console.log('[useProducts] No businessId or categoryId provided, skipping fetch');
      setProducts([]);
      setError('No businessId or categoryId provided');
      return;
    }
    
    console.log(`[useProducts] Fetching products - businessId: ${businessId}, categoryId: ${categoryId}`);
    setLoading(true);
    setError(null);
    
    try {
      let results: Product[] = [];
      
      if (businessId && categoryId) {
        console.log(`[useProducts] Fetching by business and category: ${businessId}, ${categoryId}`);
        results = await getProductsByBusinessAndCategoryId(businessId, categoryId);
      } else if (businessId) {
        console.log(`[useProducts] Fetching by business: ${businessId}`);
        results = await getProductsByBusinessId(businessId);
      } else if (categoryId) {
        console.log(`[useProducts] Fetching by category: ${categoryId}`);
        results = await getProductsByCategoryId(categoryId);
      }
      
      // Convert Realm Results to plain JS objects and log counts for debugging
      const plainResults = Array.from(results).map((item: any) => ({ ...item }));
      console.log(`[useProducts] Fetched ${plainResults.length} products`);
      
      if (isMountedRef.current) {
        setProducts(plainResults);
      }
    } catch (err: any) {
      console.error('[useProducts] Error fetching products:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch products');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [businessId, categoryId]);

  const createProduct = async (product: Product) => {
    console.log('[useProducts] Creating product:', product);
    if (!product.businessId && !businessId) {
      setError('No businessId provided for product');
      return;
    }
    
    if (!product.categoryId && !categoryId) {
      setError('No categoryId provided for product');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure the product has businessId and categoryId
      const productToCreate: Product = {
        ...product,
        businessId: product.businessId || businessId,
        categoryId: product.categoryId || categoryId,
      };
      
      console.log('[useProducts] Creating product with:', productToCreate);
      await addProduct(productToCreate);
      await fetchProducts();
    } catch (err: any) {
      console.error('[useProducts] Error creating product:', err);
      setError(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const editProduct = async (id: string, updates: Partial<Product>) => {
    console.log(`[useProducts] Editing product ${id}:`, updates);
    setLoading(true);
    setError(null);
    
    try {
      await updateProduct(id, updates);
      await fetchProducts();
    } catch (err: any) {
      console.error('[useProducts] Error updating product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (id: string) => {
    console.log(`[useProducts] Removing product: ${id}`);
    setLoading(true);
    setError(null);
    
    try {
      await deleteProduct(id);
      await fetchProducts();
    } catch (err: any) {
      console.error('[useProducts] Error deleting product:', err);
      setError(err.message || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // Set up mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initial fetch
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