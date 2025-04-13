import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { Schema } from './../../../../amplify/data/resource';

interface ServiceListProps {
  services: Schema["Category"]["type"][];
  selectedService: string | null;
  onSelectService: (id: string) => void;
  onAddService: () => void; // Placeholder for add functionality
}

export default function ServiceList({
  services,
  selectedService,
  onSelectService,
  onAddService,
}: ServiceListProps) {
  return (
    <View style={styles.servicesContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Services</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddService}>
          <Text style={styles.buttonText}>Add Service</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {services.map(service => (
          <TouchableOpacity 
            key={service.id}
            style={[
              styles.serviceItem,
              selectedService === service.id && styles.selectedServiceItem
            ]}
            onPress={() => onSelectService(service.id)}
          >
            <Text style={styles.serviceText}>{service.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingVertical: 6, // Adjusted padding for consistency
    paddingHorizontal: 12, // Adjusted padding
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14, // Adjusted font size for consistency
  },
  serviceItem: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
  },
  selectedServiceItem: {
    backgroundColor: '#007AFF',
  },
  serviceText: {
    fontSize: 16,
  },
});