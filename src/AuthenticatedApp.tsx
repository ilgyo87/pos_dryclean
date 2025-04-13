import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { SafeAreaView, View, Alert } from "react-native";
import Navigation from "./components/Navigation";
import CreateFormModal from "./components/CreateFormModal";
import { ActivityIndicator } from "react-native";
import Toast from 'react-native-toast-message';
import { PinInput } from "./components/PinInput";

const client = generateClient<Schema>();

export default function AuthenticatedApp() {
    const { user } = useAuthenticator((context) => [context.user]);
    const userId = user?.userId;
    const [isBusinessAvailable, setIsBusinessAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentEmployee, setCurrentEmployee] = useState<{ id: string, name: string } | null>(null);
    const [pin, setPin] = useState('');
    const [isPinModalVisible, setIsPinModalVisible] = useState(false);
    const [pinError, setPinError] = useState('');

    // Show PIN modal when no employee is logged in and business is available
    useEffect(() => {
        if (isBusinessAvailable && !isLoading && !currentEmployee) {
            setIsPinModalVisible(true);
        }
    }, [isBusinessAvailable, isLoading, currentEmployee]);

    const hidePinModal = () => {
        setIsPinModalVisible(false);
        setPin(''); // Reset PIN when closing
        setPinError('');
    };

    const handlePinSubmit = async () => {
        setPinError('');
        const { data, errors } = await client.models.Employee.list({
            filter: {
                pinCode: { eq: pin }
            }
        });
        if (errors) {
            throw new Error(errors[0].message);
        }
        if (data && data.length > 0) {
            const employee = data[0];
            setCurrentEmployee({
                id: employee.id,
                name: `${employee.firstName} ${employee.lastName}`.trim()
            });
            hidePinModal();
        } else {
            // No employee found with this PIN
            setPinError('Wrong PIN. Try again.');
            setPin(''); // Clear the incorrect PIN
            // The error message will show in the PinInput title
        }
    };

    const showEmployeePinModal = () => {
        setPin(''); // Reset pin
        setPinError(''); // Clear any errors
        setIsPinModalVisible(true);
    };

    useEffect(() => {
        if (pin.length === 4) {
            handlePinSubmit();
        }
    }, [pin]);

    const checkUserBusiness = async (uid: string) => {
        try {
            setIsLoading(true);

            const { data, errors } = await client.models.Business.list({
                filter: { userId: { eq: uid } }
            });

            if (data && !errors && data.length > 0) {
                console.log("Business found:", data);
                setIsBusinessAvailable(true);
            } else {
                console.error("Error checking business:", errors);
                setErrorMessage(errors?.[0]?.message || 'Failed to check business');
                setIsBusinessAvailable(false);
            }
        } catch (error) {
            Alert.alert('Error', errorMessage);
            setIsBusinessAvailable(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            checkUserBusiness(userId);
        }
    }, [userId]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                {isBusinessAvailable && (
                    <>
                        <Navigation
                            user={user}
                            employee={currentEmployee}
                            onSwitchEmployee={showEmployeePinModal} // Pass function as prop
                        />
                        <PinInput
                            value={pin}
                            onChange={setPin}
                            maxLength={4}
                            isVisible={isPinModalVisible}
                            onClose={hidePinModal}
                            onSubmit={handlePinSubmit}
                            title={pinError || "Enter Employee PIN"}
                        />
                    </>
                )}
                {!isBusinessAvailable && !isLoading ? (
                    <CreateFormModal
                        visible={true}
                        onClose={() => setIsBusinessAvailable(true)}
                        params={{ userId }}
                        type="Business"
                        createOrEdit="create"
                    />
                ) : (
                    isLoading && (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#0000ff" />
                        </View>
                    )
                )}
            </View>
            <Toast />
        </SafeAreaView>
    );
}