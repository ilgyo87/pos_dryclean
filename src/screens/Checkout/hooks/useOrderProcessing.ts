import { useState } from "react";
import { Alert } from "react-native";
import { useDispatch } from "react-redux";
import { createOrder, createOrderItem } from "../../../store/slices/OrderSlice";
import { AppDispatch } from "../../../store";
import { CartItem } from "./useCheckoutItems";

interface UseOrderProcessingProps {
  businessId: string;
  employeeId: string;
}

import type { OrderData } from "../../../store/slices/OrderSlice";

export const useOrderProcessing = ({ businessId, employeeId }: UseOrderProcessingProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  
  const processOrder = async (
    cartItems: CartItem[],
    customerId: string,
    paymentMethod: string,
    dueDate: Date,
    total: number,
    subtotal: number = 0,
    tax: number = 0,
    tip: number = 0
  ) => {
    if (cartItems.length === 0) {
      Alert.alert("Error", "Cannot create an order with no items");
      return false;
    }
    
    try {
      setProcessingOrder(true);
      setOrderError(null);
      
      // Create the order first with all required fields
      const orderData: OrderData = {
        businessId,
        customerId,
        employeeId,
        paymentMethod,
        status: "CREATED", // Must match OrderData status type
        total,
        firstName: "", // Add placeholder values for required fields
        lastName: "",
        subtotal: subtotal || 0,
        tax: tax || 0,
        tip: typeof tip === "number" ? tip : 0, // Ensure tip is always a number
        notes: "",
        items: [],
        amountTendered: total, // Default to exact payment
        change: 0,
        pickupDate: dueDate.toISOString()
      };

      
      // Ensure tip is always a number for type safety
const safeOrderData: OrderData = { ...orderData, tip: typeof orderData.tip === "number" ? orderData.tip : 0, status: "CREATED" as "CREATED" };
const orderResult = await dispatch(createOrder(safeOrderData)).unwrap();
      // Adjust based on the actual structure of the response
      const orderId = orderResult.order?.id || "";
      const orderNum = orderResult.order?.orderNumber || `ORD-${Date.now()}`;
      
      setCurrentOrderId(orderId);
      setOrderNumber(orderNum);
      
      // Create order items
      if (orderId) {
        const itemPromises = cartItems.map(item => {
          const orderItemData = {
            orderId,
            itemId: item.id,
            quantity: item.quantity,
            price: item.price,
            type: item.type
          };
          
          return dispatch(createOrderItem(orderItemData)).unwrap();
        });
        
        await Promise.all(itemPromises);
      }
      
      setProcessingOrder(false);
      return true;
    } catch (error) {
      console.error("Error processing order:", error);
      setOrderError("Failed to process order. Please try again.");
      setProcessingOrder(false);
      return false;
    }
  };
  
  return {
    processingOrder,
    orderError,
    currentOrderId,
    orderNumber,
    processOrder
  };
};
