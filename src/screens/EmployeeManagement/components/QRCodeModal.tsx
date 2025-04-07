// src/screens/EmployeeManagement/components/QRCodeModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { styles } from '../styles/employeeManagementStyles';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import QRCode from 'react-native-qrcode-svg';
import { Employee } from '../types/EmployeeTypes';
import { 
  generateQRCodeData, 
  getQRCodeURL,
  generateQRCodeS3Key,
  attachQRCodeKeyToEntity
} from '../../../shared/components/qrCodeGenerator';
import QRCodeCapture from '../../../shared/components/QRCodeCapture';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  employee: Employee;
  onEmployeeUpdated: (employee: Employee) => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  onClose,
  employee,
  onEmployeeUpdated
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [qrCodeString, setQrCodeString] = useState<string>('');
  const [regenerateMode, setRegenerateMode] = useState<boolean>(false);
  const [qrCaptureVisible, setQrCaptureVisible] = useState<boolean>(false);

  // Generate QR code data and fetch URL when component mounts or employee changes
  useEffect(() => {
    if (visible && employee) {
      // Generate QR code data string
      const qrData = generateQRCodeData('Employee', employee);
      setQrCodeString(qrData);
      
      // If employee has a QR code, fetch the URL
      if (employee.qrCode) {
        fetchQRCodeURL();
      }
    }
  }, [visible, employee]);

  // Fetch QR code URL from S3
  const fetchQRCodeURL = async () => {
    if (!employee.qrCode) return;
    
    setIsLoading(true);
    try {
      const url = await getQRCodeURL(employee.qrCode);
      console.log('Generated QR Code URL:', url);
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error fetching QR Code URL:', error);
      Alert.alert('Error', 'Could not load QR Code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR code regeneration
  const handleRegenerateQRCode = () => {
    setRegenerateMode(true);
    setQrCaptureVisible(true);
  };

  // Handle QR code capture completion
  const handleQrComplete = async (qrCodeKey: string | null) => {
    setQrCaptureVisible(false);
    setRegenerateMode(false);
    
    if (!qrCodeKey) {
      Alert.alert('Info', 'QR code generation was cancelled');
      return;
    }
    
    try {
      console.log(`QR Code captured/uploaded for employee ${employee.id}. Attaching key: ${qrCodeKey}`);
      // Attach QR code key to employee record
      const success = await attachQRCodeKeyToEntity('Employee', employee.id, qrCodeKey);
      
      if (success) {
        console.log(`Successfully attached QR key to employee ${employee.id}`);
        // Update local employee object with QR code URL
        const updatedEmployee = { ...employee, qrCode: qrCodeKey };
        onEmployeeUpdated(updatedEmployee);
        
        // Fetch the new QR code URL
        const url = await getQRCodeURL(qrCodeKey);
        setQrCodeUrl(url);
        
        Alert.alert('Success', 'QR code has been regenerated');
      } else {
        Alert.alert('Error', 'Failed to attach QR code to employee');
      }
    } catch (error) {
      console.error('Error during QR attachment/handling:', error);
      Alert.alert('Error', 'Failed to regenerate QR code');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Employee QR Code</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          {/* QR Code Capture (conditionally rendered) */}
          {qrCaptureVisible ? (
            <QRCodeCapture
              value={qrCodeString}
              size={200}
              entityType="Employee"
              entityId={employee.id}
              onCapture={handleQrComplete}
            />
          ) : (
            <>
              {/* Employee Info */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {employee.firstName} {employee.lastName}
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  {employee.role}
                </Text>
              </View>

              {/* QR Code Display */}
              <View style={styles.qrCodeContainer}>
                {isLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : employee.qrCode && qrCodeUrl ? (
                  <View style={styles.qrCodeWrapper}>
                    <Image
                      source={{ uri: qrCodeUrl }}
                      style={{ width: 200, height: 200 }}
                      resizeMode="contain"
                      onError={(e) => console.log("Error loading QR image:", e.nativeEvent.error)}
                    />
                  </View>
                ) : (
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={qrCodeString}
                      size={200}
                      backgroundColor="white"
                      color="black"
                    />
                    <Text style={styles.noQrText}>
                      This employee does not have a saved QR code yet.
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: '#2196F3' }]}
                  onPress={handleRegenerateQRCode}
                >
                  <Text style={styles.submitButtonText}>
                    {employee.qrCode ? 'Regenerate QR Code' : 'Generate QR Code'}
                  </Text>
                </TouchableOpacity>
                
                {employee.qrCode && (
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: '#4CAF50', marginTop: 10 }]}
                    onPress={() => {
                      // Here you would implement functionality to print or share the QR code
                      Alert.alert('Info', 'Print/Share functionality would be implemented here');
                    }}
                  >
                    <Text style={styles.submitButtonText}>Print / Share</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* QR Code Usage Instructions */}
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
                  This QR code can be used for employee check-in/out and access control.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default QRCodeModal;
