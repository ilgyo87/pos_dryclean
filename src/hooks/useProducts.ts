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
    
    // More verbose logging for debugging
    console.log(`[useProducts] Starting fetch with businessId: '${businessId}' (${typeof businessId}), categoryId: '${categoryId}' (${typeof categoryId})`);
    
    // Skip if we don't have necessary IDs, but be more lenient for businessId (common required param)
    if ((!businessId || businessId === '') && (!categoryId || categoryId === '')) {
      console.warn('[useProducts] No businessId or categoryId provided, skipping fetch');
      setProducts([]);
      setError('No businessId or categoryId provided');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let results: Product[] = [];
      
      if (businessId && businessId !== '' && categoryId && categoryId !== '') {
        console.log(`[useProducts] Fetching by business and category: '${businessId}', '${categoryId}'`);
        results = await getProductsByBusinessAndCategoryId(businessId, categoryId);
      } else if (businessId && businessId !== '') {
        console.log(`[useProducts] Fetching by business: '${businessId}'`);
        results = await getProductsByBusinessId(businessId);
      } else if (categoryId && categoryId !== '') {
        console.log(`[useProducts] Fetching by category: '${categoryId}'`);
        results = await getProductsByCategoryId(categoryId);
      } else {
        console.warn('[useProducts] No valid parameters for fetching products');
        setProducts([]);
        setError('Invalid parameters for fetching products');
        setLoading(false);
        return;
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
    console.log('[useProducts] Creating product:', product.name);
    
    // Enhanced validation with detailed logging
    if (!product.businessId && !businessId) {
      console.error('[useProducts] No businessId provided for product:', 
        { productBizId: product.businessId, hookBizId: businessId });
      setError('No businessId provided for product');
      return;
    }
    
    if (!product.categoryId && !categoryId) {
      console.error('[useProducts] No categoryId provided for product:', 
        { productCatId: product.categoryId, hookCatId: categoryId });
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
      
      console.log('[useProducts] Creating product with:', {
        name: productToCreate.name,
        id: productToCreate._id,
        businessId: productToCreate.businessId,
        categoryId: productToCreate.categoryId,
        price: productToCreate.price
      });
      
      await addProduct(productToCreate);
      console.log(`[useProducts] Successfully created product: ${productToCreate.name}`);
      
      // Refresh products list
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