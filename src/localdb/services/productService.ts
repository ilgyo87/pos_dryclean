// src/localdb/services/productService.ts
import { getRealm } from '../getRealm';
import { Product } from '../../types';

/**
 * Maps a Realm product object to a plain JavaScript object
 * to prevent holding references to Realm objects
 */
function mapProduct(item: any): Product {
  try {
    // Ensure we have a valid product to map
    if (!item) {
      console.warn('[productService] Received null or undefined product');
      return null as any;
    }
    
    // Create a detached copy of the product
    const product: Product = {
      _id: String(item._id || ''),
      name: String(item.name || ''),
      price: typeof item.price === 'number' ? item.price : 0,
      discount: typeof item.discount === 'number' ? item.discount : 0,
      additionalPrice: typeof item.additionalPrice === 'number' ? item.additionalPrice : 0,
      description: String(item.description || ''),
      categoryId: String(item.categoryId || ''),
      businessId: String(item.businessId || ''),
      customerId: String(item.customerId || ''),
      employeeId: String(item.employeeId || ''),
      orderId: String(item.orderId || ''),
      orderItemId: String(item.orderItemId || ''),
      starch: item.starch,
      pressOnly: Boolean(item.pressOnly),
      imageName: String(item.imageName || ''),
      imageUrl: String(item.imageUrl || ''),
      notes: Array.isArray(item.notes) ? [...item.notes] : [],
      createdAt: new Date(item.createdAt || Date.now()),
      updatedAt: new Date(item.updatedAt || Date.now()),
    };
    
    return product;
  } catch (error) {
    console.error('[productService] Error mapping product:', error);
    // Return minimal valid product to avoid errors
    return {
      _id: String(item._id || Date.now()),
      name: 'Error',
      price: 0,
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Product;
  }
}

/**
 * Add a new product to the database
 */
export async function addProduct(product: Product): Promise<Product> {
  console.log('[productService] Adding product:', product);
  
  // Validate required fields
  if (!product._id) {
    throw new Error('Product must have an _id');
  }
  
  if (!product.name) {
    throw new Error('Product must have a name');
  }
  
  const realm = await getRealm();
  let createdProduct;
  
  try {
    realm.write(() => {
      // Make sure notes is an array
      const productToCreate = {
        ...product,
        notes: Array.isArray(product.notes) ? product.notes : [],
      };
      
      console.log('[productService] Creating product in Realm:', productToCreate);
      createdProduct = realm.create('Product', productToCreate);
    });
    
    const mappedProduct = mapProduct(createdProduct);
    console.log('[productService] Successfully created product:', mappedProduct);
    return mappedProduct;
  } catch (error) {
    console.error('[productService] Error adding product:', error);
    throw error;
  }
}

/**
 * Get all products from the database
 */
export async function getAllProducts(): Promise<Product[]> {
  const realm = await getRealm();
  try {
    const products = realm.objects('Product');
    console.log(`[productService] Found ${products.length} products`);
    return Array.from(products).map(mapProduct);
  } catch (error) {
    console.error('[productService] Error getting all products:', error);
    return [];
  }
}

/**
 * Get a product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!id) {
    console.warn('[productService] getProductById called with no ID');
    return null;
  }
  
  const realm = await getRealm();
  try {
    const product = realm.objectForPrimaryKey('Product', id);
    return product ? mapProduct(product) : null;
  } catch (error) {
    console.error(`[productService] Error getting product with ID ${id}:`, error);
    return null;
  }
}

/**
 * Update a product in the database
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  if (!id) {
    console.warn('[productService] updateProduct called with no ID');
    return null;
  }
  
  console.log(`[productService] Updating product ${id}:`, updates);
  const realm = await getRealm();
  let updatedProduct;
  
  try {
    realm.write(() => {
      const product = realm.objectForPrimaryKey('Product', id);
      
      if (!product) {
        console.warn(`[productService] Product with ID ${id} not found`);
        return null;
      }
      
      Object.keys(updates).forEach(key => {
        if (key !== '_id' && updates[key as keyof Product] !== undefined) {
          (product as any)[key] = updates[key as keyof Product];
        }
      });
      
      updatedProduct = product;
    });
    
    const mappedProduct = updatedProduct ? mapProduct(updatedProduct) : null;
    console.log(`[productService] Successfully updated product ${id}`);
    return mappedProduct;
  } catch (error) {
    console.error(`[productService] Error updating product ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a product from the database
 */
export async function deleteProduct(id: string): Promise<boolean> {
  if (!id) {
    console.warn('[productService] deleteProduct called with no ID');
    return false;
  }
  
  console.log(`[productService] Deleting product ${id}`);
  const realm = await getRealm();
  let deleted = false;
  
  try {
    realm.write(() => {
      const product = realm.objectForPrimaryKey('Product', id);
      
      if (!product) {
        console.warn(`[productService] Product with ID ${id} not found`);
        return false;
      }
      
      realm.delete(product);
      deleted = true;
    });
    
    console.log(`[productService] Successfully deleted product ${id}`);
    return deleted;
  } catch (error) {
    console.error(`[productService] Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Get products by category ID
 */
export async function getProductsByCategoryId(categoryId: string): Promise<Product[]> {
  if (!categoryId) {
    console.warn('[productService] getProductsByCategoryId called with no categoryId');
    return [];
  }
  
  console.log(`[productService] Getting products for category ${categoryId}`);
  const realm = await getRealm();
  
  try {
    const products = realm.objects('Product').filtered('categoryId == $0', categoryId);
    console.log(`[productService] Found ${products.length} products for category ${categoryId}`);
    
    // Log sample product for debugging if available
    if (products.length > 0) {
      console.log('[productService] Sample product:', products[0]);
    }
    
    return Array.from(products).map(mapProduct);
  } catch (error) {
    console.error(`[productService] Error getting products for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Get products by business and category ID
 */
export async function getProductsByBusinessAndCategoryId(businessId: string, categoryId: string): Promise<Product[]> {
  if (!businessId || !categoryId) {
    console.warn('[productService] getProductsByBusinessAndCategoryId called with missing parameters');
    return [];
  }
  
  console.log(`[productService] Getting products for business ${businessId} and category ${categoryId}`);
  const realm = await getRealm();
  
  try {
    const products = realm.objects('Product').filtered('businessId == $0 && categoryId == $1', businessId, categoryId);
    console.log(`[productService] Found ${products.length} products for business ${businessId} and category ${categoryId}`);
    
    // Log sample product for debugging if available
    if (products.length > 0) {
      console.log('[productService] Sample product:', products[0]);
    }
    
    return Array.from(products).map(mapProduct);
  } catch (error) {
    console.error(`[productService] Error getting products for business ${businessId} and category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Get products by business ID
 */
export async function getProductsByBusinessId(businessId: string): Promise<Product[]> {
  if (!businessId) {
    console.warn('[productService] getProductsByBusinessId called with no businessId');
    return [];
  }
  
  console.log(`[productService] Getting products for business ${businessId}`);
  const realm = await getRealm();
  
  try {
    const products = realm.objects('Product').filtered('businessId == $0', businessId);
    console.log(`[productService] Found ${products.length} products for business ${businessId}`);
    
    // Log sample product for debugging if available
    if (products.length > 0) {
      console.log('[productService] Sample product:', products[0]);
    }
    
    return Array.from(products).map(mapProduct);
  } catch (error) {
    console.error(`[productService] Error getting products for business ${businessId}:`, error);
    return [];
  }
}