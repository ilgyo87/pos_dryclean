import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { styles } from '../styles/screens/productManagementStyles';
import { Service } from '../types/productTypes';

interface ServiceTabsProps {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (serviceId: string) => void;
}

const ServiceTabs: React.FC<ServiceTabsProps> = ({ 
  services, 
  selectedServiceId, 
  onSelect 
}) => {
  // Sort services with specific priority order, then by createdAt
  const sortedServices = [...services].sort((a, b) => {
    // Priority: Sort remaining services by createdAt (oldest first)
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    // Handle cases where one record doesn't have createdAt
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    
    // Fall back to sorting by name
    return a.name.localeCompare(b.name);
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      {sortedServices.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.tab,
            selectedServiceId === service.id && styles.activeTab
          ]}
          onPress={() => onSelect(service.id)}
        >
          <Text
            style={[
              styles.tabText,
              selectedServiceId === service.id && styles.activeTabText
            ]}
          >
            {service.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ServiceTabs;