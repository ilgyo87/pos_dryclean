import { getRealm } from '../getRealm';
import { Order, Product } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Map a Realm order object to a plain JavaScript object
 * to prevent holding references to Realm objects
 */
function mapOrder(item: any): Order {
  if (!item) {
    console.warn('[mapOrder] Received null or undefined item');
    return null as any;
  }
  
  try {
    // Helper to safely get property from Realm object
    const getProperty = (obj: any, prop: string) => {
      try {
        // Try direct property access first
        if (prop in obj) {
          return obj[prop];
        }
        
        // For Realm objects with custom accessors
        if (typeof obj.get === 'function') {
          return obj.get(prop);
        }
        
        return undefined;
      } catch (err) {
        console.warn(`[mapOrder] Error accessing property ${prop}:`, err);
        return undefined;
      }
    };
    
    // Map the order items
    let orderItems: Product[] = [];
    try {
      const items = getProperty(item, 'items');
      if (items && typeof items.map === 'function') {
        orderItems = items.map((product: any) => ({
          _id: String(getProperty(product, '_id') || ''),
          name: String(getProperty(product, 'name') || ''),
          price: Number(getProperty(product, 'price') || 0),
          discount: Number(getProperty(product, 'discount') || 0),
          additionalPrice: Number(getProperty(product, 'additionalPrice') || 0),
          description: String(getProperty(product, 'description') || ''),
          categoryId: String(getProperty(product, 'categoryId') || ''),
          businessId: String(getProperty(product, 'businessId') || ''),
          customerId: String(getProperty(product, 'customerId') || ''),
          employeeId: String(getProperty(product, 'employeeId') || ''),
          orderId: String(getProperty(product, 'orderId') || ''),
          orderItemId: String(getProperty(product, 'orderItemId') || ''),
          starch: getProperty(product, 'starch'),
          pressOnly: Boolean(getProperty(product, 'pressOnly')),
          imageName: String(getProperty(product, 'imageName') || ''),
          imageUrl: String(getProperty(product, 'imageUrl') || ''),
          notes: Array.isArray(getProperty(product, 'notes')) ? [...getProperty(product, 'notes')] : [],
          status: String(getProperty(product, 'status') || ''),
          createdAt: getProperty(product, 'createdAt') ? new Date(getProperty(product, 'createdAt')) : new Date(),
          updatedAt: getProperty(product, 'updatedAt') ? new Date(getProperty(product, 'updatedAt')) : undefined,
        }));
      }
    } catch (err) {
      console.error('[mapOrder] Error mapping order items:', err);
    }
    
    // Get notes property and ensure it's an array of strings
    let orderNotes: string[] = [];
    try {
      const notes = getProperty(item, 'notes');
      if (Array.isArray(notes)) {
        orderNotes = notes.map(note => String(note || ''));
      }
    } catch (err) {
      console.error('[mapOrder] Error mapping order notes:', err);
    }
    
    // Create a completely detached copy of the order
    const order: Order = {
      _id: String(getProperty(item, '_id') || ''),
      businessId: String(getProperty(item, 'businessId') || ''),
      customerId: String(getProperty(item, 'customerId') || ''),
      employeeId: String(getProperty(item, 'employeeId') || ''),
      items: orderItems,
      paymentMethod: String(getProperty(item, 'paymentMethod') || ''),
      additionalPrice: Number(getProperty(item, 'additionalPrice') || 0),
      discount: Number(getProperty(item, 'discount') || 0),
      total: Number(getProperty(item, 'total') || 0),
      notes: orderNotes,
      pickupDate: getProperty(item, 'pickupDate') ? new Date(getProperty(item, 'pickupDate')) : undefined,
      status: String(getProperty(item, 'status') || 'CREATED'),
      createdAt: getProperty(item, 'createdAt') ? new Date(getProperty(item, 'createdAt')) : new Date(),
      updatedAt: getProperty(item, 'updatedAt') ? new Date(getProperty(item, 'updatedAt')) : undefined,
      
      // Add additional properties specific to the order screen
      customerName: getProperty(item, 'customerName'),
      employeeName: getProperty(item, 'employeeName'),
    };
    
    return order;
  } catch (e) {
    console.error('[mapOrder] Error mapping order:', e);
    // Return a minimal valid order to avoid errors
    return {
      _id: typeof item._id === 'string' ? item._id : String(Date.now()),
      businessId: '',
      customerId: '',
      employeeId: '',
      items: [],
      paymentMethod: '',
      total: 0,
      notes: [],
      status: 'CREATED',
      createdAt: new Date()
    } as any;
  }
}

