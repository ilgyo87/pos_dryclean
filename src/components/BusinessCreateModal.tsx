import { KeyboardAvoidingView, Modal, Platform, Text, View, StyleSheet } from "react-native";
import BusinessForm from "./BusinessForm";

export default function BusinessCreateModal({ userId, onCloseModal }: { userId: string, onCloseModal: () => void }) {
    return (
        <Modal 
            onRequestClose={onCloseModal} 
            animationType="fade"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create New Business</Text>
                    <BusinessForm userId={userId} onCloseModal={onCloseModal} />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalContent: {
        width: '50%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    }
});