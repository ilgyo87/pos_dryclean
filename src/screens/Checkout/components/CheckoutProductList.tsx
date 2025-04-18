// src/screens/Checkout/components/CheckoutProductList.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Schema } from "../../../../amplify/data/resource";
import { getImageSource } from "../../../utils/productImages";

interface CheckoutProductListProps {
  products: Schema["Item"]["type"][];
  selectedServiceId?: string; // To filter products by service
  onSelectProduct: (product: Schema["Item"]["type"]) => void;
  isLoading?: boolean;
}

const CheckoutProductList = ({
  products,
  selectedServiceId,
  onSelectProduct,
  isLoading = false
}: CheckoutProductListProps) => {
  const placeholderImage = require("../../../../assets/items/tshirt.png");
  // Get screen dimensions
  const { width, height } = useWindowDimensions();
  // Determine if we're in portrait mode (height > width)
  const isPortrait = height > width;
  // Set number of columns based on orientation
  const numColumns = isPortrait ? 3 : 4;
  // Filter products by service if needed
  const filteredProducts = selectedServiceId
    ? products.filter(product => product.categoryId === selectedServiceId)
    : products;

  // Sort products by name
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // If both have createdAt, sort by that (newest first)
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    // If only one has createdAt, prioritize the one with createdAt
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    // Fall back to name comparison if no createdAt available
    return a.name.localeCompare(b.name);
  });

  // Function to get the appropriate image for a product
  const getItemImage = (item: Schema["Item"]["type"]) => {
    // First priority: imageSource if available
    if (item.imageSource && item.imageSource !== "placeholder") {
      return getImageSource(item.imageSource);
    }
    // Second priority: imageUrl if available
    else if (item.imageUrl) {
      return getImageSource(item.imageUrl);
    }
    // Fallback: placeholder or best guess based on name
    else {
      // Try to match with a common product name
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes("shirt")) return getImageSource("tshirt");
      if (nameLower.includes("pant") || nameLower.includes("trouser")) return getImageSource("trousers");
      if (nameLower.includes("jacket")) return getImageSource("jacket");
      if (nameLower.includes("dress")) return getImageSource("dress");

      // Fallback to placeholder
      return placeholderImage;
    }
  };

  const renderItem = ({ item }: { item: Schema["Item"]["type"] }) => {
    // Get the image for this item
    const imageSourceObj = getItemImage(item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => onSelectProduct(item)}
      >
        <View style={styles.imageContainer}>
          {imageSourceObj ? (
            <Image
              source={imageSourceObj}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Image source={placeholderImage} style={styles.productImage} />
            </View>
          )}

          {/* Overlay text on the image */}
          <View style={styles.textOverlay}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price?.toFixed(2) || "0.00"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
      </View>

      {sortedProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No products available</Text>
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.productsList}
          numColumns={numColumns}  // Using the dynamic column count
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          key={`list-${numColumns}`} // Force re-render when columns change
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 0,
    margin: 0,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  productsList: {
    padding: 4,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  productCard: {
    flex: 1,
    height: 120,
    marginBottom: 10,
    marginRight: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backgroundColor: "#f0f0f0",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    width: "60%",
    marginRight: 4,
  },
  productPrice: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#34C759",
    width: "40%",
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

export default CheckoutProductList;