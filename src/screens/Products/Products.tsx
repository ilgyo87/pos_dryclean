// src/screens/Products/Products.tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Alert, Text } from "react-native"; 
import { AuthUser } from "aws-amplify/auth";
import { useFocusEffect } from "@react-navigation/native";
import ServiceList from "./components/ServiceList";
import ProductList from "./components/ProductList";
import StockLoader from "./components/StockLoader";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCategories } from "../../store/slices/CategorySlice";
import { fetchItems, clearItems } from "../../store/slices/ItemSlice";
import CreateFormModal from "../../components/CreateFormModal";

export default function Products({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState<"Category" | "Item">("Category");
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [showStockLoader, setShowStockLoader] = useState(false);

    // Redux hooks
    const dispatch = useAppDispatch();
    const { 
        categories, 
        isLoading: isCategoriesLoading, 
        error: categoriesError 
    } = useAppSelector(state => state.category);
    
    const { 
        items, 
        isLoading: isItemsLoading, 
        error: itemsError 
    } = useAppSelector(state => state.item);

    // Fetch categories when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (user?.userId) {
                dispatch(fetchCategories(user.userId));
                // Check if we should show the stock loader (when no categories exist)
                const checkForEmptyCategories = async () => {
                    try {
                        const result = await dispatch(fetchCategories(user.userId)).unwrap();
                        if (result.length === 0) {
                            setShowStockLoader(true);
                        } else {
                            setShowStockLoader(false);
                            // Auto-select the first category if none is selected
                            setSelectedCategory(current => current || (result[0]?.id ?? null));
                        }
                    } catch (error) {
                        console.error("Error fetching categories:", error);
                    }
                };
                checkForEmptyCategories();
            }
        }, [user?.userId, dispatch])
    );

    // Fetch items when selected category changes
    useEffect(() => {
        // If all categories are deleted, show StockLoader immediately
        if (categories.length === 0) {
            setShowStockLoader(true);
            if (selectedCategory !== null) {
                setSelectedCategory(null);
            }
            dispatch(clearItems());
            return;
        }
        if (selectedCategory) {
            dispatch(fetchItems(selectedCategory));
        } else {
            dispatch(clearItems());
        }
    }, [selectedCategory, categories.length, dispatch]);

    // Update loading state
    useEffect(() => {
        setIsLoading(isCategoriesLoading);
    }, [isCategoriesLoading]);

    // Handle category selection
    const handleSelectCategory = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    // Modal handlers
    const handleAddCategory = () => {
        setModalType("Category");
        setModalMode("create");
        setEditingCategory(null);
        setIsModalVisible(true);
    };

    const handleEditCategory = (category: any) => {
        setModalType("Category");
        setModalMode("edit");
        setEditingCategory(category);
        setIsModalVisible(true);
    };

    const handleAddItem = () => {
        if (!selectedCategory) {
            Alert.alert(
                "No Category Selected", 
                "Please select a category before adding a product."
            );
            return;
        }
        
        setModalType("Item");
        setModalMode("create");
        setEditingItem(null);
        setIsModalVisible(true);
    };

    const handleEditItem = (item: any) => {
        setModalType("Item");
        setModalMode("edit");
        setEditingItem(item);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        
        // Refresh data after modal closes
        if (user?.userId) {
            dispatch(fetchCategories(user.userId));
            
            if (selectedCategory) {
                dispatch(fetchItems(selectedCategory));
            }
        }
    };

    // Callback for when stock data is loaded
    const handleStockDataLoaded = () => {
        if (user?.userId) {
            dispatch(fetchCategories(user.userId));
            setShowStockLoader(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (categoriesError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading services. Please try again later.</Text>
            </View>
        );
    }

    // Show stock loader if there are no categories
    if (showStockLoader && categories.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateTitle}>No Services Found</Text>
                    <Text style={styles.emptyStateText}>
                        You don't have any services set up yet. You can add services manually or use our
                        predefined templates for common dry cleaning services.
                    </Text>
                    <StockLoader 
                        userId={user?.userId || ""} 
                        onDataLoaded={handleStockDataLoaded}
                        createService={(data) => {
                            if (user?.userId) {
                                return dispatch(fetchCategories(user.userId)).unwrap();
                            }
                            return Promise.reject("User not authenticated");
                        }}
                        createProduct={() => Promise.resolve(null)}
                    />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <ServiceList
                    services={categories} 
                    selectedService={selectedCategory}
                    onSelectService={handleSelectCategory} 
                    onAddService={handleAddCategory}
                    onEditService={handleEditCategory}
                />
                
                {isItemsLoading ? (
                    <View style={styles.loadingContainerProductList}>
                        <ActivityIndicator />
                    </View>
                ) : itemsError ? (
                    <View style={styles.errorContainerProductList}>
                        <Text style={styles.errorText}>Error loading products.</Text>
                    </View>
                ) : (
                    <ProductList
                        products={selectedCategory ? items.filter(item => item.categoryId === selectedCategory) : []}
                        selectedService={selectedCategory}
                        onAddProduct={handleAddItem}
                        onEditProduct={handleEditItem}
                    />
                )}
            </View>

            {/* Modals for creating/editing */}
            {isModalVisible && modalType === "Category" && (
                <CreateFormModal
                    visible={isModalVisible}
                    onClose={handleCloseModal}
                    params={{
                        userId: user?.userId,
                        category: editingCategory
                    }}
                    type="Category"
                    createOrEdit={modalMode}
                />
            )}

            {isModalVisible && modalType === "Item" && (
                <CreateFormModal
                    visible={isModalVisible}
                    onClose={handleCloseModal}
                    params={{
                        categoryId: selectedCategory,
                        item: editingItem
                    }}
                    type="Item"
                    createOrEdit={modalMode}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 8,
        overflow: "hidden",
    },
    loadingContainer: { 
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingContainerProductList: { 
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorContainer: { 
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorContainerProductList: { 
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        color: "red",
        textAlign: "center",
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "white",
        borderRadius: 8,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },
    emptyStateText: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        color: "#666",
    }
});