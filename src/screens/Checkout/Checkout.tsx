import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AuthUser } from "aws-amplify/auth";
import { Ionicons } from "@expo/vector-icons";

// Import components
import OrderSummary from "./components/OrderSummary";
import ReceiptModal from "./components/ReceiptModal";
import CheckoutServiceList from "./components/CheckoutServiceList";
import CheckoutProductList from "./components/CheckoutProductList";
import DueDatePicker from "./components/DueDatePicker";
import PaymentMethodSelector from "./components/PaymentMethodSelector";
import type { PaymentMethodType } from "./components/PaymentMethodSelector";

// Import hooks
import { useCheckoutItems, CartItem } from "./hooks/useCheckoutItems";
import { useOrderProcessing } from "./hooks/useOrderProcessing";
import { usePrinter, PrintReceiptParams } from "./hooks/usePrinter";

// Component props interface
interface CheckoutProps {
  user: AuthUser | null;
  employee: { id: string; name: string } | null;
}

const Checkout: React.FC<CheckoutProps> = ({ user, employee }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Extract route params
  const {
    customerId = "",
    customerName = "",
    businessId = "",
    businessName = "",
    businessAddress = "",
    businessPhone = "",
  } = route.params || {};

  // Local state
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Default to tomorrow
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("CASH");
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Custom hooks
  const {
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
  } = useCheckoutItems();

  const {
    processingOrder,
    orderError,
    currentOrderId,
    orderNumber,
    processOrder
  } = useOrderProcessing({
    businessId,
    employeeId: employee?.id || ""
  });

  const {
    isPrinterConnected,
    isPrinting,
    error: printerError,
    printReceipt
  } = usePrinter();

  // Handle checkout process
  const handleCheckout = useCallback(async () => {
    if (!customerId) {
      Alert.alert("Error", "Please select a customer before checkout");
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert("Error", "Cart is empty");
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    try {
      const success = await processOrder(
        cartItems,
        customerId,
        paymentMethod,
        dueDate,
        total
      );

      if (success) {
        setShowReceiptModal(true);
      } else {
        setLocalError("Failed to process order");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLocalError("An unexpected error occurred");
    } finally {
      setLocalLoading(false);
    }
  }, [cartItems, customerId, paymentMethod, dueDate, total, processOrder]);

  // Handle printing receipt
  const handlePrintReceipt = useCallback(async () => {
    if (!isPrinterConnected) {
      Alert.alert("Printer Error", "Printer is not connected");
      return;
    }

    const receiptData: PrintReceiptParams = {
      orderItems: cartItems,
      customerName,
      orderTotal: total,
      orderDate: new Date(),
      orderNumber,
      paymentMethod,
      businessName,
      businessAddress,
      businessPhone
    };

    const success = await printReceipt(receiptData);
    
    if (success) {
      Alert.alert("Success", "Receipt printed successfully");
    } else {
      Alert.alert("Error", "Failed to print receipt");
    }
  }, [cartItems, customerName, total, orderNumber, paymentMethod, businessName, businessAddress, businessPhone, isPrinterConnected, printReceipt]);

  // Handle order completion
  const handleCompleteOrder = useCallback(() => {
    setShowReceiptModal(false);
    clearCart();
    navigation.navigate("Dashboard");
  }, [clearCart, navigation]);

  // Render tab buttons
  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "services" && styles.activeTab]}
        onPress={() => setActiveTab("services")}
      >
        <Text style={[styles.tabText, activeTab === "services" && styles.activeTabText]}>Services</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === "products" && styles.activeTab]}
        onPress={() => setActiveTab("products")}
      >
        <Text style={[styles.tabText, activeTab === "products" && styles.activeTabText]}>Products</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
        {customerName ? (
          <Text style={styles.customerName}>Customer: {customerName}</Text>
        ) : (
          <TouchableOpacity
            style={styles.selectCustomerButton}
            onPress={() => navigation.navigate("Customers", { selectMode: true })}
          >
            <Text style={styles.selectCustomerText}>Select Customer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Left panel - Items selection */}
        <View style={styles.leftPanel}>
          {renderTabButtons()}
          
          {activeTab === "services" ? (
            <CheckoutServiceList
              categories={categories}
              isLoading={loading}
              onSelectService={addItemToCart}
            />
          ) : (
            <CheckoutProductList
              products={items}
              isLoading={loading}
              onSelectProduct={addItemToCart}
            />
          )}
        </View>

        {/* Right panel - Order summary */}
        <View style={styles.rightPanel}>
          <OrderSummary
            items={cartItems}
            subtotal={subtotal}
            tax={tax}
            tip={tip}
            total={total}
            dueDate={dueDate}
            onUpdateQuantity={updateItemQuantity}
            onRemoveItem={removeItemFromCart}
          />
          
          <View style={styles.checkoutOptions}>
            <DueDatePicker
              selectedDate={dueDate}
              onDateChange={setDueDate}
            />
            
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelectMethod={setPaymentMethod}
            />
            
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
              disabled={localLoading || processingOrder || cartItems.length === 0}
            >
              {(localLoading || processingOrder) ? (
                <Text style={styles.checkoutButtonText}>Processing...</Text>
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color="#fff" />
                  <Text style={styles.checkoutButtonText}>Complete Checkout</Text>
                </>
              )}
            </TouchableOpacity>
            
            {(localError || orderError) && (
              <Text style={styles.errorText}>{localError || orderError}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Receipt Modal */}
      <ReceiptModal
        visible={showReceiptModal}
        onClose={handleCompleteOrder}
        onComplete={() => {}}
        onPrint={handlePrintReceipt}
        businessName={businessName}
        isPrinting={isPrinting}
        isPrintingError={false} // Set appropriately if you track printing errors
        employeeName={employee?.name || ""}
        orderDetails={{
          orderNumber: orderNumber || "",
          customerName: customerName || "",
          items: cartItems.map(item => ({
            ...item,
            orderId: currentOrderId || "",
            orderNumber: orderNumber || ""
          })),
          subtotal,
          tax,
          tip,
          total,
          paymentMethod,
          pickupDate: dueDate.toISOString(),
          employeeName: employee?.name || ""
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 16,
    color: "#2196F3",
  },
  selectCustomerButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  selectCustomerText: {
    color: "#fff",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 3,
    borderRightWidth: 1,
    borderRightColor: "#e1e1e1",
  },
  rightPanel: {
    flex: 2,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#2196F3",
    fontWeight: "500",
  },
  checkoutOptions: {
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  checkoutButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 15,
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  errorText: {
    color: "#f44336",
    marginTop: 10,
    textAlign: "center",
  },
});

export default Checkout;