/**
 * Create a new order in the local database
 * @param orderData The order data including items, customer, employee, etc.
 * @returns The created order
 */
export async function createOrder(orderData: {
  customer: any;
  items: any[];
  total: number;
  pickupDate: Date | null;
  employeeId: string;
  employee?: { firstName?: string; lastName?: string };
  businessId: string;
  paymentMethod: string;
}): Promise<Order> {
  const realm = await getRealm();
  let createdOrder: any = null;
  
  try {
    console.log('[ORDER][LOCAL] Creating new order');
    
    // Generate order ID
    const orderId = uuidv4();
    
    // Current date/time
    const now = new Date();
    
    // Prepare order notes if employee is specified
    const employeeName = orderData.employee && orderData.employee.firstName 
      ? `${orderData.employee.firstName} ${orderData.employee.lastName || ''}`
      : `Employee ID: ${orderData.employeeId}`;
    
    const orderCreatedNote = `Order created by ${employeeName} at ${now.toLocaleString()}`;
    
    // Create orderItems first
    const orderItems: any[] = [];
    
    realm.write(() => {
      console.log(`[ORDER][LOCAL] Creating ${orderData.items.length} order items`);
      
      // Create OrderItems
      orderData.items.forEach((item, index) => {
        const orderItemId = uuidv4();
        
        console.log(`[ORDER][LOCAL] Creating order item ${index + 1}: ${item.name}`);
        
        // Get the starch value, ensuring it's a valid option
        let starchValue: 'none' | 'light' | 'medium' | 'heavy' | undefined = undefined;
        if (item.options?.starch) {
          const starch = item.options.starch;
          if (starch === 'none' || starch === 'light' || starch === 'medium' || starch === 'heavy') {
            starchValue = starch;
          }
        }
        
        // Create OrderItem in Realm
        const orderItem = realm.create('OrderItem', {
          _id: orderItemId,
          orderId: orderId,
          productId: item._id,
          name: item.name,
          price: typeof item.price === 'number' ? item.price : 0,
          discount: typeof item.discount === 'number' ? item.discount : 0,
          description: item.description || '',
          businessId: orderData.businessId,
          customerId: orderData.customer._id,
          employeeId: orderData.employeeId,
          paymentMethod: orderData.paymentMethod, // Fix: add paymentMethod for schema
          total: (typeof item.price === 'number' ? item.price : 0) + (typeof item.additionalPrice === 'number' ? item.additionalPrice : 0) - (typeof item.discount === 'number' ? item.discount : 0),
          starch: starchValue,
          pressOnly: !!item.options?.pressOnly,
          notes: Array.isArray(item.options?.notes)
            ? item.options.notes.map((n: any) => String(n))
            : [],
          status: 'CREATED',
          createdAt: now,
          updatedAt: now
        });
        console.log('[ORDER][LOCAL] Created OrderItem:', JSON.stringify(orderItem, null, 2));
        orderItems.push(orderItem);
      });
      
      // Create the order with references to the created items
      console.log(`[ORDER][LOCAL] Creating order with ID: ${orderId}`);
      
      createdOrder = realm.create('Order', {
        _id: orderId,
        businessId: orderData.businessId,
        customerId: orderData.customer._id,
        employeeId: orderData.employeeId,
        items: orderItems,
        paymentMethod: orderData.paymentMethod,
        additionalPrice: 0,
        discount: 0,
        total: orderData.total,
        notes: [orderCreatedNote],
        pickupDate: orderData.pickupDate || undefined,
        status: 'CREATED',
        createdAt: now,
        updatedAt: now
      });
    });
    
    console.log('[ORDER][LOCAL] Order creation successful');
    console.log(`[ORDER][LOCAL] Order ID: ${orderId}`);
    console.log(`[ORDER][LOCAL] Order items: ${orderItems.length}`);
    console.log(`[ORDER][LOCAL] Total: $${orderData.total.toFixed(2)}`);
    console.log(`[ORDER][LOCAL] Customer: ${orderData.customer.firstName} ${orderData.customer.lastName}`);
    console.log('[ORDER][LOCAL] Created Order object:', JSON.stringify(createdOrder, null, 2));
    
    // Map the created order to a plain JS object before returning
    return mapOrder(createdOrder);
  } catch (error) {
    console.error('[ORDER][LOCAL] Error creating order:', error);
    throw error;
  }
}

/**
 * Get all orders
 */
