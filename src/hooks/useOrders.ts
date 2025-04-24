import { useState, useCallback, useEffect, useRef } from 'react';
import { Order } from '../types';
import { OrderStatus } from '../screens/Categories/Orders/StatusHeaderBar';
import { 
  getAllOrders, 
  getOrderById, 
  updateOrderStatus, 
  addOrderNote
} from '../localdb/services/orderService';

/**
 * Custom hook to fetch and manage orders
 */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track component mount state
  const isMountedRef = useRef(true);
  
  // Calculate status counts
  const statusCounts = useCallback(() => {
    const counts: Record<OrderStatus, number> = {
      ALL: orders.length,
      CREATED: 0,
      PROCESSING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };
    
    orders.forEach(order => {
      if (counts[order.status as OrderStatus] !== undefined) {
        counts[order.status as OrderStatus]++;
      }
    });
    
    return counts;
  }, [orders]);
  
  // Function to safely fetch orders
  const fetchOrders = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await getAllOrders();
      
      if (isMountedRef.current) {
        setOrders(results);
      }
    } catch (err: any) {
      console.error('[useOrders] Error fetching orders:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to fetch orders');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);
  
  // Function to update order status
  const updateStatus = useCallback(async (orderId: string, status: OrderStatus, employeeName?: string) => {
    try {
      setIsLoading(true);
      
      // Create note about status change
      const now = new Date();
      const formattedDate = now.toLocaleString();
      const note = `Status changed to ${status}${employeeName ? ` by ${employeeName}` : ''} at ${formattedDate}`;
      
      // Update status in database
      await updateOrderStatus(orderId, status, note);
      
      // Refresh orders list
      await fetchOrders();
      
      return true;
    } catch (err: any) {
      console.error('[useOrders] Error updating order status:', err);
      setError(err.message || 'Failed to update order status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders]);
  
  // Function to add a note to an order
  const addNote = useCallback(async (orderId: string, note: string) => {
    try {
      setIsLoading(true);
      
      // Add note to database
      await addOrderNote(orderId, note);
      
      // Refresh orders list
      await fetchOrders();
      
      return true;
    } catch (err: any) {
      console.error('[useOrders] Error adding order note:', err);
      setError(err.message || 'Failed to add order note');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders]);
  
  // Initial data fetch on mount
  useEffect(() => {
    console.log('[useOrders] Mounting hook');
    isMountedRef.current = true;
    fetchOrders();
    
    // Cleanup function on unmount
    return () => {
      console.log('[useOrders] Unmounting hook, cleaning up');
      isMountedRef.current = false;
      // Clear orders on unmount to avoid stale refs
      setOrders([]);
    };
  }, [fetchOrders]);
  
  return {
    orders,
    isLoading,
    error,
    statusCounts: statusCounts(),
    refetch: fetchOrders,
    updateStatus,
    addNote
  };
}