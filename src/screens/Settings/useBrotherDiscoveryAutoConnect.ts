import { useEffect } from 'react';
import { Alert } from 'react-native';
import SimpleBrotherPrinter, { PrinterStatus, PrinterConfig } from '../../utils/SimpleBrotherPrinter';

// Device type fallback
type Device = any;

/**
 * Custom hook to auto-connect to a discovered Brother printer and update config/state.
 * Simplified version for use with SimpleBrotherPrinter implementation.
 */
export function useBrotherDiscoveryAutoConnect({
  setFoundPrinters,
  setConfig,
  setPrinterStatus,
  selectedPaperSize,
  config,
  printerStatus
}: {
  setFoundPrinters: (printers: Device[]) => void;
  setConfig: (config: PrinterConfig | null) => void;
  setPrinterStatus: (status: PrinterStatus) => void;
  selectedPaperSize: string;
  config: PrinterConfig | null;
  printerStatus: PrinterStatus;
}) {
  useEffect(() => {
    // Function to handle printer discovery events
    const handleDiscovery = async (printers: Device[]) => {
      console.log('[useBrotherDiscoveryAutoConnect] Discovery event:', printers);
      
      // Update the list of found printers
      setFoundPrinters(printers);
      
      // Auto-connect if exactly one printer is found
      if (printers.length === 1) {
        const printer = printers[0];
        
        // Only auto-connect if not already connected to this printer
        if (
          !config ||
          config.address !== printer.ipAddress ||
          printerStatus !== PrinterStatus.CONNECTED
        ) {
          console.log('[useBrotherDiscoveryAutoConnect] Auto-connecting to discovered printer');
          
          // Create a new printer configuration
          const newConfig: PrinterConfig = {
            address: printer.ipAddress,
            serialNumber: printer.serialNumber,
            model: printer.modelName || printer.printerName || 'Brother Printer',
            paperSize: selectedPaperSize as PrinterConfig['paperSize'],
          };
          
          console.log('[useBrotherDiscoveryAutoConnect] Generated config:', newConfig);
          
          try {
            // Connect to the printer
            const connected = await SimpleBrotherPrinter.connectToPrinter(
              newConfig.address,
              newConfig.model,
              newConfig.serialNumber
            );
            
            if (connected) {
              // Update the configuration with paper size
              await SimpleBrotherPrinter.saveConfig({
                ...newConfig,
                paperSize: selectedPaperSize as PrinterConfig['paperSize']
              });
              
              // Update state
              setConfig(newConfig);
              setPrinterStatus(PrinterStatus.CONNECTED);
              
              console.log('[useBrotherDiscoveryAutoConnect] Connected successfully to:', newConfig.model);
              Alert.alert('Printer Connected', `Automatically connected to ${newConfig.model}`);
            } else {
              setPrinterStatus(PrinterStatus.ERROR);
              console.warn('[useBrotherDiscoveryAutoConnect] Failed to connect to printer');
              Alert.alert('Auto-Connect Failed', 'Could not connect to printer. Please check the printer and try again.');
            }
          } catch (error) {
            setPrinterStatus(PrinterStatus.ERROR);
            console.error('[useBrotherDiscoveryAutoConnect] Connection error:', error);
            Alert.alert('Connection Error', `An error occurred while connecting to printer: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          // Already connected to the correct printer
          console.log('[useBrotherDiscoveryAutoConnect] Already connected to the correct printer, skipping auto-connect.');
        }
      }
    };

    // Set up a one-time search for printers
    const searchPrinters = async () => {
      try {
        const printers = await SimpleBrotherPrinter.searchPrinters();
        handleDiscovery(printers);
      } catch (error) {
        console.error('[useBrotherDiscoveryAutoConnect] Error searching for printers:', error);
      }
    };
    
    // Start the search
    searchPrinters();
    
    // No cleanup needed since we're not registering a callback
    return () => {};
  }, [setFoundPrinters, setConfig, setPrinterStatus, selectedPaperSize, config, printerStatus]);
}
