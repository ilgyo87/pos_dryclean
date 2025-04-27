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
import { requestBluetoothPermissions } from '../../utils/PermissionHandler';

const BrotherPrinterSetupScreen: React.FC = () => {
  // State for printer configuration
  const [config, setConfig] = useState<BrotherPrinterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [foundPrinters, setFoundPrinters] = useState<any[]>([]);
  const [manualAddress, setManualAddress] = useState('');
  const [printerStatus, setPrinterStatus] = useState<BrotherPrinterStatus>(BrotherPrinterStatus.DISCONNECTED);
  const [statusError, setStatusError] = useState<string | null>(null);
  
  // Paper size and type options
  const [selectedPaperSize, setSelectedPaperSize] = useState<BrotherPrinterConfig['paperSize']>('62mm');
  const [selectedLabelType, setSelectedLabelType] = useState<BrotherPrinterConfig['labelType']>('die-cut');
  const [highQuality, setHighQuality] = useState(true);
  const [orientation, setOrientation] = useState<BrotherPrinterConfig['orientation']>('portrait');

  // Load initial configuration on mount
  useEffect(() => {
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
    
    loadConfig();
  }, []);

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
      await loadConfig(); // closure-scoped loadConfig defined in the component, not an import
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

  // Add a manual printer
  const handleAddManualPrinter = async () => {
    if (!manualAddress) {
      Alert.alert('Input Required', 'Please enter an address for the printer');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create configuration from manual input
      const newConfig: BrotherPrinterConfig = {
        address: manualAddress,
        model: 'QL-820NWB', // Default model
        connectionType: manualAddress.includes(':') ? 'bluetooth' : 'wifi',
        paperSize: selectedPaperSize,
        labelType: selectedLabelType,
        orientation,
        highQuality,
      };
      
      // Save configuration
      await BrotherPrinterService.saveConfig(newConfig);
      // Always (re-)initialize to update status
      await BrotherPrinterService.initialize();
      await loadConfig(); // closure-scoped loadConfig defined in the component, not an import
      const status = BrotherPrinterService.getStatus();
      if (status.status === BrotherPrinterStatus.CONNECTED) {
        Alert.alert('Connected', 'Successfully connected to printer');
        setManualAddress('');
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

  // Print a test label
  const handlePrintTest = async () => {
    try {
      setIsLoading(true);
      const success = await BrotherPrinterService.printTestLabel();
      await loadConfig(); // closure-scoped loadConfig defined in the component, not an import
      if (success) {
        Alert.alert('Success', 'Test label printed successfully');
      } else {
        const status = BrotherPrinterService.getStatus();
        throw new Error(status.error || 'Failed to print test label');
      }
    } catch (error) {
      console.error('Error printing test label:', error);
      Alert.alert('Print Error', `Failed to print test label: ${error}`);
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
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Paper:</Text>
                  <Text style={styles.statusValue}>
                    {config.paperSize} {config.labelType} ({config.orientation})
                  </Text>
                </View>
              </>
            )}
            
            {statusError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{statusError}</Text>
              </View>
            )}
          </View>
          
          {config && printerStatus === BrotherPrinterStatus.CONNECTED && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handlePrintTest}
              disabled={isLoading}
            >
              <MaterialIcons name="print" size={18} color="#fff" />
              <Text style={styles.testButtonText}>Print Test Label</Text>
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
            2. If connecting via Bluetooth, ensure the printer is in pairing mode.{"\n"}
            3. If connecting via Wi-Fi, ensure the printer is connected to the same network as this device.{"\n"}
            4. Use the search function to discover nearby printers, or enter the printer's address manually.{"\n"}
            5. Configure the paper size and type to match the labels loaded in your printer.{"\n"}
            6. Print a test label to verify the connection and settings.
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