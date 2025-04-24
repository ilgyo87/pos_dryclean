import { getRealm } from '../getRealm';
import { Order, Product } from '../../types';

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