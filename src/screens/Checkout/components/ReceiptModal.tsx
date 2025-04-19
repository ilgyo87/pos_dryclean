// src/screens/Checkout/components/ReceiptModal.tsx
import React, { useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDate } from "../../../utils/formatters";

export interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  onPrint: () => void;
  orderDetails: {
    orderNumber: string;
    customerName: string;
    items: {
      name: string;
      price: number;
      quantity: number;
      type: "service" | "product";
      orderId: string;
      orderNumber: string;
    }[];
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    paymentMethod: string;
    pickupDate: string;
    employeeName: string;
  };
  businessName: string;
  isPrinting: boolean;
  isPrintingError: boolean;
  employeeName: string;
}

const ReceiptModal = ({
  visible,
  onClose,
  onComplete,
  orderDetails,
  businessName,
  isPrinting,
  isPrintingError,
  employeeName,
  onPrint
}: ReceiptModalProps) => {
  const scrollViewRef = useRef<ScrollView>(null);

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    return method
      .replace(/_/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Receipt</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            ref={scrollViewRef} 
            style={styles.receiptContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.receiptContent}
          >
            {/* Receipt Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.businessName}>{businessName}</Text>
              <Text style={styles.receiptTitle}>RECEIPT</Text>
              <Text style={styles.orderNumber}>Order #: {orderDetails.orderNumber}</Text>
              <Text style={styles.receiptDate}>Date: {new Date().toLocaleDateString()}</Text>
              <Text style={styles.employeeName}>Employee: {employeeName}</Text>
            </View>

            {/* Customer Info */}
            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>CUSTOMER</Text>
              <View style={styles.divider} />
              <Text style={styles.customerName}>{orderDetails.customerName}</Text>
              <Text style={styles.pickupDate}>
                Pickup Date: {formatDate(orderDetails.pickupDate)}
              </Text>
            </View>

            {/* Items Section */}
            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>ITEMS</Text>
              <View style={styles.divider} />
              
              <View style={styles.itemsHeader}>
                <Text style={[styles.itemText, styles.itemName, styles.headerText]}>Item</Text>
                <Text style={[styles.itemText, styles.itemQty, styles.headerText]}>Qty</Text>
                <Text style={[styles.itemText, styles.itemPrice, styles.headerText]}>Price</Text>
              </View>

              {orderDetails.items.map((item, index) => (
                <View key={`${item.orderNumber}-${index}`} style={styles.itemRow}>
                  <Text style={[styles.itemText, styles.itemName]}>{item.name}</Text>
                  <Text style={[styles.itemText, styles.itemQty]}>{item.quantity}</Text>
                  <Text style={[styles.itemText, styles.itemPrice]}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Pricing Summary */}
            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>SUMMARY</Text>
              <View style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${orderDetails.subtotal.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>${orderDetails.tax.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tip</Text>
                <Text style={styles.summaryValue}>${orderDetails.tip.toFixed(2)}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValue}>${orderDetails.total.toFixed(2)}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Method</Text>
                <Text style={styles.summaryValue}>{formatPaymentMethod(orderDetails.paymentMethod)}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.footerText}>Thank you for your business!</Text>
              <Text style={styles.footerText}>Please present this receipt when picking up your order.</Text>
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.printButton, isPrinting && styles.disabledButton]}
              onPress={onPrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="print" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Print Receipt</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.doneButton]}
              onPress={onComplete}
            >
              <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {isPrintingError && (
            <Text style={styles.errorText}>
              Error printing receipt. Please check printer connection.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 0,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  receiptContainer: {
    maxHeight: "70%",
    backgroundColor: "#fff",
  },
  receiptContent: {
    padding: 20,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  businessName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 14,
    marginBottom: 5,
  },
  receiptDate: {
    fontSize: 14,
    color: "#666",
  },
  receiptSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginBottom: 10,
  },
  customerName: {
    fontSize: 16,
    marginBottom: 5,
  },
  pickupDate: {
    fontSize: 14,
    color: "#666",
  },
  itemsHeader: {
    flexDirection: "row",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerText: {
    fontWeight: "bold",
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemText: {
    fontSize: 14,
  },
  itemName: {
    flex: 3,
    paddingRight: 5,
  },
  itemQty: {
    flex: 1,
    textAlign: "center",
  },
  itemPrice: {
    flex: 2,
    textAlign: "right",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#555",
  },
  summaryValue: {
    fontSize: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  receiptFooter: {
    marginTop: 20,
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonIcon: {
    marginRight: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  printButton: {
    backgroundColor: "#2196F3",
  },
  doneButton: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    backgroundColor: "#B0BEC5",
  },
  errorText: {
    color: "#E53935",
    textAlign: "center",
    padding: 10,
    fontSize: 14,
  },
  employeeName: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    marginTop: 5,
  },
});

export default ReceiptModal;