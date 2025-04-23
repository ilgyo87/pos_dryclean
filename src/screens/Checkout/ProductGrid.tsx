import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
  ListRenderItem
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../../types';
import { getGarmentImage } from '../../utils/ImageMapping';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isLoading: boolean;
  currentPage: number;
  onChangePage: (page: number) => void;
}

// Dynamic grid configuration based on orientation
const getGridConfig = () => {
  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;

  if (isLandscape) {
    return {
      itemsPerPage: 10, // 2 rows x 5 columns
      numColumns: 5,
    };
  } else {
    return {
      itemsPerPage: 12, // 4 rows x 3 columns
      numColumns: 3,
    };
  }
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products = [], // Default to empty array
  onSelectProduct,
  isLoading,
  currentPage,
  onChangePage
}) => {
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [gridConfig, setGridConfig] = useState(getGridConfig());
  
  // Update grid configuration when dimensions change
  useEffect(() => {
    const updateLayout = () => {
      setGridConfig(getGridConfig());
    };
    
    // Set initial value
    updateLayout();
    
    // Listen for dimension changes (e.g., rotation)
    const subscription = Dimensions.addEventListener('change', updateLayout);
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Calculate pagination when products or grid config change
  useEffect(() => {
    const { itemsPerPage, numColumns } = gridConfig;
    const total = Math.ceil(products.length / itemsPerPage);
    setTotalPages(total);
    
    // If current page is out of bounds, reset to page 0
    if (currentPage >= total) {
      onChangePage(0);
    }
    
    // Get items for current page
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    let pageItems = products.slice(startIndex, endIndex);

    // Fill the grid with empty items if needed
    const remainder = pageItems.length % numColumns;
    if (remainder > 0) {
      const emptyCount = numColumns - remainder;
      for (let i = 0; i < emptyCount; i++) {
        pageItems.push({ _id: '', name: '', categoryId: '' } as Product);
      }
    }
    setPaginatedProducts(pageItems);
  }, [products, currentPage, onChangePage, gridConfig]);
  
  // Calculate item dimensions based on screen size and number of columns
  const { width } = Dimensions.get('window');
  const itemWidth = (width - 40) / gridConfig.numColumns; // Make cards narrower by reducing side padding
  
  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <TouchableOpacity
      style={[styles.productItem, { width: itemWidth }]}
      onPress={() => onSelectProduct(item)}
    >
      <View style={styles.productImage}>
        <Image
          source={getGarmentImage(item.imageName || 'default')}
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.overlayBottom}>
          <Text style={styles.overlayName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.overlayPrice}>${item.price?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  
  const renderEmptyItem = () => (
    <View style={[styles.emptyItem, { width: itemWidth }]} />
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }
  
  if (!products || products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products in this category</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList<Product>
        data={paginatedProducts}
        renderItem={(item) => 
          // Render empty item if there's no data
          (item.item && item.item._id) ? renderItem(item) : renderEmptyItem()
        }
        keyExtractor={(item, index) => (item && item._id) ? item._id : `empty-${index}`}
        numColumns={gridConfig.numColumns}
        key={`grid-cols-${gridConfig.numColumns}`}
        contentContainerStyle={styles.gridContainer}
      />
      
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
            onPress={() => onChangePage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <MaterialIcons name="chevron-left" size={24} color={currentPage === 0 ? '#ccc' : '#007bff'} />
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === totalPages - 1 && styles.pageButtonDisabled]}
            onPress={() => onChangePage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            <MaterialIcons name="chevron-right" size={24} color={currentPage === totalPages - 1 ? '#ccc' : '#007bff'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  gridContainer: {
    padding: 4,
  },
  productItem: {
    margin: 3, // Further reduced margin for narrower cards
    padding: 7, // Further reduced padding for narrower cards
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    minWidth: 153, // Optional: set a minimum width for usability
    maxWidth: 153, // Optional: set a max width for compactness
  },
  emptyItem: {
    margin: 3, // Match productItem margin
  },
  productImage: {
    width: 130, // Slightly reduced size
    height: 130, // Slightly reduced size
    marginBottom: 6, // Slightly reduced margin
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    zIndex: 2,
    flexDirection: 'column',
  },
  overlayName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
    textShadowColor: 'rgba(0,0,0,2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  overlayPrice: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  pageButtonDisabled: {
    backgroundColor: '#f9f9f9',
  },
  pageInfo: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#666',
  },
});

export default ProductGrid;