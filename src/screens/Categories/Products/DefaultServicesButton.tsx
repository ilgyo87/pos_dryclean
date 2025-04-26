// src/components/Products/DefaultServicesButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useCategories } from '../../../hooks/useCategories';
import { useProducts } from '../../../hooks/useProducts';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../../types';
import { getRealm } from '../../../localdb/getRealm';

// Helper function to generate a random color for categories
function getRandomColor() {
  const colors = [
    '#007bff', // blue
    '#28a745', // green
    '#dc3545', // red
    '#fd7e14', // orange
    '#6f42c1', // purple
    '#20c997', // teal
    '#17a2b8', // cyan
    '#6c757d', // gray
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

interface DefaultServicesButtonProps {
  onComplete?: () => void;
  businessId?: string;
}

const DEFAULT_SERVICES = [
  {
    _id: uuidv4(),
    name: 'Dry Cleaning',
    color: '#007bff', // blue
    products: [
      { _id: uuidv4(), name: 'pants', imageName: 'pants', price: 5.0 },
      { _id: uuidv4(), name: 'dress-shirt', imageName: 'dress-shirt', price: 4.0 },
      { _id: uuidv4(), name: 'blazer', imageName: 'blazer', price: 6.0 },
      { _id: uuidv4(), name: 'suit', imageName: 'suit', price: 10.0 },
      { _id: uuidv4(), name: 'skirt', imageName: 'skirt', price: 4.0 },
      { _id: uuidv4(), name: 'dress', imageName: 'dress', price: 8.0 },
      { _id: uuidv4(), name: 'polo', imageName: 'polo', price: 3.0 },
      { _id: uuidv4(), name: 'jacket', imageName: 'jacket', price: 7.0 },
      { _id: uuidv4(), name: 'woman-suit', imageName: 'woman-suit', price: 10.0 },
      { _id: uuidv4(), name: 'jersey', imageName: 'jersey', price: 5.0 },
      { _id: uuidv4(), name: 'sari', imageName: 'sari', price: 8.0 },
      { _id: uuidv4(), name: 'kids-clothes', imageName: 'kids-clothes', price: 3.0 },
    ],
  },
  {
    _id: uuidv4(),
    name: 'Washing',
    color: '#28a745', // green
    products: [
      { _id: uuidv4(), name: 'dress-shirt', imageName: 'dress-shirt', price: 2.5 },
      { _id: uuidv4(), name: 'boxed-shirts', imageName: 'boxed-shirts', price: 3.0 },
      { _id: uuidv4(), name: 'jeans', imageName: 'jeans', price: 3.5 },
      { _id: uuidv4(), name: 't-shirt', imageName: 't-shirt', price: 2.0 },
    ],
  },
  {
    _id: uuidv4(),
    name: 'Alterations',
    color: '#fd7e14', // orange
    products: [
      { _id: uuidv4(), name: 'buttons', imageName: 'buttons', price: 1.0 },
      { _id: uuidv4(), name: 'patch', imageName: 'patch', price: 2.0 },
      { _id: uuidv4(), name: 'zipper', imageName: 'zipper', price: 3.0 },
      { _id: uuidv4(), name: 'sewing', imageName: 'sewing', price: 2.5 },
      { _id: uuidv4(), name: 'clothes-cut', imageName: 'clothes-cut', price: 2.0 },
      { _id: uuidv4(), name: 'hem', imageName: 'hem', price: 2.0 },
      { _id: uuidv4(), name: 'take-in', imageName: 'take-in', price: 3.0 },
      { _id: uuidv4(), name: 'waist', imageName: 'waist', price: 2.5 },
    ],
  },
  {
    _id: uuidv4(),
    name: 'Special',
    color: '#6f42c1', // purple
    products: [
      { _id: uuidv4(), name: 'comforter', imageName: 'comforter', price: 15.0 },
      { _id: uuidv4(), name: 'blankets', imageName: 'blankets', price: 10.0 },
      { _id: uuidv4(), name: 'pillow', imageName: 'pillow', price: 5.0 },
      { _id: uuidv4(), name: 'curtain', imageName: 'curtain', price: 12.0 },
      { _id: uuidv4(), name: 'leather-jacket', imageName: 'leather-jacket', price: 20.0 },
      { _id: uuidv4(), name: 'wedding-dress', imageName: 'wedding-dress', price: 30.0 },
      { _id: uuidv4(), name: 'shoes', imageName: 'shoes', price: 10.0 },
    ],
  },
];

const DefaultServicesButton: React.FC<DefaultServicesButtonProps> = ({ onComplete, businessId }) => {

  if (!businessId) {
    console.warn('[DefaultServicesButton] Rendered without a businessId! Button will be disabled.');
  }
  // Pass the businessId to useCategories to get only relevant categories
  const { createCategory, categories, fetchCategories } = useCategories(businessId);
  // Use the correct businessId for product operations
  const { createProduct, fetchProducts } = useProducts(businessId);
  
  // Debug log to confirm businessId
  console.log(`[DefaultServicesButton] Using businessId: '${businessId || ''}'`);

  const handleAddDefaults = async () => {
    try {
      await fetchCategories();
      if (!businessId) {
        Alert.alert('Error', 'No business found. Please create a business first.');
        return;
      }
      for (const cat of DEFAULT_SERVICES) {
        // Always fetch the category from the DB after creation to get the persistent _id
        let category = categories.find(
          (c) => c.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
        );
        let categoryId = category ? category._id : uuidv4();
        if (!category) {
          // Create a complete category object
          await createCategory({ 
            _id: categoryId, 
            name: cat.name,
            businessId: businessId,
            products: [], // Initialize with empty products array
            description: `Default ${cat.name} services`,
            color: cat.color || getRandomColor() // Add some color
          });

          // Fetch the actual category from DB after creation
          const { getCategoryById } = await import('../../../localdb/services/categoryService');
          const dbCategory = await getCategoryById(categoryId);
          if (dbCategory && dbCategory._id) {
            categoryId = dbCategory._id.toString();
            console.log(`[DefaultServicesButton] Created and fetched category '${cat.name}' with _id:`, categoryId);
          } else {
            console.warn(`[DefaultServicesButton] Could not fetch created category '${cat.name}' by id:`, categoryId);
          }
        } else {
          console.log(`[DefaultServicesButton] Found existing category '${cat.name}' with _id:`, categoryId);
        }
        for (const prod of cat.products) {
          const availableImages = [
            'blankets','blazer','boxed-shirts','buttons','clothes-cut','comforter','curtain','dress-shirt','dress','hem','jacket','jeans','jersey','kids-clothes','leather-jacket','pants','patch','pillow','polo','rug','sari','sewing','shirt-cut','shoes','skirt','socks','suit','take-in','tshirt','t-shirt','waist','washing-clothes','wedding-dress','winter-coat','winter-hat','woman-suit','zipper'
          ];
          let imageKey = prod.imageName || prod.name;
          if (!availableImages.includes(imageKey)) {
            imageKey = prod.name.replace(/ /g, '-');
          }
          if (!availableImages.includes(imageKey)) {
            imageKey = prod.name.replace(/ /g, '_');
          }
          if (!availableImages.includes(imageKey)) {
            imageKey = 'default';
          }
          const prodObj: Product = {
            _id: uuidv4(),
            name: prod.name.replace(/-/g, ' '),
            imageName: imageKey,
            price: typeof prod.price === 'number' ? prod.price : 0,
            categoryId,
            businessId,
            notes: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          console.log(`[DefaultServicesButton] Creating product '${prodObj.name}' with categoryId: ${categoryId}, businessId: ${businessId}`);
          await createProduct(prodObj);

        }
      }
      await fetchCategories();
      await fetchProducts();
      Alert.alert('Success', 'Default categories and products added!');
      if (onComplete) onComplete();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add default services');
    }
  };


  // Function to reset categories and products (for debugging)
  const handleReset = async () => {
    if (!businessId) {
      Alert.alert('Error', 'No business found. Please create a business first.');
      return;
    }
    
    try {
      // Delete all products and categories
      const realm = await getRealm();
      
      realm.write(() => {
        // Delete all products for this business
        const products = realm.objects('Product').filtered('businessId == $0', businessId);
        console.log(`[DefaultServicesButton] Deleting ${products.length} products`);
        realm.delete(products);
        
        // Delete all categories for this business
        const categories = realm.objects('Category').filtered('businessId == $0', businessId);
        console.log(`[DefaultServicesButton] Deleting ${categories.length} categories`);
        realm.delete(categories);
      });
      
      console.log('[DefaultServicesButton] Reset complete');
      
      // Immediately add default categories and products
      await handleAddDefaults();
      
      // Alert.alert('Success', 'All products and categories have been reset and defaults added');
      
      // Refetch data
      await fetchCategories();
      await fetchProducts();
      
      if (onComplete) onComplete();
    } catch (err: any) {
      console.error('[DefaultServicesButton] Reset error:', err);
      Alert.alert('Error', err.message || 'Failed to reset services');
    }
  };

  const handlePress = () => {
    Alert.alert(
      'Service Options',
      'What would you like to do with the services?',
      [
        { 
          text: 'Reset All',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Reset',
              'This will DELETE ALL existing services. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: handleReset }
              ]
            );
          }
        },
        { text: 'Add Default Services', onPress: handleAddDefaults },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, !businessId && { backgroundColor: '#eee', borderColor: '#ccc' }]}
      onPress={handlePress}
      disabled={!businessId}
    >
      <Text style={[styles.buttonText, !businessId && { color: '#aaa' }]}>
        Reset & Add Default Services
      </Text>
      {!businessId && (
        <Text style={{ color: '#d00', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
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
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  buttonText: {
    color: '#007bff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default DefaultServicesButton;