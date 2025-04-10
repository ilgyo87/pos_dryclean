import { KeyboardAvoidingView, Modal, Platform, Text, View } from "react-native";
import { AuthUser } from "@aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useState } from "react";
import { styles } from "../styles/BusinessCreateStyles";

const client = generateClient<Schema>();

interface BusinessCreateProps {
    user: AuthUser | null;
    onCloseModal: () => void;
}

export default function BusinessCreate({ user, onCloseModal }: BusinessCreateProps) {
    const userId = user?.userId;
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [qrCode, setQrCode] = useState('');


    return (
        <Modal onRequestClose={onCloseModal}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            >
                <View style={{ width: '50%', height: '50%', backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: "center"}}>
                    <Text style={{ fontSize: 30, fontWeight: 'bold' }}>Create New Business</Text>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}