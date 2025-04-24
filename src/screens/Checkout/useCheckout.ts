// src/screens/Checkout/useCheckout.ts
import { useState } from 'react';
import { Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { getRealm } from '../../localdb/getRealm';
import { OrderItem } from './OrderSummary';
import { Product } from '../../types';

export interface CheckoutParams {
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  businessId: string;
  customerId: string;
  employeeId: string;
  pickupDate?: Date | null;
  notifications?: {
    printReceipt: boolean;
    notifyTxt: boolean;
    notifyEmail: boolean;
  };
}

export interface CheckoutResult {
  success: boolean;
  error?: string;
  order?: {
    _id: string;
    total: number;
    status: string;
  };
  products?: Product[];
}

export default function useCheckout() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async (params: CheckoutParams): Promise<CheckoutResult> => {
    const {
      items,
      total,
      paymentMethod,
      businessId,
      customerId,
      employeeId,
      pickupDate,
      notifications
    } = params;

    setSaving(true);
    setError(null);
    
    try {
      console.log('[CHECKOUT] Starting checkout process');
      console.log('[CHECKOUT] Items count:', items.length);
      
      const now = new Date();
      const orderId = uuidv4();
      const productEntries: Product[] = [];
      
      // Create separate product entries for each quantity
      items.forEach(item => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          // Generate only a unique orderItemId for each instance
          // but keep the original product ID
          const orderItemId = uuidv4();
          
          const productEntry: Product = {
            _id: item._id, // Keep original product ID to identify product type
            name: item.name,
            price: item.price || 0,
            discount: item.discount || 0,
            additionalPrice: item.additionalPrice || 0,
            description: item.description || '',
            categoryId: item.categoryId || '',
            businessId,
            customerId,
            employeeId,
            orderId,            // Link to the order
            orderItemId,        // Unique ID for this product instance
            starch: item.options?.starch,
            pressOnly: item.options?.pressOnly,
            imageName: item.imageName,
            imageUrl: item.imageUrl,
            notes: item.options?.notes ? [item.options.notes] : [],
            status: 'CREATED',
            createdAt: now,
            updatedAt: now,
          };
          
          productEntries.push(productEntry);
          console.log(`[CHECKOUT] Creating product ${i+1} of ${item.quantity} for ${item.name}`);
        }
      });
      
      console.log('[CHECKOUT] Getting Realm instance');
      const realm = await getRealm();
      
      console.log('[CHECKOUT] Writing to Realm');
      const realmProducts: any[] = [];
      
      realm.write(() => {
        // First create all the product items
        console.log('[CHECKOUT] Creating product entries in Realm');
        
        productEntries.forEach(prod => {
          console.log(`[CHECKOUT] Adding to order: ${prod.name} (Product ID: ${prod._id}, OrderItem ID: ${prod.orderItemId})`);
          
          // Create a product reference in the order with the unique orderItemId
          // We'll use create() which will create a new object even if the _id already exists
          const productObject = {
            _id: prod.orderItemId, // Use orderItemId as the unique identifier
            productId: prod._id,   // Store the original product ID
            name: prod.name,
            price: prod.price,
            discount: prod.discount,
            additionalPrice: prod.additionalPrice,
            description: prod.description,
            categoryId: prod.categoryId,
            businessId,
            customerId,
            employeeId,
            orderId,
            starch: prod.starch,
            pressOnly: prod.pressOnly,
            imageName: prod.imageName,
            imageUrl: prod.imageUrl,
            notes: Array.isArray(prod.notes) ? prod.notes : [],
            status: 'CREATED',
            createdAt: now,
            updatedAt: now,
          };
          
          // Create the product in Realm
          const realmProduct = realm.create('Product', productObject);
          realmProducts.push(realmProduct);
        });
        
        // Create the order
        console.log('[CHECKOUT] Creating order with product references');
        console.log(`[CHECKOUT] Order ID: ${orderId}`);
        console.log(`[CHECKOUT] Products count: ${realmProducts.length}`);
        
        realm.create('Order', {
          _id: orderId,
          businessId,
          customerId,
          employeeId,
          items: realmProducts, // Pass the array of Realm Product objects
          paymentMethod,
          additionalPrice: 0,
          discount: 0,
          total,
          notes: [],
          pickupDate: pickupDate || undefined,
          status: 'CREATED',
          createdAt: now,
          updatedAt: now,
        });
      });
      
      // Log detailed information for debugging
      console.log('[CHECKOUT] ======== ORDER CREATION COMPLETE ========');
      console.log('[CHECKOUT] Order created with ID:', orderId);
      console.log('[CHECKOUT] Total products created:', productEntries.length);
      console.log('[CHECKOUT] Payment method:', paymentMethod);
      console.log('[CHECKOUT] Order total:', total.toFixed(2));
      console.log('[CHECKOUT] Customer ID:', customerId);
      console.log('[CHECKOUT] Employee ID:', employeeId);
      console.log('[CHECKOUT] Pickup date:', pickupDate ? pickupDate.toISOString() : 'Not set');
      
      // Log basic details for each created product
      console.log('[CHECKOUT] Products summary:');
      productEntries.forEach((prod, index) => {
        console.log(`[CHECKOUT] Product ${index + 1}: ${prod.name} - $${prod.price} (Product ID: ${prod._id}, OrderItem ID: ${prod.orderItemId})`);
      });
      
      console.log('[CHECKOUT] ======== ORDER CREATION COMPLETE ========');
      
      setSaving(false);
      return { 
        success: true,
        order: { _id: orderId, total, status: 'CREATED' },
        products: productEntries
      };
    } catch (e: any) {
      console.error('[CHECKOUT] Error during checkout:', e);
      setError(e.message || 'Unknown error');
      setSaving(false);
      Alert.alert('Checkout Error', e.message || 'An error occurred while processing your order.');
      return { 
        success: false, 
        error: e.message || 'Unknown error' 
      };
    }
  };

  return { checkout, saving, error };
}