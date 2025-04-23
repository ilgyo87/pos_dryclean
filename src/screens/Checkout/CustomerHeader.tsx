import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Customer } from '../../types';
import { getGarmentImage } from '../../utils/ImageMapping';

interface CustomerHeaderProps {
  customer: Customer;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ customer }) => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.header}>
      <View style={styles.customerInfo}>
        <View style={styles.customerImage}>
          {customer.imageName ? (
            <Image 
              source={getGarmentImage(customer.imageName)}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.initials}>
              <Text style={styles.initialsText}>
                {`${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.details}>
          <Text style={styles.name}>{customer.firstName} {customer.lastName}</Text>
          <Text style={styles.contact}>{customer.phone || 'No phone'}</Text>
          <Text style={styles.contact}>{customer.email || 'No email'}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => {
          // Add logic to edit customer
        }}
      >
        <MaterialIcons name="edit" size={20} color="#666" />
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backText: {
    color: '#007bff',
    fontWeight: '500',
    marginLeft: 4,
  },
  customerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contact: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  editText: {
    marginLeft: 4,
    color: '#666',
  },
});

export default CustomerHeader;