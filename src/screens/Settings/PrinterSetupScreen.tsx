import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import printerService from '../../utils/PrinterService';

// Storage keys
const DEFAULT_PRINTER_KEY = 'DEFAULT_PRINTER';
const PRINTER_HISTORY_KEY = 'PRINTER_HISTORY';
const AUTO_CONNECT_KEY = 'PRINTER_AUTO_CONNECT';

interface PrinterDevice {
  name: string;
  address: string;
  inner_mac_address?: string;
  lastConnected?: string;
}

interface PrinterSetupScreenProps {
  navigation: any;
}

const PrinterSetupScreen: React.FC<PrinterSetupScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [printerHistory, setPrinterHistory] = useState<PrinterDevice[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<PrinterDevice | null>(null);
  const [autoConnect, setAutoConnect] = useState(true);
  const [manualAddress, setManualAddress] = useState('');
  const [manualName, setManualName] = useState('');


  // Load settings on component mount
  useEffect(() => {
    loadSettings();

  }, []);

  // Load all printer settings
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load printer history
      const historyJson = await AsyncStorage.getItem(PRINTER_HISTORY_KEY);
      if (historyJson) {
        const history = JSON.parse(historyJson);
        setPrinterHistory(history);
      }
      
      // Load default printer
      const defaultJson = await AsyncStorage.getItem(DEFAULT_PRINTER_KEY);
      if (defaultJson) {
        const defaultPrinterData = JSON.parse(defaultJson);
        setDefaultPrinter(defaultPrinterData);
      }
      
      // Load auto connect setting
      const autoConnectValue = await AsyncStorage.getItem(AUTO_CONNECT_KEY);
      setAutoConnect(autoConnectValue !== 'false'); // Default to true
    } catch (error: unknown) {
      if (error instanceof Error) {
  console.error('Error loading printer settings:', error.message);
} else {
  console.error('Error loading printer settings:', error);
}
      Alert.alert('Error', 'Failed to load printer settings');
    } finally {
      setIsLoading(false);
    }
  };



  // Toggle auto connect setting
  const toggleAutoConnect = async (value: boolean) => {
    try {
      setAutoConnect(value);
      await AsyncStorage.setItem(AUTO_CONNECT_KEY, value ? 'true' : 'false');
    } catch (error: unknown) {
      if (error instanceof Error) {
  console.error('Error saving auto connect setting:', error.message);
} else {
  console.error('Error saving auto connect setting:', error);
}
      Alert.alert('Error', 'Failed to save auto connect setting');
    }
  };

  // Set the selected printer as default and update history
  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      setIsLoading(true);
      // Set as default printer
      await AsyncStorage.setItem(DEFAULT_PRINTER_KEY, JSON.stringify(printer));
      setDefaultPrinter(printer);
      // Update history
      const history = [...printerHistory.filter(p => p.address !== printer.address)];
      printer.lastConnected = new Date().toISOString();
      history.unshift(printer);
      setPrinterHistory(history);
      await AsyncStorage.setItem(PRINTER_HISTORY_KEY, JSON.stringify(history));
      Alert.alert('Success', `Set ${printer.name} as default printer.`);
    } catch (error: unknown) {
      setIsLoading(false);
      if (error instanceof Error) {
  console.error('Error updating default printer:', error.message);
} else {
  console.error('Error updating default printer:', error);
}
      Alert.alert('Error', 'Failed to set default printer');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a manual printer
  const addManualPrinter = async () => {
    if (!manualAddress || !manualName) {
      Alert.alert('Input Required', 'Please enter both name and address for the printer');
      return;
    }
    
    try {
      // Create printer object
      const printer: PrinterDevice = {
        name: manualName,
        address: manualAddress,

        lastConnected: new Date().toISOString(),
      };
      
      // Add to history
      const history = [...printerHistory.filter(p => p.address !== printer.address)];
      history.unshift(printer);
      
      // Limit history to 5 entries
      const limitedHistory = history.slice(0, 5);
      
      // Save history
      setPrinterHistory(limitedHistory);
      await AsyncStorage.setItem(PRINTER_HISTORY_KEY, JSON.stringify(limitedHistory));
      
      // Connect to printer
      await connectToPrinter(printer);
      
      // Clear manual inputs
      setManualName('');
      setManualAddress('');

    } catch (error: unknown) {
      if (error instanceof Error) {
  console.error('Error adding manual printer:', error.message);
} else {
  console.error('Error adding manual printer:', error);
}
      Alert.alert('Error', `Failed to add printer: ${error}`);
    }
  };

  // Print a test receipt
  const printTestReceipt = async () => {
    if (!defaultPrinter) {
      Alert.alert('No Printer', 'Please connect to a printer first');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const testData = {
        businessName: 'Dry Clean POS',
        orderNumber: 'TEST-123',
        customerName: 'Test Customer',
        items: [
          {
            _id: 'test-1',
            name: 'Test Item 1',
            price: 12.99,
            options: {
              starch: 'medium' as const,
              pressOnly: false,
            }
          },
          {
            _id: 'test-2',
            name: 'Test Item 2',
            price: 8.50,
            options: {
              starch: 'none' as const,
              pressOnly: true,
            }
          }
        ],
        total: 21.49,
        date: new Date().toLocaleString(),
        notes: 'This is a test receipt. Thank you for using Dry Clean POS!',
      };
      
      await printerService.printReceipt(testData);
      Alert.alert('Success', 'Test receipt printed successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error printing test receipt:', error.message);
      } else {
        console.error('Error printing test receipt:', error);
      }
      Alert.alert('Print Error', `Failed to print test receipt: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render printer item
  const renderPrinterItem = (printer: PrinterDevice, isDefault: boolean) => (
    <TouchableOpacity
      key={printer.address}
      style={[
        styles.printerItem,
        isDefault && styles.defaultPrinterItem
      ]}
      onPress={() => connectToPrinter(printer)}
      disabled={isLoading}
    >
      <View style={styles.printerInfo}>
        <Text style={styles.printerName}>{printer.name}</Text>
        <Text style={styles.printerAddress}>{printer.address}</Text>
        {printer.lastConnected && (
          <Text style={styles.lastConnected}>
            Last connected: {new Date(printer.lastConnected).toLocaleString()}
          </Text>
        )}
      </View>
      {isDefault && (
        <View style={styles.defaultBadge}>
          <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
          <Text style={styles.defaultText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // --- Main component return ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Default Printer */}
        {defaultPrinter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Default Printer</Text>
            {renderPrinterItem(defaultPrinter, true)}
            <TouchableOpacity 
              style={styles.testButton}
              onPress={printTestReceipt}
              disabled={isLoading}
            >
              <MaterialIcons name="print" size={18} color="#fff" />
              <Text style={styles.testButtonText}>Print Test Receipt</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Printer History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Printer History</Text>
          {printerHistory.length === 0 ? (
            <Text>No printers in history.</Text>
          ) : (
            printerHistory.map(printer =>
              renderPrinterItem(printer, defaultPrinter?.address === printer.address)
            )
          )}
        </View>

        {/* Add Printer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Printer</Text>
          <Text style={styles.label}>Printer Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Brother Label Printer"
            value={manualName}
            onChangeText={setManualName}
          />
          <Text style={styles.label}>Printer Address (IP or USB Path)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 192.168.1.100 or /dev/usb/lp0"
            value={manualAddress}
            onChangeText={setManualAddress}
          />
          <TouchableOpacity
            style={[styles.addButton, (!manualAddress || !manualName) && styles.disabledButton]}
            onPress={addManualPrinter}
            disabled={!manualAddress || !manualName}
          >
            <MaterialIcons name="add-circle" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Printer</Text>
          </TouchableOpacity>
        </View>

        {/* Test Print */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.testButton} onPress={printTestReceipt}>
            <MaterialIcons name="print" size={20} color="white" />
            <Text style={styles.testButtonText}>Print Test Receipt</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.instructionText}>
            1. Add your Brother or Rongta printer by name and IP/USB address.{"\n"}
            2. Set it as the default printer.{"\n"}
            3. Optionally enable auto-connect.{"\n"}
            4. Test the connection by printing a test receipt.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrinterSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
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
    color: '#333',
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  defaultPrinterItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastConnected: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
});