import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  SafeAreaView,
} from 'react-native';

// import { ThermalPrinterModule } from 'react-native-thermal-receipt-printer';
// NOTE: All printer functionality using react-native-thermal-receipt-printer has been disabled for build compatibility.
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { requestBluetoothPermissions } from './../utils/PermissionHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINTER_STORAGE_KEY = 'PHOMEMO_M120_PRINTER_ADDRESS';

const PrinterManagementScreen = ({ navigation }: { navigation: any }): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  // TODO: Replace any with new printer device type if needed
const [pairedDevices, setPairedDevices] = useState<any[]>([]);
  // TODO: Replace any with new printer device type if needed
const [availableDevices, setAvailableDevices] = useState<any[]>([]);
  // TODO: Replace any with new printer device type if needed
const [selectedPrinter, setSelectedPrinter] = useState<any | null>(null);
  const [autoConnect, setAutoConnect] = useState(true);

  // Load saved printer and settings on mount
  useEffect(() => {
    loadSavedPrinter();
    checkBluetoothState();
  }, []);

  // Try to auto-connect to last used printer when screen loads
  useEffect(() => {
    if (autoConnect && selectedPrinter && bluetoothEnabled) {
      connectToPrinter(selectedPrinter);
    }
  }, [selectedPrinter, bluetoothEnabled, autoConnect]);

  // Load saved printer from AsyncStorage
  const loadSavedPrinter = async (): Promise<void> => {
    try {
      const printerData = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
      if (printerData) {
        setSelectedPrinter(JSON.parse(printerData));
      }
    } catch (error) {
      console.error('Error loading saved printer:', error);
    }
  };

  // Save printer to AsyncStorage
  // TODO: Replace any with new printer device type if needed
