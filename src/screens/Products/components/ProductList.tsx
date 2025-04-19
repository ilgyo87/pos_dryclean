// src/screens/Products/components/ProductList.tsx
import React from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Schema } from "../../../../amplify/data/resource";
import { getImageSource } from "../../../utils/productImages";
import { getS3ImageUrl } from "../../../utils/s3ImageUtils";

interface ProductListProps {
  products: Schema["Item"]["type"][];
  selectedService: string | null;
  onAddProduct: () => void;
  onEditProduct: (product: Schema["Item"]["type"]) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedService,
  onAddProduct,
  onEditProduct,
}) => {
  // Sort products by createdDate if available, newest first
  const sortedProducts = [...products].sort((b, a) => {
    // If both have createdAt, sort by that (newest first)
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // If only one has createdAt, prioritize the one with createdAt
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    // Fall back to name comparison if no createdAt available
    return a.name.localeCompare(b.name);
  });

  // Subcomponent to handle async S3 image URL loading and device fallback
  const ProductImage = ({ item }: { item: Schema["Item"]["type"] }) => {
    const [imageUri, setImageUri] = React.useState<string | undefined>(undefined);
    React.useEffect(() => {
      let isMounted = true;
      async function resolveImage() {
        if (item.imageUrlPreferred && item.imageUrl) {
          const url = await getS3ImageUrl(item.imageUrl);
          if (isMounted) setImageUri(url || undefined);
        } else {
          setImageUri(undefined); // will use device image below
        }
      }
      resolveImage();
      return () => { isMounted = false; };
    }, [item.imageUrlPreferred, item.imageUrl, item.imageSource]);

    if (item.imageUrlPreferred && imageUri) {
      return (
        <Image
          source={{ uri: imageUri }}
          style={styles.productImage}
          onLoad={() => console.log(`Image loaded for ${item.name}`)}
          onError={(e) => console.error(`Image load error for ${item.name}:`, e.nativeEvent)}
        />
      );
    } else if (item.imageSource) {
      return (
        <Image
          source={getImageSource(item.imageSource)}
          style={styles.productImage}
          onLoad={() => console.log(`Device image loaded for ${item.name}`)}
          onError={(e) => console.error(`Device image load error for ${item.name}:`, e.nativeEvent)}
        />
      );
    } else {
      // fallback
      return (
        <Image
          source={getImageSource("tshirt")}
          style={styles.productImage}
        />
      );
    }
  };

  const renderItem = ({ item }: { item: Schema["Item"]["type"] }) => {
    console.log(`Rendering item ${item.id} with name: ${item.name}, imageSource: ${item.imageSource}, imageUrlPreferred: ${item.imageUrlPreferred}`);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          console.log("Editing item:", item);
          onEditProduct(item);
        }}
      >
        <View style={styles.imageContainer}>
          <ProductImage item={item} />
          {/* Overlay text on the image */}
          <View style={styles.textOverlay}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price?.toFixed(2) || "0.00"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.productsHeader}>
        <Text style={styles.sectionTitle}>Products</Text>
        {selectedService && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddProduct}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.buttonText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </View>

      {!selectedService ? (
        <View style={styles.emptyState}>
          <Ionicons name="shirt-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>Select a Service</Text>
          <Text style={styles.emptyStateText}>
            Choose a service from above to view or add products.
          </Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Products Yet</Text>
          <Text style={styles.emptyStateText}>
            This service doesn't have any products. Add your first product to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productsList}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#34C759", // Green for Add Product
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 4,
  },
  productsList: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 5,
    paddingHorizontal: 4,
  },
  // Product card for grid layout
  productCard: {
    flex: 1,
    height: 120, // Smaller fixed height
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 1,
    marginRight: 2,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: "#f0f0f0",
    overflow: "hidden",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain"
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 4,
    flexDirection: "row", // Keep as row
    alignItems: "center"
  },
  productName: {
    fontSize: 21, // Even smaller
    fontWeight: "600",
    color: "#ffffff",
    width: "60%", // Fixed width
    marginRight: 4,
    overflow: "hidden" // Hide overflow text
  },
  productPrice: {
    fontSize: 24, // Even smaller
    fontWeight: "bold",
    color: "#34C759",
    width: "40%", // Fixed width
    textAlign: "right" // Align text to the right
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  // Style for the small tag showing the image source name
  imageSourceTag: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imageSourceText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  }
});

export default ProductList;