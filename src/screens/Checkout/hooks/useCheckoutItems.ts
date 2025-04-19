import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../../store";
import { fetchCategories } from "../../../store/slices/CategorySlice";
import { fetchItems } from "../../../store/slices/ItemSlice";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "product";
  categoryId?: string;
}

export const useCheckoutItems = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [tip, setTip] = useState(0);
  const [total, setTotal] = useState(0);
  
  const categories = useSelector((state: RootState) => state.category.categories);
  const items = useSelector((state: RootState) => state.item.items);
  const loading = useSelector((state: RootState) => 
    state.category.isLoading || state.item.isLoading
  );
  
  // Load categories and items
  useEffect(() => {
    dispatch(fetchCategories(""));
    dispatch(fetchItems(""));
  }, [dispatch]);
  
  // Calculate totals whenever cart items change
  useEffect(() => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = newSubtotal * 0.08; // Assuming 8% tax rate
    const newTotal = newSubtotal + newTax + tip;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [cartItems, tip]);
  
  const addItemToCart = (item: any) => {
    // Check if item already exists in cart
    const existingItemIndex = cartItems.findIndex(i => i.id === item.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      // Add new item with quantity 1
      const newItem: CartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        type: item.type || "product",
        categoryId: item.categoryId
      };
      setCartItems([...cartItems, newItem]);
    }
  };
  
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromCart(itemId);
      return;
    }
    
    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCartItems(updatedItems);
  };
  
  const removeItemFromCart = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
  };
  
  const clearCart = () => {
    setCartItems([]);
    setTip(0);
  };
  
  const updateTip = (newTip: number) => {
    setTip(newTip);
  };
  
  return {
    cartItems,
    categories,
    items,
    loading,
    subtotal,
    tax,
    tip,
    total,
    addItemToCart,
    updateItemQuantity,
    removeItemFromCart,
    clearCart,
    updateTip
  };
};
