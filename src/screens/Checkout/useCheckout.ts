// Updated useCheckout.ts with proper Realm implementation
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Realm from 'realm';
import { OrderSchema, ProductSchema } from '../../localdb/schemas';
import { OrderItem } from './OrderSummary';
import { Alert } from 'react-native';

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

export default function useCheckout() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async ({
    items,
    total,
    paymentMethod,
    businessId,
    customerId,
    employeeId,
    pickupDate,
    notifications,
  }: CheckoutParams) => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('[CHECKOUT] Starting checkout process');
      console.log('[CHECKOUT] Items:', JSON.stringify(items));
      
      const now = new Date();
      const orderId = uuidv4();
      let productList: any[] = [];
      
      // Create separate product entries for each quantity
      items.forEach(item => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          const productId = uuidv4();
          // Always generate a unique orderItemId for each product instance
          const orderItemId = uuidv4();
          
          const newProduct = {
            ...item,
            _id: productId, // unique product instance
            orderItemId,    // unique order item instance
            businessId,
            customerId,
            employeeId,
            orderId,
            starch: item.options?.starch || 'none',
            pressOnly: item.options?.pressOnly || false,
            imageName: item.imageName || '',
            imageUrl: item.imageUrl || '',
            notes: item.options?.notes ? [item.options.notes] : [],
            status: 'CREATED',
            createdAt: now,
            updatedAt: now,
          };
          
          productList.push(newProduct);
          console.log(`[CHECKOUT] Creating product ${i+1} of ${item.quantity} for ${item.name}`);
        }
      });
      
      const orderObj = {
        _id: orderId,
        businessId,
        customerId,
        employeeId,
        items: productList,
        paymentMethod,
        additionalPrice: 0,
        discount: 0,
        total,
        notes: [],
        pickupDate: pickupDate || undefined,
        status: 'CREATED',
        createdAt: now,
        updatedAt: now,
      };
      
      console.log('[CHECKOUT] Opening Realm');
      const realm = await Realm.open({ 
        schema: [OrderSchema, ProductSchema],
        schemaVersion: 1,
      });
      
      console.log('[CHECKOUT] Writing to Realm');
      realm.write(() => {
        console.log('[CHECKOUT] Creating products');
        productList.forEach(prod => {
          console.log(`[CHECKOUT] Creating product: ${prod.name} (${prod._id}, orderItemId: ${prod.orderItemId})`);
          realm.create('Product', prod);
        });
        
        console.log('[CHECKOUT] Creating order');
        realm.create('Order', orderObj);
      });
      
      console.log('[CHECKOUT] Closing Realm');
      realm.close();
      
      console.log('[CHECKOUT] Checkout complete');
      console.log('[CHECKOUT] Order:', JSON.stringify(orderObj));
      
      setSaving(false);
      return { 
        order: orderObj, 
        products: productList,
        success: true 
      };
    } catch (e: any) {
      console.error('[CHECKOUT] Error during checkout:', e);
      setError(e.message || 'Unknown error');
      setSaving(false);
      Alert.alert('Checkout Error', e.message || 'An error occurred while processing your order.');
      return { success: false, error: e.message };
    }
  };

  return { checkout, saving, error };
}