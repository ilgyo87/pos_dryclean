// src/AuthenticatedApp.tsx
import { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react-native";
import { SafeAreaView, View, Alert } from "react-native";
import Navigation from "./components/Navigation";
import CreateFormModal from "./components/CreateFormModal";
import { ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { fetchBusinesses } from "./store/slices/BusinessSlice";
import { Schema } from "../amplify/data/resource";

export default function AuthenticatedApp() {
    const { user } = useAuthenticator((context) => [context.user]);
    const userId = user?.userId;
    const [isBusinessAvailable, setIsBusinessAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentEmployee, setCurrentEmployee] = useState<{ id: string, name: string } | null>(null);
    
    // Redux hooks
    const dispatch = useAppDispatch();
    const { businesses, isLoading: isBusinessLoading, error } = useAppSelector(state => state.business);

    useEffect(() => {
        if (userId) {
            // Fetch businesses using Redux
            dispatch(fetchBusinesses(userId))
                .unwrap()
                .then((result) => {
                    setIsBusinessAvailable(result.length > 0);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching businesses:", err);
                    setIsBusinessAvailable(false);
                    setIsLoading(false);
                });
        }
    }, [userId, dispatch]);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
                <Navigation
                    user={user}
                    employee={currentEmployee}
                    onSwitchEmployee={setCurrentEmployee}
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
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                            <ActivityIndicator size="large" color="#0000ff" />
                        </View>
                    )
                )}
            </View>
            <Toast />
        </SafeAreaView>
    );
}