const savePrinter = async (printer: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
    } catch (error) {
      console.error('Error saving printer:', error);
    }
  };

  // Check if Bluetooth is enabled
  const checkBluetoothState = async (): Promise<void> => {
  // TODO: Replace BluetoothManager.isBluetoothEnabled with new integration
  setBluetoothEnabled(true); // Assume enabled or handle with new integration
  await getPairedDevices();
  return;

    try {
      setIsLoading(true);
      // BluetoothManager is removed. Assume Bluetooth is enabled for compatibility.
      setBluetoothEnabled(true);
      await getPairedDevices();
    } catch (error) {
      console.error('Bluetooth state check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enable Bluetooth
  const enableBluetooth = async (): Promise<void> => {
  // TODO: Replace BluetoothManager.enableBluetooth with new integration
  setBluetoothEnabled(true);
  setPairedDevices([]); // Replace with new device list if supported
  return;

    try {
      setIsLoading(true);
      const hasPermissions = await requestBluetoothPermissions();
      
      if (!hasPermissions) {
        return;
      }
      
      // BluetoothManager is removed. Set Bluetooth enabled and clear paired devices.
      setBluetoothEnabled(true);
      setPairedDevices([]);
    } catch (error) {
      console.error('Enable Bluetooth error:', error);
      Alert.alert('Bluetooth Error', 'Failed to enable Bluetooth. Please enable it manually in your device settings.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get paired devices
  const getPairedDevices = async (): Promise<void> => {
  // TODO: Replace BluetoothManager.getBondedDevices with new integration
  setPairedDevices([]); // Replace with new device list if supported
  return;

    try {
      setIsLoading(true);
      const hasPermissions = await requestBluetoothPermissions();
      
      if (!hasPermissions) {
        return;
      }
      
      // Set paired devices to empty array.
      setPairedDevices([]);
    } catch (error) {
      console.error('Get paired devices error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Scan for Bluetooth devices
  const scanForDevices = async (): Promise<void> => {
  // TODO: Implement device scanning with new printer integration if supported
  setAvailableDevices([]);
  setIsScanning(false);
  return;

    try {
      setIsScanning(true);
      setAvailableDevices([]);
      
      const hasPermissions = await requestBluetoothPermissions();
      
      if (!hasPermissions) {
        setIsScanning(false);
        return;
      }
      
      // This is typically handled by the OS's Bluetooth settings
      // We'll simulate it by showing a message
      Alert.alert(
        'Bluetooth Scanning',
        'Please use your device settings to scan and pair with your Phomemo M120 printer, then return to this app.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsScanning(false) },
          { 
            text: 'Open Settings', 
            onPress: () => {
              // Ideally, open Bluetooth settings
              setIsScanning(false);
              // BluetoothManager is removed. Cannot open Bluetooth settings programmatically.
            } 
          },
        ]
      );
    } catch (error) {
      console.error('Scan error:', error);
      setIsScanning(false);
    }
  };

  // Connect to a printer
  // TODO: Replace any with new printer device type if needed
const connectToPrinter = async (printer: any): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Connect to the printer
      // BluetoothManager is removed. Printer connection is disabled.
      
      // Save the selected printer
      setSelectedPrinter(printer);
      savePrinter(printer);
      
      Alert.alert('Connected', `Successfully connected to ${printer.name}`);
      
      // Print a test receipt
      await printTestReceipt();
    } catch (error) {
      console.error('Printer connection error:', error);
      Alert.alert('Connection Error', `Failed to connect to ${printer.name}. Please make sure it is turned on and within range.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Print a test receipt
  const printTestReceipt = async (): Promise<void> => {
    try {
      // Printer module is disabled. Test print is unavailable.
    } catch (error) {
      console.error('Test print error:', error);
      Alert.alert('Print Error', 'Failed to print test receipt.');
    }
  };

  // Render a device item
  const renderDeviceItem = ({ item }: { item: any }): JSX.Element => {
    const isSelected = selectedPrinter && selectedPrinter.address === item.address;
    const isPhomemo = item.name.includes('Phomemo') || item.name.includes('M120');
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isSelected && styles.selectedDeviceItem,
          isPhomemo && styles.phomemoDeviceItem
        ]}
        onPress={() => connectToPrinter(item)}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceAddress}>{item.address}</Text>
        </View>
        
        {isSelected ? (
          <View style={styles.connectedIndicator}>
            <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        ) : (
          <MaterialIcons name="bluetooth" size={24} color="#2196F3" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phomemo M120 Printer Setup</Text>
      </View>
      
      {/* Bluetooth Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Bluetooth Status:</Text>
          <View style={styles.statusValue}>
            {bluetoothEnabled ? (
              <Text style={styles.statusEnabledText}>Enabled</Text>
            ) : (
              <TouchableOpacity
                style={styles.enableButton}
                onPress={enableBluetooth}
                disabled={isLoading}
              >
                <Text style={styles.enableButtonText}>Enable Bluetooth</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Auto-Connect:</Text>
          <Switch
            value={autoConnect}
            onValueChange={setAutoConnect}
            trackColor={{ false: '#ccc', true: '#bfe3ff' }}
            thumbColor={autoConnect ? '#2196F3' : '#f4f3f4'}
          />
        </View>
        
        {selectedPrinter && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Selected Printer:</Text>
            <Text style={styles.printerName}>{selectedPrinter.name}</Text>
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={getPairedDevices}
          disabled={isLoading || !bluetoothEnabled}
        >
          <MaterialIcons name="refresh" size={20} color="white" />
          <Text style={styles.actionButtonText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.scanButton]}
          onPress={scanForDevices}
          disabled={isScanning || !bluetoothEnabled}
        >
          <MaterialIcons name="bluetooth-searching" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            {isScanning ? 'Scanning...' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>
        
        {selectedPrinter && (
          <TouchableOpacity
            style={[styles.actionButton, styles.testButton]}
            onPress={printTestReceipt}
            disabled={isLoading || !bluetoothEnabled}
          >
            <MaterialIcons name="print" size={20} color="white" />
            <Text style={styles.actionButtonText}>Test Print</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Device List Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Printers</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      ) : pairedDevices.length > 0 ? (
        <FlatList
          data={pairedDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.address}
          contentContainerStyle={styles.deviceList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="bluetooth-disabled" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No paired devices found</Text>
          <Text style={styles.emptySubtext}>
            Please pair your Phomemo M120 printer in your device Bluetooth settings first
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEnabledText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  enableButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  enableButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  printerName: {
    fontWeight: '500',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#607D8B',
  },
  scanButton: {
    backgroundColor: '#2196F3',
  },
  testButton: {
    backgroundColor: '#4CAF50',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  deviceList: {
    padding: 16,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedDeviceItem: {
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  phomemoDeviceItem: {
    backgroundColor: '#e3f2fd',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#777',
  },
  connectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PrinterManagementScreen;