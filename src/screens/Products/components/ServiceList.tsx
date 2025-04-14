// src/screens/Products/components/ServiceList.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Schema } from './../../../../amplify/data/resource';

interface ServiceListProps {
  services: Schema["Category"]["type"][];
  selectedService: string | null;
  onSelectService: (id: string) => void;
  onAddService: () => void;
  onEditService: (service: Schema["Category"]["type"]) => void;
}

export default function ServiceList({
  services,
  selectedService,
  onSelectService,
  onAddService,
  onEditService,
}: ServiceListProps) {
  return (
    <View style={styles.servicesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Services</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddService}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.buttonText}>Add Service</Text>
        </TouchableOpacity>
      </View>
      
      {services.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No services found. Add your first service to get started.</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.serviceList}
        >
          {services.map(service => (
            <TouchableOpacity 
              key={service.id}
              style={[
                styles.serviceItem,
                selectedService === service.id && styles.selectedServiceItem
              ]}
              onPress={() => onSelectService(service.id)}
              onLongPress={() => onEditService(service)}
            >
              <Text 
                style={[
                  styles.serviceText,
                  selectedService === service.id && styles.selectedServiceText
                ]}
              >
                {service.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  servicesContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  serviceList: {
    paddingVertical: 8,
  },
  serviceItem: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedServiceItem: {
    backgroundColor: '#007AFF',
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedServiceText: {
    color: '#fff',
  },
  servicePrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginTop: 10,
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  }
});