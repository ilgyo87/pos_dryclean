// src/hooks/useBarcodeScanning.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { parseBarcodeValue, findProductInOrder, areAllItemsTicketed } from '../utils/OrderBarcodeUtils';

/**
 * Hook for managing barcode scanning functionality
 * @param items Products to scan
 * @param customerId Customer ID for validation
 * @param autoFocus Whether to automatically focus
 * @returns Barcode scanning state and handlers
 */
export function useBarcodeScanning(
  items: Product[],
  customerId: string,
  autoFocus: boolean = true
) {
  // State
  const [scannedItems, setScannedItems] = useState<Set<string>>(new Set());
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  
  // Track timeout for last scan
  const timeoutRef = useRef<number | null>(null);

  // Clear last scanned after delay
  const clearLastScanned = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setLastScanned(null);
    }, 3000); // Clear after 3 seconds
  }, []);

  // Enable/disable scanning
  const toggleScanning = useCallback((enabled: boolean) => {
    setScanning(enabled);
    
    if (!enabled && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Process a scanned barcode
  const processScan = useCallback((barcodeValue: string): boolean => {
    // Skip if duplicate scan
    if (barcodeValue === lastScanned) {
      return false;
    }
    
    // Parse the barcode value
    const parsed = parseBarcodeValue(barcodeValue);
    if (!parsed) {
      setError('Invalid barcode format. Expected format: customerID_productID');
      return false;
    }
    
    const { customerId: scannedCustomerId, productId } = parsed;
    
    // Validate customer ID
    if (scannedCustomerId !== customerId) {
      setError(`Customer ID mismatch. Expected ${customerId}, got ${scannedCustomerId}`);
      return false;
    }
    
    // Find the product in the order
    const product = findProductInOrder(items, productId);
    if (!product) {
      setError(`Product not found in this order: ${productId}`);
      return false;
    }
    
    // Add to scanned items
    setScannedItems(prev => {
      const updated = new Set(prev);
      updated.add(productId);
      return updated;
    });
    
    // Update last scanned
    setLastScanned(barcodeValue);
    clearLastScanned();
    
    // Clear error
    setError(null);
    
    return true;
  }, [items, customerId, lastScanned, clearLastScanned]);

  // Process scan input
  useEffect(() => {
    if (!scanning || !scanInput || scanInput === lastScanned) {
      return;
    }
    
    // Wait for code to be complete (with customerId_productId format)
    if (scanInput.includes('_')) {
      processScan(scanInput);
      setScanInput('');
    }
  }, [scanInput, lastScanned, processScan, scanning]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scannedItems,
    scanInput,
    setScanInput,
    error,
    scanning,
    toggleScanning,
    processScan,
    isComplete: areAllItemsTicketed(items, scannedItems),
    remainingCount: items.length - scannedItems.size
  };
}

export default useBarcodeScanning;