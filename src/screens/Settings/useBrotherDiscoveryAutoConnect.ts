import { useEffect } from 'react';
import { Alert } from 'react-native';
import BrotherPrinterService, { BrotherPrinterStatus } from '../../utils/BrotherPrinterService';
import type { BrotherPrinterConfig } from '../../utils/BrotherPrinterService';
// Device type fallback if not exported
// type Device = any;
type Device = any;

/**
 * Custom hook to auto-connect to a discovered Brother printer and update config/state.
 * Handles all logic for auto-config and connection in response to discovery events.
 */
export function useBrotherDiscoveryAutoConnect({
  setFoundPrinters,
  setConfig,
  setPrinterStatus,
  selectedPaperSize,
  selectedLabelType,
  orientation,
  highQuality,
  config,
  printerStatus
}: {
  setFoundPrinters: (printers: Device[]) => void;
  setConfig: (config: BrotherPrinterConfig | null) => void;
  setPrinterStatus: (status: BrotherPrinterStatus) => void;
  selectedPaperSize: string;
  selectedLabelType: string;
  orientation: string;
  highQuality: boolean;
  config: BrotherPrinterConfig | null;
  printerStatus: BrotherPrinterStatus;
}) {
  useEffect(() => {
    const discoveryHandler = async (printers: Device[]) => {
      console.log('[useBrotherDiscoveryAutoConnect] Discovery event:', printers);
      setFoundPrinters(printers);
      if (printers.length === 1) {
        const printer = printers[0];
        // GUARD: only auto-config if not already configured/connected to this printer
        if (
          !config ||
          config.address !== printer.ipAddress ||
          printerStatus !== BrotherPrinterStatus.CONNECTED
        ) {
          setPrinterStatus(BrotherPrinterStatus.DISCONNECTED);
          setConfig(null);
          console.log('[useBrotherDiscoveryAutoConnect] Resetting printer state after discovery');
          const autoConfig: BrotherPrinterConfig = {
            address: printer.ipAddress,
            macAddress: printer.macAddress,
            serialNumber: printer.serialNumber,
            model: printer.modelName || printer.printerName || '',
            connectionType: 'wifi',
            paperSize: selectedPaperSize as BrotherPrinterConfig['paperSize'],
            labelType: selectedLabelType as BrotherPrinterConfig['labelType'],
            orientation: orientation as BrotherPrinterConfig['orientation'],
            highQuality,
          };
          console.log('[useBrotherDiscoveryAutoConnect] Generated config from discovered printer:', autoConfig);
          try {
            await BrotherPrinterService.saveConfig(autoConfig);
            console.log('[useBrotherDiscoveryAutoConnect] Config saved successfully');
          } catch (error) {
            console.error('[useBrotherDiscoveryAutoConnect] Error saving config:', error);
          }
          setConfig(autoConfig);
          console.log('[useBrotherDiscoveryAutoConnect] Config saved and set, attempting connection...');
          try {
            const connected = await BrotherPrinterService.connectToPrinter(
              autoConfig.address,
              autoConfig.connectionType,
              autoConfig.serialNumber
            );
            if (connected) {
              setPrinterStatus(BrotherPrinterStatus.CONNECTED);
              console.log('[useBrotherDiscoveryAutoConnect] Connected to printer successfully:', autoConfig.model);
              Alert.alert('Printer Connected', `Automatically connected to ${autoConfig.model}`);
            } else {
              setPrinterStatus(BrotherPrinterStatus.ERROR);
              console.warn('[useBrotherDiscoveryAutoConnect] Failed to connect to printer:', autoConfig.model);
              Alert.alert('Auto-Connect Failed', `Could not connect to ${autoConfig.model}. Please check the printer and try again.`);
            }
          } catch (connectError) {
            setPrinterStatus(BrotherPrinterStatus.ERROR);
            console.error('[useBrotherDiscoveryAutoConnect] Error connecting to printer:', connectError);
            Alert.alert('Connection Error', `An error occurred while connecting to printer: ${connectError instanceof Error ? connectError.message : String(connectError)}`);
          }
          console.log('[useBrotherDiscoveryAutoConnect] Discovery/config/connection flow complete.');
        } else {
          // Already connected to the correct printer, do nothing
          console.log('[useBrotherDiscoveryAutoConnect] Already connected to the correct printer, skipping auto-connect.');
        }
      }
    };
    BrotherPrinterService.registerDiscoveryCallback(discoveryHandler);
    BrotherPrinterService.searchPrinters();
    return () => BrotherPrinterService.removeDiscoveryCallback(discoveryHandler);
  }, [setFoundPrinters, setConfig, setPrinterStatus, selectedPaperSize, selectedLabelType, orientation, highQuality, config, printerStatus]);
}
