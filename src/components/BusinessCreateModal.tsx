import { KeyboardAvoidingView, Modal, Platform, Text, View } from "react-native";
import React from "react";
import BusinessForm from "./BusinessForm";

export default function BusinessCreateModal({ userId, onCloseModal }: { userId: string, onCloseModal: () => void }) {
    return (
        <Modal onRequestClose={onCloseModal} animationType="fade">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            >
                <View style={{
                    width: '50%',
                    backgroundColor: 'white',
                    borderRadius: 30,
                    padding: 10,
                    alignItems: "center",
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.7,
                    shadowRadius: 6,
                    flex: 0,
                }}>
                    <Text style={{ fontSize: 30, fontWeight: 'bold' }}>Create New Business</Text>
                    <BusinessForm userId={userId} onCloseModal={onCloseModal} />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}