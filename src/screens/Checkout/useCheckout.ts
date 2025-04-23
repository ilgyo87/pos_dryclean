import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Realm from 'realm';
import { OrderSchema, ProductSchema } from '../../localdb/schemas';
import { Product } from '../../types';
import { OrderItem } from './OrderSummary';

export interface CheckoutParams {
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  businessId: string;
  customerId: string;
  employeeId: string;
}

export default function useCheckout() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async ({ items, total, paymentMethod, businessId, customerId, employeeId }: CheckoutParams) => {
    setSaving(true);
    setError(null);
    try {
      const now = new Date();
      const orderId = uuidv4();
      let productList: OrderItem[] = [];
      items.forEach(item => {
        for (let i = 0; i < (item.quantity || 1); i++) {
          const productId = uuidv4();
          const orderItemId = uuidv4();
          productList.push({
            ...item,
            _id: productId,
            orderId,
            orderItemId,
            employeeId,
            customerId,
            businessId,
            status: 'CREATED',
            createdAt: now,
            updatedAt: now,
          });
        }
      });
      const orderObj = {
        _id: orderId,
        businessId,
        customerId,
        employeeId,
        items: productList,
        paymentMethod,
        total,
        notes: [],
        status: 'CREATED',
        createdAt: now,
        updatedAt: now,
      };
      const realm = await Realm.open({ schema: [OrderSchema, ProductSchema] });
      realm.write(() => {
        productList.forEach(prod => realm.create('Product', prod));
        realm.create('Order', orderObj);
      });
      realm.close();
      setSaving(false);
      return { order: orderObj, products: productList };
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setSaving(false);
      throw e;
    }
  };

  return { checkout, saving, error };
}
