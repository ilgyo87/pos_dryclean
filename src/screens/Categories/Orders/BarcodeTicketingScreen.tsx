
/**
 * BarcodeTicketingScreen Component
 * 
 * This component provides a complete workflow for printing barcodes and scanning them
 * for dry cleaning items. It has two main modes:
 * 
 * 1. Print Mode: Shows a preview of barcodes for all items and allows printing them
 * 2. Scan Mode: Allows scanning barcodes to mark items as "ticketed"
 * 
 * The component works with hardware barcode scanners that act as keyboard input
 * devices, automatically detecting when a valid barcode is scanned.
 */import React, { useState, useRef, useEffect } from 'react';
 import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert,
    TextInput,
    ScrollView,
    ActivityIndicator,
    SafeAreaView
  } from 'react-native';
  import { Product } from '../../../types';
  import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
  import * as Print from 'expo-print';
  import * as FileSystem from 'expo-file-system';
  import { Platform } from 'react-native';
  import PrinterService from '../../../utils/PrinterService';
  import BarcodeItem from '../../../components/BarcodeItem';
  import { generateBarcodeValue } from '../../../utils/OrderBarcodeUtils';
  import useBarcodeScanning from '../../../hooks/useBarcodeScanning';
  
  interface BarcodeTicketingScreenProps {
    orderId: string;
    items: Product[];
    customerName: string;
    customerId: string;
    onComplete: (updatedItems: Product[]) => void;
    onCancel: () => void;
  }
  
  const BarcodeTicketingScreen: React.FC<BarcodeTicketingScreenProps> = ({
    orderId,
    items,
    customerName,
    customerId,
    onComplete,
    onCancel
  }) => {
    // UI mode state
    const [mode, setMode] = useState<'print' | 'scan'>('print');
    const [isPrinting, setIsPrinting] = useState(false);
    
    // Use the barcode scanning hook
    const {
      scannedItems,
      scanInput,
      setScanInput,
      error: scanError,
      scanning,
      toggleScanning,
      processScan,
      isComplete,
      remainingCount
    } = useBarcodeScanning(items, customerId);
    
    // Input ref for barcode scanner focus
    const barcodeInputRef = useRef<TextInput>(null);
    const barcodeRefs = useRef<React.RefObject<View>[]>(items.map(() => React.createRef<View>()));
    
    // Update refs if items length changes
    useEffect(() => {
      if (barcodeRefs.current.length !== items.length) {
        barcodeRefs.current = items.map(() => React.createRef<View>());
      }
    }, [items.length]);
    
    // Focus the input field when in scan mode for hardware barcode scanners
    useEffect(() => {
      if (mode === 'scan' && barcodeInputRef.current) {
        // Short delay to ensure the input is rendered
        setTimeout(() => {
          barcodeInputRef.current?.focus();
          toggleScanning(true);
        }, 100);
      } else {
        toggleScanning(false);
      }
    }, [mode, toggleScanning]);
  
    // Display error alert when scanning error occurs
    useEffect(() => {
      if (scanError) {
        Alert.alert('Scan Error', scanError);
      }
    }, [scanError]);
  
    // Generate barcode value for an item
    const getBarcodeValue = (item: Product): string => {
      return generateBarcodeValue(customerId, item._id);
    };
  
    // Handle manual barcode submission
    const handleManualSubmit = () => {
      if (!scanInput) {
        Alert.alert('Error', 'Please enter a barcode to scan');
        return;
      }
      
      // Process the scan
      const success = processScan(scanInput);
      
      if (success) {
        // Find the product that was scanned
        const parsed = scanInput.split('_');
        if (parsed.length === 2) {
          const productId = parsed[1];
          const product = items.find(item => item._id === productId);
          
          if (product) {
            // Provide feedback
            Alert.alert('Item Ticketed', `Successfully ticketed: ${product.name}`);
            
            // Check if all items are now scanned
            if (isComplete) {
              Alert.alert(
                'All Items Ticketed',
                'All items have been successfully ticketed. Would you like to complete the process?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Complete', onPress: handleCompleteProcess }
                ]
              );
            }
          }
        }
      }
      
      // Clear input
      setScanInput('');
      
      // Refocus input field for the next scan
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    };
  
    // Complete the ticketing process
    const handleCompleteProcess = () => {
      // Update all items to mark them as "ticketed"
      const updatedItems = items.map(item => ({
        ...item,
        status: 'PROCESSING'
      }));
      
      // Call the completion handler
      onComplete(updatedItems);
    };
  
    // Print all barcodes
    const handlePrintAll = async () => {
      try {
        setIsPrinting(true);
        
        // Use the PrinterService to print barcodes
        const success = await PrinterService.printQRCodes(
          items,
          customerName,
          customerId
        );
        
        if (!success) {
          throw new Error('Failed to print barcodes');
        }
        
        Alert.alert('Success', 'Barcodes printed successfully');
        
        // Switch to scan mode
        setMode('scan');
      } catch (error) {
        console.error('Print error:', error);
        Alert.alert('Error', `Failed to print barcodes: ${error}`);
      } finally {
        setIsPrinting(false);
      }
    };
  
    // Render a barcode for an item
    const renderBarcode = (item: Product, index: number) => {
      const barcodeValue = getBarcodeValue(item);
      const isScanned = scannedItems.has(item._id);
      
      return (
        <BarcodeItem
          key={item._id}
          ref={barcodeRefs.current[index]}
          item={item}
          customerName={customerName}
          barcodeValue={barcodeValue}
          isScanned={isScanned}
        />
      );
    };
  
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {mode === 'print' ? 'Print Barcodes' : 'Scan Barcodes'}
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'print' && styles.activeMode]}
            onPress={() => setMode('print')}
          >
            <MaterialIcons name="print" size={20} color={mode === 'print' ? "#fff" : "#333"} />
            <Text style={[styles.modeText, mode === 'print' && styles.activeModeText]}>Print</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'scan' && styles.activeMode]}
            onPress={() => setMode('scan')}
          >
            <MaterialIcons name="qr-code-scanner" size={20} color={mode === 'scan' ? "#fff" : "#333"} />
            <Text style={[styles.modeText, mode === 'scan' && styles.activeModeText]}>Scan</Text>
          </TouchableOpacity>
        </View>
        
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {scannedItems.size} of {items.length} items ticketed
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(scannedItems.size / items.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        {/* Print Mode View */}
        {mode === 'print' && (
          <View style={styles.contentContainer}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {items.map((item, index) => renderBarcode(item, index))}
            </ScrollView>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.printButton}
                onPress={handlePrintAll}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="print" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Print All Barcodes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Scan Mode View */}
        {mode === 'scan' && (
          <View style={styles.contentContainer}>
            <View style={styles.manualScanContainer}>
              {/* Barcode Scanner Input */}
              <View style={styles.manualEntryContainer}>
                <Text style={styles.sectionTitle}>Scan Barcode Tags</Text>
                <View style={styles.manualInputRow}>
                  <TextInput
                    ref={barcodeInputRef}
                    style={styles.manualInput}
                    value={scanInput}
                    onChangeText={setScanInput}
                    onSubmitEditing={handleManualSubmit}
                    placeholder={`Connect scanner or type ${customerId}_productId`}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    blurOnSubmit={false}
                    selectTextOnFocus={true}
                  />
                  <TouchableOpacity 
                    style={styles.manualInputButton}
                    onPress={handleManualSubmit}
                  >
                    <MaterialIcons name="check" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.scanInstructions}>
                  <MaterialIcons name="info-outline" size={20} color="#666" />
                  <Text style={styles.scanInstructionsText}>
                    Scan barcodes with your hardware scanner or enter them manually. 
                    The scanner will automatically submit when a valid code is detected.
                  </Text>
                </View>
              </View>
              
              {/* Ticketed Items List */}
              <View style={styles.ticketedItemsContainer}>
                <Text style={styles.sectionTitle}>Ticketed Items</Text>
                <ScrollView style={styles.ticketedItemsList}>
                  {items.map(item => {
                    const isTicketed = scannedItems.has(item._id);
                    return (
                      <View key={item._id} style={styles.ticketedItem}>
                        <MaterialIcons 
                          name={isTicketed ? "check-circle" : "radio-button-unchecked"} 
                          size={24} 
                          color={isTicketed ? "#4CAF50" : "#999"}
                        />
                        <Text 
                          style={[
                            styles.ticketedItemText,
                            isTicketed && styles.ticketedItemScanned
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
            
            {/* Complete Button */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[
                  styles.completeButton,
                  remainingCount > 0 && styles.disabledButton
                ]}
                onPress={handleCompleteProcess}
                disabled={remainingCount > 0}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {remainingCount > 0 
                    ? `Scan ${remainingCount} More Item${remainingCount !== 1 ? 's' : ''}` 
                    : 'Complete Process'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  };
  
  export default BarcodeTicketingScreen;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    closeButton: {
      padding: 8,
    },
    modeSelector: {
      flexDirection: 'row',
      padding: 8,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    modeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      paddingVertical: 10,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    activeMode: {
      backgroundColor: '#2196F3',
    },
    modeText: {
      marginLeft: 8,
      fontWeight: '500',
    },
    activeModeText: {
      color: '#fff',
    },
    progressContainer: {
      padding: 16,
      backgroundColor: '#fff',
    },
    progressText: {
      textAlign: 'center',
      marginBottom: 8,
      fontSize: 14,
      color: '#555',
    },
    progressBar: {
      height: 8,
      backgroundColor: '#e0e0e0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
    },
    contentContainer: {
      flex: 1,
      position: 'relative',
    },
    scrollContent: {
      padding: 16,
    },
    barcodeContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    scannedItemContainer: {
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
    },
    barcodeWrapper: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    barcode: {
      marginVertical: 12,
    },
    customerName: {
      fontSize: 14,
      color: '#555',
    },
    statusIcon: {
      marginLeft: 8,
    },
    manualScanContainer: {
      flex: 1,
      padding: 16,
    },
    manualEntryContainer: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    manualInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    manualInput: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 4,
      paddingHorizontal: 12,
      fontSize: 16,
    },
    manualInputButton: {
      height: 48,
      width: 48,
      backgroundColor: '#2196F3',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 4,
      marginLeft: 8,
    },
    scanInstructions: {
      flexDirection: 'row',
      backgroundColor: '#f9f9f9',
      padding: 12,
      borderRadius: 4,
      marginTop: 16,
      alignItems: 'flex-start',
    },
    scanInstructionsText: {
      flex: 1,
      fontSize: 14,
      color: '#666',
      marginLeft: 8,
    },
    ticketedItemsContainer: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    ticketedItemsList: {
      flex: 1,
    },
    ticketedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    ticketedItemText: {
      fontSize: 16,
      marginLeft: 12,
      color: '#333',
    },
    ticketedItemScanned: {
      fontWeight: 'bold',
    },
    actionButtons: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#e0e0e0',
      backgroundColor: '#fff',
    },
    printButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2196F3',
      padding: 16,
      borderRadius: 4,
    },
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      padding: 16,
      borderRadius: 4,
    },
    disabledButton: {
      backgroundColor: '#9E9E9E',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  });
  