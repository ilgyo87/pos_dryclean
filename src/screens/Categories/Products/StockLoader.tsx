// src/components/Products/StockLoader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  products: number;
}

interface StockLoaderProps {
  userId: string;
  onDataLoaded: () => void;
  createService: (service: any) => Promise<any>;
  createProduct: (product: any) => Promise<any>;
}

// Mock templates for demonstration
const defaultTemplates: TemplateCategory[] = [
  {
    id: 'laundry',
    name: 'Basic Laundry Services',
    description: 'Common laundry items like shirts, pants, and dresses',
    products: 15,
  },
  {
    id: 'specialty',
    name: 'Specialty Care',
    description: 'Special care items like suits, wedding dresses, and formal wear',
    products: 10,
  },
  {
    id: 'household',
    name: 'Household Items',
    description: 'Home items like bedding, curtains, and tablecloths',
    products: 8,
  },
];

const StockLoader: React.FC<StockLoaderProps> = ({
  userId,
  onDataLoaded,
  createService,
  createProduct,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
  };

  const handleTemplateLoad = async () => {
    if (!selectedTemplateId) {
      Alert.alert('Select a Template', 'Please select a template first.');
      return;
    }

    setLoading(true);

    try {
      // This is just a simulation - in real implementation, you would create
      // actual categories and products from your selected template
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call the callback to refresh the parent component
      onDataLoaded();
      
      Alert.alert('Success', 'Default services loaded successfully!');
    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Error', 'Failed to load the template. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTemplateItem = ({ item }: { item: TemplateCategory }) => {
    const isSelected = item.id === selectedTemplateId;
    
    return (
      <TouchableOpacity
        style={[styles.templateItem, isSelected && styles.selectedTemplateItem]}
        onPress={() => handleTemplateSelect(item.id)}
      >
        <View style={styles.templateContent}>
          <View style={styles.templateHeader}>
            <Text style={styles.templateName}>{item.name}</Text>
            {isSelected && (
              <MaterialIcons name="check-circle" size={20} color="#28a745" />
            )}
          </View>
          <Text style={styles.templateDescription}>{item.description}</Text>
          <Text style={styles.templateCount}>{item.products} products</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Template</Text>
      
      <FlatList
        data={defaultTemplates}
        renderItem={renderTemplateItem}
        keyExtractor={item => item.id}
        style={styles.templateList}
      />

      <TouchableOpacity
        style={[styles.loadButton, (!selectedTemplateId || loading) && styles.disabledButton]}
        onPress={handleTemplateLoad}
        disabled={!selectedTemplateId || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.loadButtonText}>Load Selected Template</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipButtonText}>Skip and add services manually</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  templateList: {
    maxHeight: 300,
  },
  templateItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedTemplateItem: {
    borderColor: '#28a745',
    backgroundColor: '#f0fff4',
  },
  templateContent: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  templateCount: {
    fontSize: 14,
    color: '#007bff',
  },
  loadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 16,
  },
  loadButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#b0c4de',
  },
  skipButton: {
    alignItems: 'center',
    padding: 8,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});

export default StockLoader;