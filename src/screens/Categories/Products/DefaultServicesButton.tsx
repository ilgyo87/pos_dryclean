// src/screens/Categories/Products/DefaultServicesButton.tsx
import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCategories } from '../../../hooks/useCategories';
import { v4 as uuidv4 } from 'uuid';
import { getRealm } from '../../../localdb/getRealm';
import type { Category, Product } from '../../../types';

interface DefaultServicesButtonProps {
  onComplete?: () => void;
  businessId?: string;
}

// Define product item interface for default services
interface DefaultProductItem {
  name: string;
  imageName: string;
  price: number;
}

// Define default service interface
interface DefaultService {
  name: string;
  products: DefaultProductItem[];
}

// Define default services with complete product objects
const DEFAULT_SERVICES: DefaultService[] = [
  {
    name: 'dry cleaning',
    products: [
      { name: 'pants', imageName: 'pants', price: 5.0 },
      { name: 'dress-shirt', imageName: 'dress-shirt', price: 4.0 },
      { name: 'blazer', imageName: 'blazer', price: 6.0 },
      { name: 'suit', imageName: 'suit', price: 10.0 },
      { name: 'skirt', imageName: 'skirt', price: 4.0 },
      { name: 'dress', imageName: 'dress', price: 8.0 },
      { name: 'polo', imageName: 'polo', price: 3.0 },
      { name: 'jacket', imageName: 'jacket', price: 7.0 },
      { name: 'woman-suit', imageName: 'woman-suit', price: 10.0 },
      { name: 'jersey', imageName: 'jersey', price: 5.0 },
      { name: 'sari', imageName: 'sari', price: 8.0 },
      { name: 'kids-clothes', imageName: 'kids-clothes', price: 3.0 },
    ],
  },
  {
    name: 'washing',
    products: [
      { name: 'dress-shirt', imageName: 'dress-shirt', price: 2.5 },
      { name: 'boxed-shirts', imageName: 'boxed-shirts', price: 3.0 },
      { name: 'jeans', imageName: 'jeans', price: 3.5 },
      { name: 't-shirt', imageName: 't-shirt', price: 2.0 },
    ],
  },
  {
    name: 'alterations',
    products: [
      { name: 'buttons', imageName: 'buttons', price: 1.0 },
      { name: 'patch', imageName: 'patch', price: 2.0 },
      { name: 'zipper', imageName: 'zipper', price: 3.0 },
      { name: 'sewing', imageName: 'sewing', price: 2.5 },
      { name: 'clothes-cut', imageName: 'clothes-cut', price: 2.0 },
      { name: 'hem', imageName: 'hem', price: 2.0 },
      { name: 'take-in', imageName: 'take-in', price: 3.0 },
      { name: 'waist', imageName: 'waist', price: 2.5 },
    ],
  },
  {
    name: 'special',
    products: [
      { name: 'comforter', imageName: 'comforter', price: 15.0 },
      { name: 'blankets', imageName: 'blankets', price: 10.0 },
      { name: 'pillow', imageName: 'pillow', price: 5.0 },
      { name: 'curtain', imageName: 'curtain', price: 12.0 },
      { name: 'leather-jacket', imageName: 'leather-jacket', price: 20.0 },
      { name: 'wedding-dress', imageName: 'wedding-dress', price: 30.0 },
      { name: 'shoes', imageName: 'shoes', price: 10.0 },
    ],
  },
];

// List of available image keys
const AVAILABLE_IMAGES: string[] = [
  'blankets', 'blazer', 'boxed-shirts', 'buttons', 'clothes-cut', 'comforter', 'curtain',
  'dress-shirt', 'dress', 'hem', 'jacket', 'jeans', 'jersey', 'kids-clothes', 'leather-jacket',
  'pants', 'patch', 'pillow', 'polo', 'rug', 'sari', 'sewing', 'shirt-cut', 'shoes', 'skirt',
  'socks', 'suit', 'take-in', 'tshirt', 't-shirt', 'waist', 'washing-clothes', 'wedding-dress',
  'winter-coat', 'winter-hat', 'woman-suit', 'zipper'
];

