// src/hooks/usePrinter.ts
import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  usePrintersDiscovery, 
  Printer, 
  DiscoveryPortType, 
  DiscoveryFilterOption,
  PrinterStatus
} from 'react-native-esc-pos-printer';

export interface PrintReceiptParams {
  businessName: string;
  orderNumber: string;
  customerName: string;
  pickupDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
}

export const usePrinter = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingError, setIsPrintingError] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<any | null>(null);
  
  // Use the discovery hook from the library
  const { 
    start,
    isDiscovering,
    printers,
    printerError
  } = usePrintersDiscovery();

  // Discover available printers
  const discoverPrinters = useCallback(async () => {
    try {
      await start({
        timeout: 10000, // 10 seconds timeout
        filterOption: {
          portType: DiscoveryPortType.PORTTYPE_ALL, // Search all port types
        },
      });
    } catch (error) {
      console.error('Error discovering printers:', error);
      setIsPrintingError(true);
    }
  }, [start]);

  // Connect to a specific printer
  const connectToPrinter = useCallback(async (printer: any) => {
    try {
      setIsPrinting(true);
      setIsPrintingError(false);
      
      // Connect to the printer
      const status = await printer.connect();
      
      if (status.connection === PrinterStatus.SUCCESS) {
        setSelectedPrinter(printer);
        setIsPrinting(false);
        return true;
      } else {
        console.error('Failed to connect to printer:', status);
        setIsPrintingError(true);
        setIsPrinting(false);
        return false;
      }
    } catch (error) {
      console.error('Error connecting to printer:', error);
      setIsPrintingError(true);
      setIsPrinting(false);
      return false;
    }
  }, []);

  // Disconnect from the current printer
  const disconnectPrinter = useCallback(async () => {
    if (selectedPrinter) {
      try {
        await selectedPrinter.disconnect();
        setSelectedPrinter(null);
        return true;
      } catch (error) {
        console.error('Error disconnecting printer:', error);
        return false;
      }
    }
    return true;
  }, [selectedPrinter]);

  // Print receipt to connected printer
  const printReceipt = useCallback(async (data: PrintReceiptParams) => {
    if (!selectedPrinter && printers.length > 0) {
      // Try to connect to the first available printer if none selected
      const connected = await connectToPrinter(printers[0]);
      if (!connected) {
        Alert.alert('Printer Error', 'Could not connect to printer. Please try again.');
        return false;
      }
    } else if (!selectedPrinter) {
      // No printer available, try to discover
      Alert.alert('No Printer', 'No printer found. Would you like to search for printers?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Search',
          onPress: discoverPrinters,
        },
      ]);
      return false;
    }

    if (!selectedPrinter) {
      return false;
    }

    try {
      setIsPrinting(true);
      setIsPrintingError(false);

      // Format the receipt
      const builder = selectedPrinter.getBuilder();
      
      // Add receipt header
      builder.addTextAlign(builder.ALIGN.CENTER);
      builder.addTextSize(2, 2);
      builder.addText(data.businessName + '\n');
      builder.addTextSize(1, 1);
      builder.addText('RECEIPT\n');
      builder.addText('Order #: ' + data.orderNumber + '\n');
      builder.addText('Date: ' + new Date().toLocaleDateString() + '\n\n');
      
      // Add customer info
      builder.addTextAlign(builder.ALIGN.LEFT);
      builder.addTextStyle(false, false, true, false); // Bold
      builder.addText('CUSTOMER\n');
      builder.addTextStyle(false, false, false, false); // Reset
      builder.addText('--------------------------------\n');
      builder.addText(data.customerName + '\n');
      builder.addText('Pickup Date: ' + data.pickupDate + '\n\n');
      
      // Add items
      builder.addTextStyle(false, false, true, false); // Bold
      builder.addText('ITEMS\n');
      builder.addTextStyle(false, false, false, false); // Reset
      builder.addText('--------------------------------\n');
      
      // Add column headers
      builder.addTextAlign(builder.ALIGN.LEFT);
      builder.addTextStyle(false, false, true, false); // Bold
      builder.addText('Item                  Qty    Price\n');
      builder.addTextStyle(false, false, false, false); // Reset
      
      // Add each item
      data.items.forEach(item => {
        // Format the item name to fit within 20 characters
        const name = item.name.length > 18 
          ? item.name.substring(0, 15) + '...' 
          : item.name.padEnd(18, ' ');
        
        const qty = String(item.quantity).padStart(3, ' ');
        const price = `$${(item.price * item.quantity).toFixed(2)}`.padStart(7, ' ');
        
        builder.addText(`${name} ${qty}  ${price}\n`);
      });
      
      builder.addText('\n');
      
      // Add summary
      builder.addTextStyle(false, false, true, false); // Bold
      builder.addText('SUMMARY\n');
      builder.addTextStyle(false, false, false, false); // Reset
      builder.addText('--------------------------------\n');
      
      // Right align the prices
      builder.addTextAlign(builder.ALIGN.LEFT);
      builder.addText(`Subtotal:${' '.repeat(24)}$${data.subtotal.toFixed(2)}\n`);
      builder.addText(`Tax:${' '.repeat(29)}$${data.tax.toFixed(2)}\n`);
      builder.addText(`Tip:${' '.repeat(29)}$${data.tip.toFixed(2)}\n`);
      builder.addText('--------------------------------\n');
      
      // Add total
      builder.addTextStyle(false, false, true, false); // Bold
      builder.addText(`TOTAL:${' '.repeat(26)}$${data.total.toFixed(2)}\n\n`);
      builder.addTextStyle(false, false, false, false); // Reset
      
      // Add payment method
      const formattedPaymentMethod = data.paymentMethod
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      builder.addText(`Payment Method: ${formattedPaymentMethod}\n\n`);
      
      // Add footer
      builder.addTextAlign(builder.ALIGN.CENTER);
      builder.addText('Thank you for your business!\n');
      builder.addText('Please present this receipt\n');
      builder.addText('when picking up your order.\n');
      
      // Add space at the end and cut
      builder.addFeedLine(4);
      builder.addCut(builder.CUT.FEED);
      
      // Print the receipt
      const result = await selectedPrinter.print(builder);
      
      if (result.status !== PrinterStatus.SUCCESS) {
        console.error('Error printing receipt:', result);
        setIsPrintingError(true);
        setIsPrinting(false);
        return false;
      }
      
      setIsPrinting(false);
      return true;
    } catch (error) {
      console.error('Error printing receipt:', error);
      setIsPrintingError(true);
      setIsPrinting(false);
      return false;
    }
  }, [selectedPrinter, printers, connectToPrinter, discoverPrinters]);

  // Print to console for debug/simulator
  const printToConsole = useCallback((data: PrintReceiptParams) => {
    console.log('\n======================================');
    console.log(`             ${data.businessName}`);
    console.log('               RECEIPT');
    console.log(`         Order #: ${data.orderNumber}`);
    console.log(`         Date: ${new Date().toLocaleDateString()}`);
    console.log('======================================');
    console.log('CUSTOMER');
    console.log('--------------------------------------');
    console.log(`${data.customerName}`);
    console.log(`Pickup Date: ${data.pickupDate}`);
    console.log('\nITEMS');
    console.log('--------------------------------------');
    console.log('Item                 Qty    Price');
    
    data.items.forEach(item => {
      const name = item.name.length > 18 ? item.name.substring(0, 15) + '...' : item.name.padEnd(18, ' ');
      const qty = String(item.quantity).padStart(3, ' ');
      const price = `$${(item.price * item.quantity).toFixed(2).padStart(7, ' ')}`;
      console.log(`${name} ${qty}  ${price}`);
    });
    
    console.log('\nSUMMARY');
    console.log('--------------------------------------');
    console.log(`Subtotal:${' '.repeat(24)}$${data.subtotal.toFixed(2)}`);
    console.log(`Tax:${' '.repeat(29)}$${data.tax.toFixed(2)}`);
    console.log(`Tip:${' '.repeat(29)}$${data.tip.toFixed(2)}`);
    console.log('--------------------------------------');
    console.log(`TOTAL:${' '.repeat(26)}$${data.total.toFixed(2)}`);
    
    // Payment method
    const formattedPaymentMethod = data.paymentMethod
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
      
    console.log(`Payment Method: ${formattedPaymentMethod}`);
    console.log('\n       Thank you for your business!');
    console.log('     Please present this receipt');
    console.log('     when picking up your order.');
    console.log('======================================\n');

    return true;
  }, []);

  // Handle printing - use real printer on device, console on simulator
  const handlePrint = useCallback(async (data: PrintReceiptParams) => {
    // Check if running in simulator
    if (__DEV__ && Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV) {
      // In iOS simulator, just print to console
      console.log('Running in simulator - printing to console');
      return printToConsole(data);
    } else if (__DEV__ && Platform.OS === 'android' && !Platform.isTV) {
      // In Android simulator, just print to console
      console.log('Running in simulator - printing to console');
      return printToConsole(data);
    } else {
      // On real device, use the printer
      return await printReceipt(data);
    }
  }, [printReceipt, printToConsole]);

  return {
    isPrinting,
    isPrintingError,
    isDiscovering,
    printers,
    selectedPrinter,
    discoverPrinters,
    connectToPrinter,
    disconnectPrinter,
    printReceipt,
    printToConsole,
    handlePrint
  };
};