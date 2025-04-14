import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { SafeAreaView, View, Alert } from "react-native";
import Navigation from "./components/Navigation";
import CreateFormModal from "./components/CreateFormModal";
import { ActivityIndicator } from "react-native";
import Toast from 'react-native-toast-message';

const client = generateClient<Schema>();

export default function AuthenticatedApp() {
    const { user } = useAuthenticator((context) => [context.user]);
    const userId = user?.userId;
    const [isBusinessAvailable, setIsBusinessAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentEmployee, setCurrentEmployee] = useState<{ id: string, name: string } | null>(null);

    const checkUserBusiness = async (uid: string) => {
        try {
            setIsLoading(true);

            const { data, errors } = await client.models.Business.list({
                filter: { userId: { eq: uid } }
            });

            if (data && !errors && data.length > 0) {
                setIsBusinessAvailable(true);
            } else {
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
                <Navigation
                    user={user}
                    employee={currentEmployee}
                    onSwitchEmployee={() => {}}
                />
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