const DefaultServicesButton: React.FC<DefaultServicesButtonProps> = ({ onComplete, businessId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchCategories } = useCategories();

  // Helper function to get a valid image name
  const getValidImageName = (name: string): string => {
    if (AVAILABLE_IMAGES.includes(name)) return name;
    const withHyphens = name.replace(/ /g, '-');
    if (AVAILABLE_IMAGES.includes(withHyphens)) return withHyphens;
    return 't-shirt'; // Default fallback
  };

  // Create a product directly using Realm
  const createProductInRealm = (
    realm: Realm,
    productInfo: DefaultProductItem,
    categoryId: string,
    businessId: string
  ): void => {
    const productId = uuidv4();
    const now = new Date();
    const productName = productInfo.name.replace(/-/g, ' ');
    
    // Check if product already exists by name in this category
    const existingProducts = realm.objects('Product').filtered(
      'name BEGINSWITH[c] $0 AND categoryId == $1', 
      productName, 
      categoryId
    );
    
    if (existingProducts.length > 0) {
      console.log(`[DefaultServices] Product ${productName} already exists in category ${categoryId}, skipping`);
      return;
    }
    
    try {
      // Create product with essential fields
      const newProduct = {
        _id: productId,
        name: productName,
        price: productInfo.price,
        description: '',
        discount: 0,
        additionalPrice: 0,
        categoryId: categoryId,
        businessId: businessId,
        imageName: getValidImageName(productInfo.imageName || productInfo.name),
        notes: [] as string[],
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      
      // Create the product
      realm.create('Product', newProduct);
      
      console.log(`[DefaultServices] Created product: ${productName} in category ${categoryId}`);
    } catch (productError) {
      console.error(`[DefaultServices] Error creating product ${productName}:`, productError);
    }
  };

  const handleAddDefaults = async () => {
    if (!businessId) {
      Alert.alert('Error', 'No business found. Please create a business first.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[DefaultServices] Starting to add default services');
      
      // Get Realm instance for all operations
      const realm = await getRealm();
      
      // Create all categories first
      const categoryMap: Record<string, string> = {};
      
      realm.write(() => {
        for (const service of DEFAULT_SERVICES) {
          const categoryId = uuidv4();
          
          console.log(`[DefaultServices] Processing category: ${service.name}`);
          
          // Check if category exists by name
          const existingCategories = realm.objects('Category').filtered('name BEGINSWITH[c] $0 AND businessId == $1', service.name, businessId);
          
          if (existingCategories.length > 0) {
            console.log(`[DefaultServices] Category ${service.name} already exists, using existing ID`);
            categoryMap[service.name] = String(existingCategories[0]._id);
          } else {
            // Create new category
            realm.create('Category', {
              _id: categoryId,
              name: service.name,
              businessId: businessId,
              // Include optional fields with default values
              description: '',
              color: '',
            });
            
            categoryMap[service.name] = categoryId;
            console.log(`[DefaultServices] Created new category: ${service.name} with ID ${categoryId}`);
          }
        }
        
        // Add products for each category in the same transaction
        for (const service of DEFAULT_SERVICES) {
          const categoryId = categoryMap[service.name];
          
          if (!categoryId) {
            console.error(`[DefaultServices] Missing category ID for ${service.name}`);
            continue;
          }
          
          console.log(`[DefaultServices] Adding ${service.products.length} products to category ${service.name} (${categoryId})`);
          
          for (const productInfo of service.products) {
            createProductInRealm(realm, productInfo, categoryId, businessId);
          }
        }
      });
      
      // Refresh categories in the UI
      await fetchCategories();
      
      console.log('[DefaultServices] Successfully added all default services');
      Alert.alert('Success', 'Default categories and products added successfully!');
      
      if (onComplete) {
        onComplete();
      }
    } catch (err: any) {
      console.error('[DefaultServices] Error adding default services:', err);
      Alert.alert('Error', err.message || 'Failed to add default services');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    Alert.alert(
      'Add Default Services',
      'This will add common dry cleaning services to your catalog.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: handleAddDefaults },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, !businessId && styles.disabledButton]}
      onPress={handlePress}
      disabled={!businessId || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#007bff" />
      ) : (
        <Text style={[styles.buttonText, !businessId && styles.disabledText]}>
          Add Default Services
        </Text>
      )}
      {!businessId && (
        <Text style={styles.errorText}>
          Business not found. Please create a business first.
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  disabledButton: {
    backgroundColor: '#eee',
    borderColor: '#ccc',
  },
  buttonText: {
    color: '#007bff',
    fontWeight: '500',
    fontSize: 14,
  },
  disabledText: {
    color: '#aaa',
  },
  errorText: {
    color: '#d00',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default DefaultServicesButton;