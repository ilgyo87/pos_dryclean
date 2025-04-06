import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import WebView from 'react-native-webview';
import Share from 'react-native-share';

// Define our route parameter types
type RootStackParamList = {
  Receipt: { 
    receiptHtml: string;
    transactionId: string;
  };
};

type ReceiptScreenRouteProp = RouteProp<RootStackParamList, 'Receipt'>;

export default function ReceiptScreen() {
  const route = useRoute<ReceiptScreenRouteProp>();
  const navigation = useNavigation();
  const { receiptHtml, transactionId } = route.params;

  // Handle sharing receipt
  const handleShareReceipt = async () => {
    try {
      await Share.open({
        title: `Receipt #${transactionId}`,
        message: 'Your dry cleaning receipt',
        url: `data:text/html,${encodeURIComponent(receiptHtml)}`,
        type: 'text/html'
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Receipt</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
      
      <WebView 
        source={{ html: receiptHtml }}
        style={styles.webview}
      />
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReceipt}
        >
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
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
  closeButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  shareButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});