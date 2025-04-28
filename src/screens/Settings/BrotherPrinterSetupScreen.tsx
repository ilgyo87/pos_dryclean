// src/screens/Settings/BrotherPrinterSetupScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
  Platform,
  SafeAreaView
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleBrotherPrinter, { PrinterStatus, PrinterConfig } from './../../utils/SimpleBrotherPrinter';
import { requestBluetoothPermissions } from '../../utils/PermissionHandler';

const BrotherPrinterSetupScreen: React.FC = () => {
  // State for printer configuration
  const [config, setConfig] = useState<PrinterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [foundPrinters, setFoundPrinters] = useState<any[]>([]);
  const [manualAddress, setManualAddress] = useState('');
  const [manualSerialNumber, setManualSerialNumber] = useState('');
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>(PrinterStatus.DISCONNECTED);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Paper size option
  const [selectedPaperSize, setSelectedPaperSize] = useState<PrinterConfig['paperSize']>('29mm');

  // Handler for resetting printer config
  const handleResetPrinterConfig = async () => {
    try {
      setIsResetting(true);
      await SimpleBrotherPrinter.resetConfig();
      setConfig(null);
      setFoundPrinters([]);
      setManualAddress('');
      setManualSerialNumber('');
      setSelectedPaperSize('29mm');
      setPrinterStatus(PrinterStatus.DISCONNECTED);
      setStatusError(null);
      Alert.alert('Reset Complete', 'Printer configuration has been reset. The app will now rediscover printers.');
    } catch (error) {
      Alert.alert('Reset Failed', 'Failed to reset printer configuration.');
    } finally {
      setIsResetting(false);
    }
  };

  // Load initial configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Function to load printer configuration and status
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // Initialize printer service
      await SimpleBrotherPrinter.initialize();
      
      // Get saved configuration
      const savedConfig = SimpleBrotherPrinter.getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setSelectedPaperSize(savedConfig.paperSize);
      } else {
        setConfig(null);
      }
      // Get current status
      const status = SimpleBrotherPrinter.getStatus();
      setPrinterStatus(status.status);
      setStatusError(status.error);
    } catch (error) {
      console.error('Error loading printer configuration:', error);
      Alert.alert('Error', 'Failed to load printer configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Search for available printers
  const handleSearchPrinters = async () => {
    try {
      setIsSearching(true);
      
      // Request Bluetooth permissions if needed
      if (Platform.OS === 'android') {
        const hasPermissions = await requestBluetoothPermissions();
        if (!hasPermissions) {
          throw new Error('Bluetooth permissions are required to search for printers');
        }
      }
      
      // Search for printers
      const printers = await SimpleBrotherPrinter.searchPrinters();
      setFoundPrinters(printers);
      
      if (printers.length === 0) {
        Alert.alert(
          'No Printers Found',
          'No Brother printers were found. Make sure your printer is powered on and nearby.'
        );
      }
    } catch (error) {
      console.error('Error searching for printers:', error);
      Alert.alert('Error', `Failed to search for printers: ${error}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Connect to a printer
  const handleConnectPrinter = async (printer: any) => {
    try {
      setIsLoading(true);
      
      // Connect to the printer
      const connected = await SimpleBrotherPrinter.connectToPrinter(
        printer.ipAddress || printer.address,
        printer.modelName || 'Brother QL-820NWB',
        printer.serialNumber
      );
      
      if (connected) {
        // Update config with paper size
        const newConfig = SimpleBrotherPrinter.getConfig();
        if (newConfig) {
          const updatedConfig: PrinterConfig = {
            ...newConfig,
            paperSize: selectedPaperSize
          };
          await SimpleBrotherPrinter.saveConfig(updatedConfig);
        }
        
        await loadConfig();
        Alert.alert('Connected', `Successfully connected to ${printer.modelName || 'printer'}`);
      } else {
        throw new Error('Failed to connect to printer');
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      Alert.alert('Connection Error', `Failed to connect to printer: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a manual printer
  const handleAddManualPrinter = async () => {
    if (!manualAddress) {
      Alert.alert('Input Required', 'Please enter an IP address for the printer');
      return;
    }
    try {
      setIsLoading(true);
      
      // Connect to the printer
      const connected = await SimpleBrotherPrinter.connectToPrinter(
        manualAddress,
        'Brother QL-820NWB',
        manualSerialNumber || undefined
      );
      
      if (connected) {
        // Update config with paper size
        const newConfig = SimpleBrotherPrinter.getConfig();
        if (newConfig) {
          const updatedConfig: PrinterConfig = {
            ...newConfig,
            paperSize: selectedPaperSize
          };
          await SimpleBrotherPrinter.saveConfig(updatedConfig);
        }
        
        await loadConfig();
        Alert.alert('Connected', 'Successfully connected to printer');
        setManualAddress('');
        setManualSerialNumber('');
      } else {
        throw new Error('Failed to connect to printer');
      }
    } catch (error) {
      console.error('Error adding manual printer:', error);
      Alert.alert('Connection Error', `Failed to connect to printer: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle paper size changes
  const handlePaperSizeChange = async (newSize: PrinterConfig['paperSize']) => {
    if (!config) return;
    
    try {
      setIsLoading(true);
      
      // Create updated config
      const updatedConfig: PrinterConfig = {
        ...config,
        paperSize: newSize,
      };
      
      // Save the updated config
      await SimpleBrotherPrinter.saveConfig(updatedConfig);
      
      // Reload config to reflect changes
      await loadConfig();
      
      // Show confirmation
      Alert.alert('Paper Size Updated', 
        `Paper size has been changed to ${newSize}. This will be used for all future print jobs.`
      );
    } catch (error) {
      console.error('Error updating paper size:', error);
      Alert.alert('Error', 'Failed to update paper size configuration');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show last error in the UI if present
  const renderStatusError = () => {
    if (statusError) {
      return (
        <View style={{ marginVertical: 8 }}>
          <Text style={{ color: 'red', fontSize: 13 }}>Last error: {statusError}</Text>
        </View>
      );
    }
    return null;
  };

  // Print a test label
  const handlePrintTest = async () => {
    try {
      setIsLoading(true);
      
      // Show printing feedback to the user
      Alert.alert(
        'Printing Test Label',
        'Sending test label to printer. This may take a few moments.',
        [{ text: 'OK' }]
      );
      
      // Attempt to print test label
      const success = await SimpleBrotherPrinter.printTestLabel();
      
      if (success) {
        Alert.alert('Success', 'Test label printed successfully. If you do not see the label, please check:' +
          '\n\n1. Printer is powered on and has paper loaded' +
          '\n2. Printer is not showing any errors (paper jam, etc.)');
      } else {
        const status = SimpleBrotherPrinter.getStatus();
        throw new Error(status.error || 'Failed to print test label');
      }
    } catch (error) {
      console.error('Error printing test label:', error);
      
      // Provide specific help for common issues
      const errorMsg = (error as Error).toString().toLowerCase();
      let helpfulMessage = 'Failed to print test label. ';
      
      if (errorMsg.includes('reset') || errorMsg.includes('connection reset by peer')) {
        helpfulMessage = 'The iOS "Connection reset by peer" error occurred. This is a common iOS network issue with Brother printers.\n\n' +
          'Please try these specific steps:\n\n' +
          '1. Power cycle your printer (turn it off, wait 10 seconds, turn it on)\n' +
          '2. Verify the printer is showing ONLINE/READY on its display\n' +
          '3. Check that your device and printer are on the same WiFi network\n' +
          '4. If using WiFi, try entering the printer\'s IP address manually\n' +
          '5. As a last resort, try restarting this app and your device';
      } else if (errorMsg.includes('connection')) {
        helpfulMessage += 'There was a connection problem with the printer. Please try these steps:\n\n' +
          '1. Ensure printer is powered on\n' +
          '2. Confirm printer is in online mode (not showing any errors)\n' +
          '3. For network printers, verify it is on the same network as your device';
      } else if (errorMsg.includes('timeout')) {
        helpfulMessage += 'The print operation timed out. This could be due to:\n\n' +
          '1. Poor network connection\n' +
          '2. Printer being in sleep mode\n' +
          '3. Printer having paper or other hardware issues';
      } else {
        helpfulMessage += `Error details: ${error}`;
      }
      
      Alert.alert('Print Error', helpfulMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Paper size selection component
  const PaperSizeSelection = () => (
    <View style={styles.optionSection}>
      <Text style={styles.sectionTitle}>Paper Size</Text>
      <View style={styles.optionButtons}>
        {(['29mm', '38mm', '50mm', '54mm', '62mm'] as PrinterConfig['paperSize'][]).map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.optionButton,
              selectedPaperSize === size && styles.selectedOptionButton
            ]}
            onPress={() => setSelectedPaperSize(size)}
          >
            <Text style={[
              styles.optionButtonText,
              selectedPaperSize === size && styles.selectedOptionButtonText
            ]}>
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render the main screen content
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Brother Printer Setup</Text>
          <Text style={styles.headerSubtitle}>Configure your Brother QL-820NWB printer</Text>
        </View>
        
        {/* Current Printer Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <MaterialIcons name="print" size={24} color="#333" />
            <Text style={styles.statusTitle}>Printer Status</Text>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Text style={[
                  styles.statusValue,
                  printerStatus === PrinterStatus.CONNECTED ? styles.statusConnected : styles.statusDisconnected
                ]}>
                  {printerStatus === PrinterStatus.CONNECTED ? 'Connected' : 
                   printerStatus === PrinterStatus.ERROR ? 'Error' : 'Disconnected'}
                </Text>
              </View>
              
              {config && (
                <>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Model:</Text>
                    <Text style={styles.statusValue}>{config.model}</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Address:</Text>
                    <Text style={styles.statusValue}>{config.address}</Text>
                  </View>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Paper Size:</Text>
                    <Text style={styles.statusValue}>{config.paperSize}</Text>
                  </View>
                  
                  {renderStatusError()}
                  
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.printButton]}
                      onPress={handlePrintTest}
                      disabled={isLoading || printerStatus !== PrinterStatus.CONNECTED}
                    >
                      <Text style={styles.buttonText}>Print Test</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.button, styles.resetButton]}
                      onPress={handleResetPrinterConfig}
                      disabled={isResetting}
                    >
                      <Text style={styles.buttonText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              
              {!config && (
                <Text style={styles.noPrinterText}>No printer configured. Please search for printers or add one manually below.</Text>
              )}
            </>
          )}
        </View>
        
        {/* Printer Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Find Printers</Text>
          <TouchableOpacity
            style={[styles.button, styles.searchButton]}
            onPress={handleSearchPrinters}
            disabled={isSearching}
          >
            <Text style={styles.buttonText}>
              {isSearching ? 'Searching...' : 'Search for Printers'}
            </Text>
          </TouchableOpacity>
          
          {foundPrinters.length > 0 && (
            <View style={styles.printerList}>
              <Text style={styles.subsectionTitle}>Available Printers</Text>
              {foundPrinters.map((printer, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.printerItem}
                  onPress={() => handleConnectPrinter(printer)}
                >
                  <View style={styles.printerItemContent}>
                    <Text style={styles.printerName}>{printer.modelName || 'Unknown Printer'}</Text>
                    <Text style={styles.printerAddress}>
                      {printer.ipAddress || printer.macAddress || 'No address'}
                    </Text>
                    {printer.serialNumber && (
                      <Text style={styles.printerSerial}>S/N: {printer.serialNumber}</Text>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#999" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Manual Printer Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Printer Entry</Text>
          <Text style={styles.sectionDescription}>
            If your printer isn't found automatically, you can enter its details manually.
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IP Address:</Text>
            <TextInput
              style={styles.textInput}
              value={manualAddress}
              onChangeText={setManualAddress}
              placeholder="e.g., 192.168.1.100"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Serial Number (Optional):</Text>
            <TextInput
              style={styles.textInput}
              value={manualSerialNumber}
              onChangeText={setManualSerialNumber}
              placeholder="e.g., U12345A0123456"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={handleAddManualPrinter}
            disabled={!manualAddress || isLoading}
          >
            <Text style={styles.buttonText}>Add Printer</Text>
          </TouchableOpacity>
        </View>
        
        {/* Printer Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Printer Settings</Text>
          <Text style={styles.sectionDescription}>
            Configure settings for your printer. These will be applied when connecting to a printer.
          </Text>
          
          <PaperSizeSelection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusConnected: {
    color: 'green',
  },
  statusDisconnected: {
    color: 'red',
  },
  noPrinterText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#2196F3',
  },
  printButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginRight: 8,
  },
  resetButton: {
    backgroundColor: '#F44336',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#2196F3',
    marginTop: 8,
  },
  printerList: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  printerItemContent: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  printerAddress: {
    fontSize: 14,
    color: '#666',
  },
  printerSerial: {
    fontSize: 12,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOptionButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  optionButtonText: {
    fontSize: 14,
  },
  selectedOptionButtonText: {
    color: '#fff',
  },
});

export default BrotherPrinterSetupScreen;
