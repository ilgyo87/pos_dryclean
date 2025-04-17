// src/screens/Checkout/components/CheckoutServiceList.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Schema } from '../../../../amplify/data/resource';

interface CheckoutServiceListProps {
  categories: Schema["Category"]["type"][];
  selectedServiceId?: string;
  onSelectService: (service: Schema["Category"]["type"]) => void;
  isLoading?: boolean;
}

export default function CheckoutServiceList({
  categories,
  selectedServiceId,
  onSelectService,
  isLoading = false
}: CheckoutServiceListProps) {
  // Sort categories by name for easy browsing
  const sortedCategories = [...categories].sort((b, a) => {
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  // Get width to calculate tab sizes
  const screenWidth = Dimensions.get('window').width;
  const tabWidth = screenWidth / Math.min(sortedCategories.length, 5); // Max 5 visible tabs
  
  return (
    <View style={styles.container}>
      {sortedCategories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.emptyText}>Loading categories...</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {sortedCategories.map((category) => {
            const isSelected = selectedServiceId === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.tabItem,
                  { width: tabWidth },
                  isSelected && styles.selectedTabItem
                ]}
                onPress={() => onSelectService(category)}
              >
                <Ionicons 
                  name={getCategoryIcon(category.name)} 
                  size={24} 
                  color={isSelected ? "#FFFFFF" : "#555555"} 
                />
                <Text style={[styles.tabText, isSelected && styles.selectedTabText]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

// Function to get an appropriate icon for a category
const getCategoryIcon = (name: string = "") => {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes("shirt") || nameLower.includes("cloth")) return "shirt-outline";
  if (nameLower.includes("household") || nameLower.includes("home")) return "home-outline"; 
  if (nameLower.includes("special") || nameLower.includes("delicate")) return "sparkles-outline";
  if (nameLower.includes("wash")) return "water-outline";
  if (nameLower.includes("press") || nameLower.includes("iron")) return "square-outline";
  if (nameLower.includes("leather")) return "briefcase-outline";
  if (nameLower.includes("repair")) return "construct-outline";
  if (nameLower.includes("clean")) return "sparkles-outline";
  
  // Default icon
  return "cube-outline";
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabsContainer: {
    flexGrow: 0,
    height: 70,
  },
  tabsContent: {
    alignItems: 'center',
  },
  tabItem: {
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selectedTabItem: {
    backgroundColor: '#2196F3',
    borderBottomColor: '#0d47a1',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
    color: '#555555',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});