// src/screens/Orders/components/OrderCreatedModal.tsx
import React, { useState, useRef } from "react";
import { useAppDispatch } from '../../../store/hooks';
import { createOrderItem } from '../../../store/slices/OrderSlice';
import type { Schema } from "../../../../amplify/data/resource";
import { generateClient } from 'aws-amplify/data';
const client = generateClient<Schema>();
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateQRCodeData } from "../../../utils/QRCodeGenerator";
import { QRCodeDisplay } from "../../../components/QRCodeDisplay";
import { usePrinter } from "../../Checkout/hooks/usePrinter";

interface OrderItem {
  id: string;
  name: string;
  itemName?: string;
  price?: number;
  starch?: "NONE" | "LIGHT" | "MEDIUM" | "HEAVY";
  pressOnly?: boolean;
}

interface OrderCreatedModalProps {
  visible: boolean;
  orderNumber: string;
  orderId: string;
  customerId: string;
  employeeId?: string;
  items: OrderItem[];
  onClose: () => void;
  onPrintAll: () => void;
  onRemoveItem: (itemId: string) => void;
}

const OrderCreatedModal: React.FC<OrderCreatedModalProps> = ({
  visible,
  orderNumber,
  orderId,
  customerId,
  employeeId,
  items,
  onClose,
  onPrintAll
}) => {
  const dispatch = useAppDispatch();
  const { handlePrint, isPrinting: isPrinterBusy } = usePrinter();
  // Debug: Check for duplicate or missing IDs
  const idSet = new Set();
  // Defensive: filter out null/undefined items
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  safeItems.forEach((item, idx) => {
    if (!item?.id) {
      console.warn(`OrderCreatedModal: Item at index ${idx} is missing an ID`, item);
    } else if (idSet.has(item.id)) {
      console.warn(`OrderCreatedModal: Duplicate ID found: ${item.id}`, item);
    }
    if (item?.id) idSet.add(item.id);
  });
  console.log("OrderCreatedModal items:", safeItems.map((item, idx) => ({ idx, id: item?.id, name: item?.name || item?.itemName })));

  if (!orderId || !orderNumber || !customerId) {
    // Required props missing, don't render modal
    return null;
  }

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [scanInput, setScanInput] = useState<string>("");
  const [scannedItems, setScannedItems] = useState<Set<string>>(new Set());
  const [isCreatingGarment, setIsCreatingGarment] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentQRData, setCurrentQRData] = useState<string>("");
  const [currentQRTitle, setCurrentQRTitle] = useState<string>("");

  // Track which items we want to print
  // Defensive: filter out null/undefined items
  const unselectedItems = safeItems.filter(item => item?.id && !selectedItems.has(item.id));

  // Reference to the input field for auto-focusing
  const scanInputRef = useRef<TextInput>(null);

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleScanSubmit = async () => {
    try {
      // Parse the scanned QR code (which contains itemName, customerId, employeeId)
      if (!scanInput) return;

      // Parse the QR code data
      try {
        const parsedData = JSON.parse(scanInput);
        if (!parsedData.itemName || !parsedData.customerId) {
          Alert.alert("Invalid QR Code", "The scanned code is not a valid garment QR code.");
          setScanInput("");
          return;
        }

        // Mark this item as scanned
        const matchingItem = items.find(item =>
          item.itemName === parsedData.itemName || item.name === parsedData.itemName
        );

        if (matchingItem) {
          setIsCreatingGarment(true);

          // Create a new Garment in the database
          const garmentData = {
            description: parsedData.itemName,
            type: parsedData.itemName,
            checkInDate: new Date().toISOString(),
            targetReadyDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days by default
            status: "CHECKED_IN" as const, // Type assertion to match the enum exactly
            customerId: customerId,
            orderId: orderId,
            orderItemId: matchingItem.id,
            employeeId: employeeId || undefined,
            notes: [`Added from Order #${orderNumber}`],
            starch: matchingItem.starch,
            pressOnly: matchingItem.pressOnly
          };

          // Create the garment
          const { data, errors } = await client.models.Garment.create(garmentData);

          if (errors) {
            console.error("Error creating garment:", errors);
            Alert.alert("Error", "Failed to create garment. Please try again.");
          } else {
            // After garment is created, also create the OrderItem in Redux/Amplify
            try {
              const orderItemPayload = {
                orderId: orderId,
                orderNumber: orderNumber,
                price: matchingItem.price || 0,
                itemName: matchingItem.itemName || matchingItem.name,
                starch: matchingItem.starch,
                pressOnly: matchingItem.pressOnly
              };
              const result = await dispatch(createOrderItem(orderItemPayload)).unwrap();
              console.log('OrderItem created:', result);
            } catch (orderItemError) {
              console.error('Error creating OrderItem:', orderItemError);
              Alert.alert('Order Item Error', 'Failed to create order item. Please try again.');
            }

            // Add this item to scanned list
            const newScanned = new Set(scannedItems);
            newScanned.add(matchingItem.id);
            setScannedItems(newScanned);

            // Add to selected items as well to exclude from printing
            const newSelected = new Set(selectedItems);
            newSelected.add(matchingItem.id);
            setSelectedItems(newSelected);

            console.log("Garment created successfully:", data);
          }

          setIsCreatingGarment(false);
        } else {
          Alert.alert("Item Not Found", "No matching item found in this order.");
        }

      } catch (e) {
        console.error("Error parsing QR code:", e);
        Alert.alert("Invalid QR Code", "Please scan a valid garment QR code.");
      }

      // Clear the input field and refocus it
      setScanInput("");
      scanInputRef.current?.focus();
    } catch (error) {
      console.error("Error processing scan:", error);
      Alert.alert("Error", "An error occurred while processing the scan.");
      setIsCreatingGarment(false);
    }
  };

  const handlePrintSelected = async () => {
    try {
      setIsPrinting(true);
      const itemsToPrint = items.filter(item => !selectedItems.has(item.id));
      if (itemsToPrint.length === 0) {
        Alert.alert("No Items to Print", "All items have been processed or excluded from printing.");
        setIsPrinting(false);
        return;
      }
      for (const item of itemsToPrint) {
        // Generate the QR code data for this item
        const qrData = {
          type: "Garment",
          itemName: item.itemName || item.name,
          customerId: customerId,
          employeeId: employeeId,
          orderId: orderId,
          orderNumber: orderNumber,
          timestamp: new Date().toISOString()
        };
        // You may want to use generateQRCodeData or just pass qrData
        // Send to label printer
        await handlePrint({
          businessName: "Dry Cleaners",
          orderNumber: orderNumber,
          customerName: customerId,
          paymentMethod: "N/A",
          orderItems: [{
            name: item.itemName || item.name,
            price: item.price || 0,
            quantity: 1
          }],
          orderTotal: item.price || 0,
          orderDate: new Date(),
        });
        // Mark this item as selected
        setSelectedItems(prev => {
          const newSet = new Set(prev);
          newSet.add(item.id);
          return newSet;
        });
      }
      setIsPrinting(false);
      Alert.alert("Print Complete", `${itemsToPrint.length} label(s) printed successfully.`);
    } catch (error) {
      console.error("Error printing labels:", error);
      Alert.alert("Print Error", "Failed to print labels. Please try again.");
      setIsPrinting(false);
    }
  };


  const getItemStatus = (itemId: string) => {
    if (scannedItems.has(itemId)) return "scanned";
    if (selectedItems.has(itemId)) return "selected";
    return "normal";
  };

  const closeQRCode = () => {
    setShowQRCode(false);

    // Add the item we just printed to the selected list
    // This is a simplification - in a real app, you'd track which item was printed
    if (currentQRTitle) {
      const printedItem = items.find(item =>
        (item.itemName || item.name) === currentQRTitle
      );

      if (printedItem) {
        const newSelection = new Set(selectedItems);
        newSelection.add(printedItem.id);
        setSelectedItems(newSelection);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Order #{orderNumber}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Scanner Input Field */}
          <View style={styles.scannerContainer}>
            <TextInput
              ref={scanInputRef}
              style={styles.scannerInput}
              value={scanInput}
              onChangeText={setScanInput}
              placeholder="Scan QR code here..."
              onSubmitEditing={handleScanSubmit}
              returnKeyType="done"
              autoCapitalize="none"
              editable={!isCreatingGarment}
            />
            <TouchableOpacity
              style={styles.scanButton}
              onPress={handleScanSubmit}
              disabled={isCreatingGarment || !scanInput}
            >
              <Ionicons name="qr-code" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Process</Text>
            </TouchableOpacity>
          </View>

          {isCreatingGarment && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4285F4" />
              <Text style={styles.loadingText}>Creating garment...</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>
            Items ({items.length - selectedItems.size} remaining)
          </Text>
          <View style={[styles.listContent, { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }]}>
            {items.map((item, idx) => {
              const status = getItemStatus(item.id);
              return (
                <TouchableOpacity
                  key={item.id || idx}
                  style={[
                    styles.itemCard,
                    status === "selected" && styles.selectedItemCard,
                    status === "scanned" && styles.scannedItemCard
                  ]}
                  onPress={() => toggleItemSelection(item.id)}
                  disabled={status === "scanned"}
                >
                  <Text style={styles.itemName}>
                    {item.itemName || item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                unselectedItems.length === 0 && styles.disabledButton
              ]}
              onPress={handlePrintSelected}
              disabled={isPrinting || unselectedItems.length === 0}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="print" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>
                    Print {unselectedItems.length} Items
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* QR Code Modal */}
      {showQRCode && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.qrCodeModal}>
            <View style={styles.qrCodeContainer}>
              <QRCodeDisplay
                qrValue={currentQRData}
                entityType="Garment"
                title={currentQRTitle}
                onClose={closeQRCode}
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const { width, height } = Dimensions.get("window");
const CARD_MARGIN = 8;
const NUM_COLUMNS = 3;
const CARD_WIDTH = (width * 0.9 - CARD_MARGIN * 2 * NUM_COLUMNS) / NUM_COLUMNS;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    height: "80%",
    maxWidth: 800,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  scannerContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  scannerInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: "#4285F4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  scanButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 10,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  itemCard: {
    flexBasis: "47%",
    padding: 12,
    backgroundColor: "moccasin",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "black",
    minHeight: 80,
    alignItems: "flex-start",
    justifyContent: "center",
    margin: 4,
  },
  selectedItemCard: {
    backgroundColor: "#e0e0e0",
    borderColor: "#bdbdbd",
    opacity: 0.7,
  },
  scannedItemCard: {
    backgroundColor: "#E8F5E9",
    borderColor: "#A5D6A7",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemQty: {
    fontSize: 14,
    color: "#757575",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4285F4",
    borderRadius: 8,
    paddingVertical: 14,
  },
  disabledButton: {
    backgroundColor: "#bdbdbd",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    color: "#1976D2",
  },
  qrCodeModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrCodeContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
  },
});

export default OrderCreatedModal;