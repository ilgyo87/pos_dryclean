import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Service } from '../types/productTypes';

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit }) => {
  return (
    <View 
      style={{ 
        paddingVertical: 4, 
        paddingHorizontal: 8, 
        backgroundColor: 'white', 
        borderRadius: 4, 
        borderWidth: 1, 
        borderColor: '#eee', 
        marginVertical: 0 
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {service.urlPicture ? (
            <Image 
              source={{ uri: service.urlPicture }} 
              style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
              resizeMode="cover"
            />
          ) : null}
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{service.name}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#4CAF50' }}>
          ${service.price.toFixed(2)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <Text style={{ fontSize: 12, color: '#666' }} numberOfLines={1}>
          {service.description || 'No description provided.'}
        </Text>
        <TouchableOpacity
          style={{ 
            padding: 2, 
            paddingHorizontal: 4, 
            backgroundColor: '#f8f8f8', 
            borderRadius: 4, 
            flexDirection: 'row', 
            alignItems: 'center' 
          }}
          onPress={() => onEdit(service)}
        >
          <Text style={{ marginLeft: 2, color: '#666', fontSize: 10 }}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ServiceCard;