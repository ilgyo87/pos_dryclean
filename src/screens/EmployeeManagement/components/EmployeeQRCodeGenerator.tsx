// src/screens/EmployeeManagement/components/EmployeeQRCodeGenerator.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { styles } from '../styles/employeeManagementStyles';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { uploadData } from 'aws-amplify/storage';
import * as FileSystem from 'expo-file-system';
import { Employee } from '../types/EmployeeTypes';
import { 
  generateQRCodeData, 
  generateQRCodeS3Key,
  attachQRCodeKeyToEntity
} from '../../../shared/components/qrCodeGenerator';

interface EmployeeQRCodeGeneratorProps {
  employee: Employee;
  onQRCodeGenerated: (qrCodeKey: string) => void;
  size?: number;
}

const EmployeeQRCodeGenerator: React.FC<EmployeeQRCodeGeneratorProps> = ({
  employee,
  onQRCodeGenerated,
  size = 200
}) => {
  const [qrCodeString, setQrCodeString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const qrRef = useRef<View>(null);

  // Generate QR code data when employee changes
  useEffect(() => {
    if (employee) {
      const qrData = generateQRCodeData('Employee', employee);
      setQrCodeString(qrData);
    }
  }, [employee]);

  // Generate and upload QR code
  const generateAndUploadQRCode = async () => {
    if (!qrRef.current || !employee.id) {
      Alert.alert('Error', 'Cannot generate QR code at this time');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate S3 key for the QR code
      const qrCodeKey = generateQRCodeS3Key('Employee', employee);
      
      if (!qrCodeKey) {
        throw new Error('Failed to generate QR code key');
      }

      // Capture QR code as image
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1
      });

      // Read the file as base64
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Upload to S3
      const result = await uploadData({
        key: qrCodeKey,
        data: Buffer.from(base64Data, 'base64'),
        options: {
          contentType: 'image/png'
        }
      });

      console.log('QR Code Upload Result:', result);

      // Attach QR code key to employee record
      const success = await attachQRCodeKeyToEntity('Employee', employee.id, qrCodeKey);

      if (success) {
        console.log(`Successfully attached QR key to employee ${employee.id}`);
        onQRCodeGenerated(qrCodeKey);
        Alert.alert('Success', 'QR code generated and attached to employee');
      } else {
        throw new Error('Failed to attach QR code to employee');
      }
    } catch (err: any) {
      console.error('Error generating or uploading QR code:', err);
      setError(err.message || 'Unknown error occurred');
      Alert.alert('Error', `Failed to generate QR code: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={localStyles.container}>
      <Text style={localStyles.title}>Employee QR Code</Text>
      
      {/* QR Code Display */}
      <View 
        ref={qrRef}
        style={localStyles.qrCodeWrapper}
        collapsable={false}
      >
        <QRCode
          value={qrCodeString}
          size={size}
          backgroundColor="white"
          color="black"
        />
      </View>
      
      {/* Instructions */}
      <Text style={localStyles.instructions}>
        This QR code can be used for employee check-in/out and access control.
      </Text>
      
      {/* Generate Button */}
      <TouchableOpacity
        style={[
          localStyles.generateButton,
          isGenerating && localStyles.disabledButton
        ]}
        onPress={generateAndUploadQRCode}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={localStyles.generateButtonText}>
            {employee.qrCode ? 'Regenerate QR Code' : 'Generate QR Code'}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Error Message */}
      {error && (
        <Text style={localStyles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  qrCodeWrapper: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 20,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  errorText: {
    color: '#F44336',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default EmployeeQRCodeGenerator;
