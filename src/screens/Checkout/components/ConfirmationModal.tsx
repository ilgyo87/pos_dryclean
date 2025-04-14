// src/screens/Checkout/components/ConfirmationModal.tsx
import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    FlatList
} from 'react-native';

interface ConfirmationModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    orderDetails: {
        customerName: string;
        items: Array<{
            id: string;
            name: string;
            price: number;
            quantity: number;
            type: 'service' | 'product';
        }>;
        subtotal: number;
        tax: number;
        tip: number;
        total: number;
        paymentMethod: string;
        pickupDate: string;
    };
}

const ConfirmationModal = ({
    visible,
    onCancel,
    onConfirm,
    orderDetails
}: ConfirmationModalProps) => {

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format payment method for display
    const formatPaymentMethod = (method: string) => {
        return method.replace('_', ' ').split(' ')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Confirm Order</Text>

                    <ScrollView style={styles.modalScroll}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Customer</Text>
                            <Text style={styles.customerName}>{orderDetails.customerName}</Text>
                            <Text style={styles.pickupDate}>
                                Pickup Date: {formatDate(orderDetails.pickupDate)}
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Items</Text>
                            <FlatList
                                data={orderDetails.items}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                                renderItem={({ item }) => (
                                    <View style={styles.itemRow}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemType}>
                                                {item.type === 'service' ? 'Service' : 'Product'}
                                            </Text>
                                        </View>
                                        <View style={styles.itemPricing}>
                                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                            <Text style={styles.itemPrice}>
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Payment</Text>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Method:</Text>
                                <Text style={styles.paymentValue}>
                                    {formatPaymentMethod(orderDetails.paymentMethod)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Order Total</Text>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal:</Text>
                                <Text style={styles.totalValue}>${orderDetails.subtotal.toFixed(2)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Tax:</Text>
                                <Text style={styles.totalValue}>${orderDetails.tax.toFixed(2)}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Tip:</Text>
                                <Text style={styles.totalValue}>${orderDetails.tip.toFixed(2)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.grandTotalRow}>
                                <Text style={styles.grandTotalLabel}>Total:</Text>
                                <Text style={styles.grandTotalValue}>${orderDetails.total.toFixed(2)}</Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        maxWidth: 500,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#2196F3',
    },
    modalScroll: {
        maxHeight: '90%',
    },
    section: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 5,
    },
    pickupDate: {
        fontSize: 14,
        color: '#555',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
    },
    itemType: {
        fontSize: 13,
        color: '#777',
    },
    itemPricing: {
        alignItems: 'flex-end',
    },
    itemQuantity: {
        fontSize: 13,
        color: '#555',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '500',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    paymentLabel: {
        fontSize: 15,
        color: '#555',
    },
    paymentValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    totalLabel: {
        fontSize: 15,
        color: '#555',
    },
    totalValue: {
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 8,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    grandTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2196F3',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        marginLeft: 10,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#555',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});

export default ConfirmationModal;