import { View, Text, Modal, TextInput, Pressable, ActivityIndicator } from "react-native";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { useState } from "react";
import { styles } from "../componentStyles/BusinessCreateStyles";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

const client = generateClient<Schema>();

interface BusinessCreateProps {
    isVisible: boolean;
    onClose: () => void;
}

export default function BusinessCreate({ isVisible, onClose }: BusinessCreateProps) {
    const { signOut } = useAuthenticator();
    const [businessName, setBusinessName] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [isFormValid, setIsFormValid] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const createBusiness = async () => {
        await client.models.Business.create({
            name: businessName,
            firstName: firstName || '',
            lastName: lastName || '',
            phoneNumber: phoneNumber || ''
        });
    };

    const resetForm = () => {
        setBusinessName('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setIsFormValid(false);
    };


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose} // For Android back button
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Create New Business</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Business Name"
                        value={businessName}
                        onChangeText={setBusinessName}
                        editable={!isLoading}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Owner's First Name"
                        value={firstName}
                        onChangeText={setFirstName}
                        editable={!isLoading}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Owner's Last Name"
                        value={lastName}
                        onChangeText={setLastName}
                        editable={!isLoading}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        editable={!isLoading}
                    />

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={[styles.button, styles.buttonCancel]}
                            onPress={signOut}
                            disabled={isLoading}
                        >
                            <Text style={styles.textStyleCancel}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonReset]}
                            onPress={resetForm}
                            disabled={isLoading}
                        >
                            <Text style={styles.textStyleReset || styles.textStyle}>Reset</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.button, styles.buttonSubmit, !isFormValid || isLoading ? styles.buttonDisabled : {}]}
                            onPress={createBusiness}
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.textStyle}>Create</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}