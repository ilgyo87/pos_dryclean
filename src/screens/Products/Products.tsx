import { View, StyleSheet, ActivityIndicator, Alert, Text } from "react-native"; 
import { AuthUser } from "aws-amplify/auth";
import { useState } from "react"; 
import ServiceList from './components/ServiceList';
import ProductList from './components/ProductList';
import { useServices } from './hooks/useServices';
import { useProducts } from './hooks/useProducts';
import { useProductManagement } from './hooks/useProductManagement';

export default function Products({ user, navigation }: { user: AuthUser | null, navigation?: any }) {
    const [selectedService, setSelectedService] = useState<string | null>(null);

    const { services, isLoading: isLoadingServices, error: servicesError } = useServices();
    const { products, isLoading: isLoadingProducts, error: productsError } = useProducts(selectedService);
    const { addService, addProduct } = useProductManagement();

    if (isLoadingServices) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (servicesError) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error loading services. Please try again later.</Text>
                {/* Optionally add a retry button here */}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <ServiceList
                    services={services} 
                    selectedService={selectedService}
                    onSelectService={setSelectedService} 
                    onAddService={addService}
                />
                
                {isLoadingProducts ? (
                    <View style={styles.loadingContainerProductList}>
                        <ActivityIndicator />
                    </View>
                ) : productsError ? (
                    <View style={styles.errorContainerProductList}>
                        <Text style={styles.errorText}>Error loading products.</Text>
                    </View>
                ) : (
                    <ProductList
                        products={products}
                        selectedService={selectedService}
                        onAddProduct={() => addProduct(selectedService)}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
    },
    loadingContainer: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainerProductList: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainer: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorContainerProductList: { 
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
    }
});