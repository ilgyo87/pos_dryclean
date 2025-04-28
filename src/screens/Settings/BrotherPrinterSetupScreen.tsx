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
import BrotherPrinterService, { 
  BrotherPrinterConfig, 
  DEFAULT_BROTHER_CONFIG,
  BrotherPrinterStatus
} from '../../utils/BrotherPrinterService';
import { useBrotherDiscoveryAutoConnect } from './useBrotherDiscoveryAutoConnect';
import { requestBluetoothPermissions } from '../../utils/PermissionHandler';

const BrotherPrinterSetupScreen: React.FC = () => {
  // State for printer configuration
  const [config, setConfig] = useState<BrotherPrinterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [foundPrinters, setFoundPrinters] = useState<any[]>([]);
  const [manualAddress, setManualAddress] = useState('');
  const [manualMacAddress, setManualMacAddress] = useState('');
  const [manualSerialNumber, setManualSerialNumber] = useState('');
  const [printerStatus, setPrinterStatus] = useState<BrotherPrinterStatus>(BrotherPrinterStatus.DISCONNECTED);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Paper size and type options
  const [selectedPaperSize, setSelectedPaperSize] = useState<BrotherPrinterConfig['paperSize']>('62mm');
  const [selectedLabelType, setSelectedLabelType] = useState<BrotherPrinterConfig['labelType']>('die-cut');
  const [highQuality, setHighQuality] = useState(true);
  const [orientation, setOrientation] = useState<BrotherPrinterConfig['orientation']>('portrait');

  // Use auto-connect discovery hook
  useBrotherDiscoveryAutoConnect({
    setFoundPrinters,
    setConfig,
    setPrinterStatus,
    selectedPaperSize,
    selectedLabelType,
    orientation,
    highQuality,
    config,
    printerStatus,
  });

  // Handler for resetting printer config
  const handleResetPrinterConfig = async () => {
    try {
      setIsResetting(true);
      await BrotherPrinterService.resetConfig();
      setConfig(null);
      setFoundPrinters([]);
      setManualAddress('');
      setManualMacAddress('');
      setManualSerialNumber('');
      setSelectedPaperSize('62mm');
      setSelectedLabelType('die-cut');
      setHighQuality(true);
      setOrientation('portrait');
      setPrinterStatus(BrotherPrinterStatus.DISCONNECTED);
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
    
    // Clean up printer listener when component unmounts
    return () => {
      BrotherPrinterService.disconnect();
    };
  }, []);

  // Function to load printer configuration and status
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // Initialize printer service
      await BrotherPrinterService.initialize();
      
      // Get saved configuration
      const savedConfig = BrotherPrinterService.getConfig();
      if (savedConfig) {
        setConfig(savedConfig);
        setSelectedPaperSize(savedConfig.paperSize);
        setSelectedLabelType(savedConfig.labelType);
        setHighQuality(savedConfig.highQuality);
        setOrientation(savedConfig.orientation);
      } else {
        setConfig(null);
      }
      // Get current status
      const status = BrotherPrinterService.getStatus();
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
      const printers = await BrotherPrinterService.searchPrinters();
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
      
      // Create configuration from selected printer
      const newConfig: BrotherPrinterConfig = {
        address: printer.address,
        macAddress: printer.connectionType === 'bluetooth' ? printer.address : undefined,
        serialNumber: printer.serialNumber,
        model: printer.model,
        connectionType: printer.connectionType,
        paperSize: selectedPaperSize,
        labelType: selectedLabelType,
        orientation,
        highQuality,
      };
      
      // Save configuration
      await BrotherPrinterService.saveConfig(newConfig);
      
      // Always (re-)initialize to update status
      await BrotherPrinterService.initialize();
      await loadConfig();
      
      const status = BrotherPrinterService.getStatus();
      if (status.status === BrotherPrinterStatus.CONNECTED) {
        Alert.alert('Connected', `Successfully connected to ${printer.model}`);
      } else {
        throw new Error(status.error || 'Failed to connect to printer');
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      Alert.alert('Connection Error', `Failed to connect to printer: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a manual printer (robust manual connect)
  const handleAddManualPrinter = async () => {
    if (!manualAddress) {
      Alert.alert('Input Required', 'Please enter an address for the printer');
      return;
    }
    try {
      setIsLoading(true);
      // Use new robust connectToPrinter method
      const connectionType = manualAddress.includes(':') ? 'bluetooth' : 'wifi';
      const connected = await BrotherPrinterService.connectToPrinter(
        manualAddress,
        connectionType,
        manualSerialNumber || undefined
      );
      await loadConfig();
      const status = BrotherPrinterService.getStatus();
      if (connected && status.status === BrotherPrinterStatus.CONNECTED) {
        Alert.alert('Connected', 'Successfully connected to printer');
        setManualAddress('');
        setManualMacAddress('');
        setManualSerialNumber('');
      } else {
        throw new Error(status.error || 'Failed to connect to printer');
      }
    } catch (error) {
      console.error('Error adding manual printer:', error);
      Alert.alert('Connection Error', `Failed to connect to printer: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle paper size changes directly from the status card
  const handlePaperSizeChange = async (newSize: BrotherPrinterConfig['paperSize']) => {
    if (!config) return;
    
    try {
      setIsLoading(true);
      
      // Create updated config
      const updatedConfig: BrotherPrinterConfig = {
        ...config,
        paperSize: newSize,
      };
      
      // Save the updated config
      await BrotherPrinterService.saveConfig(updatedConfig);
      
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

  // Print a test label with robust recovery approach
  const handlePrintTest = async () => {
    try {
      setIsLoading(true);
      
      // First - attempt to force reconnect to the printer
      // This is a more aggressive approach for iOS connection issues
      if (config && config.address) {
        // Show reconnection feedback to the user
        Alert.alert(
          'Reconnecting to Printer',
          'Attempting to refresh the printer connection before printing. This may take a moment...',
          [{ text: 'OK' }]
        );
        
        // Force disconnect
        await BrotherPrinterService.disconnect();
        
        // Wait a bit longer
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reconnect with fresh connection
        const connectionType = config.connectionType || 'wifi';
        const reconnected = await BrotherPrinterService.connectToPrinter(
          config.address,
          connectionType as 'wifi' | 'bluetooth',
          config.serialNumber
        );
        
        // Check if we're really reconnected 
        await loadConfig();
        const status = BrotherPrinterService.getStatus();
        
        if (!reconnected || status.status !== BrotherPrinterStatus.CONNECTED) {
          throw new Error('Failed to reconnect to printer. Please check printer power and network connection.');
        }
        
        // If reconnection worked, show printing feedback
        Alert.alert(
          'Printing Test Label',
          'Reconnected successfully. Sending test label to printer with minimal settings.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Printing Test Label',
          'Sending test label to printer. This may take a few moments.',
          [{ text: 'OK' }]
        );
      }
      
      // Attempt to print with minimal settings (most reliable approach)
      const success = await BrotherPrinterService.printTestLabel();
      await loadConfig();
      
      if (success) {
        Alert.alert('Success', 'Test label printed successfully. If you do not see the label, please check:' +
          '\n\n1. Printer is powered on and has paper loaded' +
          '\n2. Correct label type (die-cut vs continuous) is selected' +
          '\n3. Printer is not showing any errors (paper jam, etc.)');
      } else {
        const status = BrotherPrinterService.getStatus();
        throw new Error(status.error || 'Failed to print test label');
      }
    } catch (error) {
      console.error('Error printing test label:', error);
      
      // Provide specific help for the connection reset issue
      const errorMsg = (error as Error).toString().toLowerCase();
      let helpfulMessage = 'Failed to print test label. ';
      
      if (errorMsg.includes('reset') || errorMsg.includes('connection reset by peer')) {
        helpfulMessage = 'The iOS "Connection reset by peer" error occurred. This is a common iOS network issue with Brother printers.\n\n' +
          'Please try these specific steps:\n\n' +
          '1. Power cycle your printer (turn it off, wait 10 seconds, turn it on)\n' +
          '2. Verify the printer is showing ONLINE/READY on its display\n' +
          '3. Check that your device and printer are on the same WiFi network\n' +
          '4. If using WiFi, try entering the printer\'s IP address manually\n' +
          '5. If possible, try connecting via Bluetooth instead of WiFi\n' +
          '6. As a last resort, try restarting this app and your device';
      } else if (errorMsg.includes('connection')) {
        helpfulMessage += 'There was a connection problem with the printer. Please try these steps:\n\n' +
          '1. Ensure printer is powered on\n' +
          '2. Confirm printer is in online mode (not showing any errors)\n' +
          '3. For network printers, verify it is on the same network as your device\n' +
          '4. Try disconnecting and reconnecting to the printer';
      } else if (errorMsg.includes('timeout')) {
        helpfulMessage += 'The print operation timed out. This could be due to:\n\n' +
          '1. Poor network connection\n' +
          '2. Printer being in sleep mode\n' +
          '3. Printer having paper or other hardware issues';
      } else if (errorMsg.includes('paper') || errorMsg.includes('media')) {
        helpfulMessage += 'There seems to be an issue with the printer paper/media. Please check:\n\n' +
          '1. Paper is loaded correctly\n' +
          '2. The correct paper size is selected in settings\n' +
          '3. Paper isn\'t jammed';
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
        {(['29mm', '38mm', '50mm', '54mm', '62mm'] as BrotherPrinterConfig['paperSize'][]).map((size) => (
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

  // Label type selection component
  const LabelTypeSelection = () => (
    <View style={styles.optionSection}>
      <Text style={styles.sectionTitle}>Label Type</Text>
      <View style={styles.optionButtons}>
        {(['die-cut', 'continuous'] as BrotherPrinterConfig['labelType'][]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.optionButton,
              selectedLabelType === type && styles.selectedOptionButton
            ]}
            onPress={() => setSelectedLabelType(type)}
          >
            <Text style={[
              styles.optionButtonText,
              selectedLabelType === type && styles.selectedOptionButtonText
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Orientation selection component
  const OrientationSelection = () => (
    <View style={styles.optionSection}>
      <Text style={styles.sectionTitle}>Orientation</Text>
      <View style={styles.optionButtons}>
        {(['portrait', 'landscape'] as BrotherPrinterConfig['orientation'][]).map((orient) => (
          <TouchableOpacity
            key={orient}
            style={[
              styles.optionButton,
              orientation === orient && styles.selectedOptionButton
            ]}
            onPress={() => setOrientation(orient)}
          >
            <Text style={[
              styles.optionButtonText,
              orientation === orient && styles.selectedOptionButtonText
            ]}>
              {orient.charAt(0).toUpperCase() + orient.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Quality toggle component
  const QualityToggle = () => (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>High Quality Print</Text>
      <Switch
        value={highQuality}
        onValueChange={setHighQuality}
        trackColor={{ false: '#ccc', true: '#bfe3ff' }}
        thumbColor={highQuality ? '#007bff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Printer Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[
                styles.statusValue,
                printerStatus === BrotherPrinterStatus.CONNECTED && styles.statusConnected,
                printerStatus === BrotherPrinterStatus.ERROR && styles.statusError
              ]}>
                {printerStatus === BrotherPrinterStatus.CONNECTED ? 'Connected' :
                 printerStatus === BrotherPrinterStatus.CONNECTING ? 'Connecting...' :
                 printerStatus === BrotherPrinterStatus.ERROR ? 'Error' : 'Disconnected'}
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
                  <Text style={styles.statusLabel}>Connection:</Text>
                  <Text style={styles.statusValue}>{config.connectionType}</Text>
                </View>
                {/* Paper size dropdown in status section when connected */}
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Paper:</Text>
                  <View style={styles.paperSizePickerContainer}>
                    <TouchableOpacity 
                      style={styles.paperSizePicker}
                      onPress={() => {
                        // Create alert with paper size options
                        Alert.alert(
                          'Select Paper Size',
                          'Choose the paper size loaded in your printer:',
                          [
                            { text: '29mm', onPress: () => handlePaperSizeChange('29mm') },
                            { text: '38mm', onPress: () => handlePaperSizeChange('38mm') },
                            { text: '50mm', onPress: () => handlePaperSizeChange('50mm') },
                            { text: '54mm', onPress: () => handlePaperSizeChange('54mm') },
                            { text: '62mm', onPress: () => handlePaperSizeChange('62mm') },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.paperSizeText}>
                        {config.paperSize} {config.labelType} ({config.orientation})
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
            
            {statusError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{statusError}</Text>
              </View>
            )}
          </View>
          
          {/* Reset Printer Config Button */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetPrinterConfig}
            disabled={isResetting || isLoading}
          >
            {isResetting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="restore" size={18} color="#fff" />
                <Text style={styles.resetButtonText}>Reset Printer Config</Text>
              </>
            )}
          </TouchableOpacity>

          {config && printerStatus === BrotherPrinterStatus.CONNECTED && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handlePrintTest}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="print" size={18} color="#fff" />
                  <Text style={styles.testButtonText}>Print Test Label</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Search for Printers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search for Printers</Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchPrinters}
            disabled={isSearching}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="search" size={18} color="#fff" />
                <Text style={styles.searchButtonText}>Search for Brother Printers</Text>
              </>
            )}
          </TouchableOpacity>
          
          {foundPrinters.length > 0 && (
            <View style={styles.printerList}>
              <Text style={styles.subsectionTitle}>Available Printers</Text>
              {foundPrinters.map((printer, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.printerItem}
                  onPress={() => handleConnectPrinter(printer)}
                  disabled={isLoading}
                >
                  <View style={styles.printerInfo}>
                    <Text style={styles.printerName}>{printer.model || 'Brother Printer'}</Text>
                    <Text style={styles.printerAddress}>
                      {printer.address} ({printer.connectionType})
                    </Text>
                  </View>
                  <MaterialIcons name="add-circle" size={24} color="#007bff" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Manual Setup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Setup</Text>
          <Text style={styles.inputLabel}>Printer Address (IP or Bluetooth MAC)</Text>
          <TextInput
            style={styles.input}
            value={manualAddress}
            onChangeText={setManualAddress}
            placeholder="192.168.1.100 or 00:11:22:33:44:55"
            autoCapitalize="none"
          />
          <Text style={styles.inputLabel}>MAC Address (optional)</Text>
          <TextInput
            style={styles.input}
            value={manualMacAddress}
            onChangeText={setManualMacAddress}
            placeholder="00:11:22:33:44:55"
            autoCapitalize="none"
          />
          <Text style={styles.inputLabel}>Serial Number (optional)</Text>
          <TextInput
            style={styles.input}
            value={manualSerialNumber}
            onChangeText={setManualSerialNumber}
            placeholder="E.g. E12345A6789B"
            autoCapitalize="characters"
          />
          {/* Paper size selection */}
          <PaperSizeSelection />
          {/* Label type selection */}
          <LabelTypeSelection />
          {/* Orientation selection */}
          <OrientationSelection />
          
          {/* Quality toggle */}
          <QualityToggle />
          
          <TouchableOpacity
            style={[styles.addButton, !manualAddress && styles.disabledButton]}
            onPress={handleAddManualPrinter}
            disabled={!manualAddress || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add Printer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brother QL-820NWB Setup Help</Text>
          <Text style={styles.instructionText}>
            1. Make sure your Brother QL-820NWB printer is powered on.{"\n"}
            2. If connecting via Bluetooth, ensure the printer is in pairing mode (press Wi-Fi/Bluetooth button until blue light flashes).{"\n"}
            3. If connecting via Wi-Fi, ensure the printer is connected to the same network as this device.{"\n"}
            4. Use the search function to discover nearby printers, or enter the printer's address manually.{"\n"}
            5. Configure the paper size and type to match the labels loaded in your printer.{"\n"}
            6. Print a test label to verify the connection and settings.
          </Text>
          
          <Text style={styles.sectionTitle}>Troubleshooting</Text>
          <Text style={styles.instructionText}>
            • If the printer is not discovered, try restarting both the printer and this app.{"\n"}
            • For Wi-Fi connection, you can manually enter the printer's IP address (found in printer network settings).{"\n"}
            • For Bluetooth connection, make sure Bluetooth is enabled on your device and the printer is in pairing mode.{"\n"}
            • If test labels don't print, check that the correct paper size is selected and paper is loaded properly.{"\n"}
            • For connection errors, verify that the printer is on the same network or within Bluetooth range.{"\n"}
            • If the printer was working before but stopped, try removing it and adding it again.
          </Text>
          
          <Text style={styles.sectionTitle}>Label Printing Tips</Text>
          <Text style={styles.instructionText}>
            • Die-cut labels: These have pre-cut shapes and require precise alignment.{"\n"}
            • Continuous labels: These allow custom length labels but require manual cutting.{"\n"}
            • Paper size must match what's loaded in the printer (common sizes: 29mm, 62mm).{"\n"}
            • High quality mode produces better text and QR codes but prints slower.{"\n"}
            • If labels are printing too small or large, try changing the orientation setting.{"\n"}
            • Make sure to keep the printer clean and free from dust or adhesive buildup.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BrotherPrinterSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fa',
  },
  content: {
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statusConnected: {
    color: '#4CAF50',
  },
  statusError: {
    color: '#F44336',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  testButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  printerList: {
    marginTop: 8,
  },
  printerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 12,
    color: '#666',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  optionSection: {
    marginBottom: 16,
  },
  optionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedOptionButton: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: '#0D47A1',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});