export async function getAllOrders() {
  const realm = await getRealm();
  try {
    const orders = realm.objects('Order');
    
    // Loop through orders and map customer and employee names
    const ordersWithNames = await Promise.all(Array.from(orders).map(async (order: any) => {
      try {
        // Get customer and employee names
        const customer = realm.objectForPrimaryKey('Customer', order.customerId);
        const employee = realm.objectForPrimaryKey('Employee', order.employeeId);
        
        const customerName = customer 
          ? `${customer.firstName} ${customer.lastName}`
          : undefined;
          
        const employeeName = employee
          ? `${employee.firstName} ${employee.lastName}`
          : undefined;
        
        // Return a new object with the additional properties
        return {
          ...order,
          customerName,
          employeeName
        };
      } catch (err) {
        console.error('[getAllOrders] Error getting names:', err);
        return order;
      }
    }));
    
    // Map to plain JS objects
    return ordersWithNames.map(mapOrder);
  } catch (e) {
    console.error('[ORDER][LOCAL] Error getting all orders:', e);
    return [];
  }
}

/**
 * Get an order by ID
 */
export async function getOrderById(id: string) {
  const realm = await getRealm();
  try {
    const order = realm.objectForPrimaryKey('Order', id);
    if (!order) return null;
    
    // Get customer and employee names
    try {
      const customer = realm.objectForPrimaryKey('Customer', order.customerId);
      const employee = realm.objectForPrimaryKey('Employee', order.employeeId);
      
      const orderWithNames = {
        ...order,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : undefined,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : undefined
      };
      
      return mapOrder(orderWithNames);
    } catch (err) {
      console.error('[getOrderById] Error getting names:', err);
      return mapOrder(order);
    }
  } catch (e) {
    console.error('[ORDER][LOCAL] Error getting order by ID:', e);
    return null;
  }
}

/**
 * Update an order's status
 */
export async function updateOrderStatus(id: string, status: string, note?: string) {
  const realm = await getRealm();
  let updatedOrder;
  try {
    realm.write(() => {
      const order = realm.objectForPrimaryKey('Order', id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date();
        
        // Add note if provided
        if (note) {
          // Ensure notes is an array
          if (!order.notes) {
            order.notes = [];
          } else if (!Array.isArray(order.notes)) {
            // If order.notes exists but is not an array, create a new array
            const existingNote = String(order.notes || '');
            order.notes = existingNote ? [existingNote] : [];
          }
          
          // Now we can safely push to the notes array
          (order.notes as string[]).push(note);
        }
        
        updatedOrder = order;
      }
    });
    return updatedOrder ? mapOrder(updatedOrder) : null;
  } catch (e) {
    console.error('[ORDER][LOCAL] Error updating order status:', e);
    throw e;
  }
}

/**
 * Add a note to an order
 */
export async function addOrderNote(id: string, note: string) {
  const realm = await getRealm();
  let updatedOrder;
  try {
    realm.write(() => {
      const order = realm.objectForPrimaryKey('Order', id);
      if (order) {
        // Ensure notes is an array
        if (!order.notes) {
          order.notes = [note];
        } else if (!Array.isArray(order.notes)) {
          // If order.notes exists but is not an array, create a new array
          const existingNote = String(order.notes || '');
          order.notes = existingNote ? [existingNote, note] : [note];
        } else {
          // If it's already an array, push the new note
          order.notes.push(note);
        }
        
        order.updatedAt = new Date();
        updatedOrder = order;
      }
    });
    return updatedOrder ? mapOrder(updatedOrder) : null;
  } catch (e) {
    console.error('[ORDER][LOCAL] Error adding order note:', e);
    throw e;
  }
}

/**
 * Update an order's pickup date
 */
export async function updateOrderPickupDate(id: string, pickupDate: Date) {
  const realm = await getRealm();
  let updatedOrder;
  try {
    realm.write(() => {
      const order = realm.objectForPrimaryKey('Order', id);
      if (order) {
        order.pickupDate = pickupDate;
        order.updatedAt = new Date();
        updatedOrder = order;
      }
    });
    return updatedOrder ? mapOrder(updatedOrder) : null;
  } catch (e) {
    console.error('[ORDER][LOCAL] Error updating order pickup date:', e);
    throw e;
  }
}

/**
 * Delete an order
 */
export async function deleteOrder(id: string) {
  const realm = await getRealm();
  let deleted = false;
  try {
    realm.write(() => {
      const order = realm.objectForPrimaryKey('Order', id);
      if (order) {
        // Delete related products first
        const products = realm.objects('Product').filtered('orderId == $0', id);
        realm.delete(products);
        
        // Delete the order
        realm.delete(order);
        deleted = true;
      }
    });
    return deleted;
  } catch (e) {
    console.error('[ORDER][LOCAL] Error deleting order:', e);
    throw e;
  }
}