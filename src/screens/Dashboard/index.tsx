import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { AuthUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

export default function Dashboard({ user }: { user: AuthUser | null }) {
  const [business, setBusiness] = useState<Schema["Business"]["type"]>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBusiness = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data: business, errors } = await client.models.Business.list();
    setBusiness(business[0]);
    setIsLoading(false);

    if (errors) {
      console.error("Error fetching business:", errors);
      Alert.alert("Error", "Failed to fetch business data.");
      setBusiness(undefined);
    } else if (business && business.length > 0) {
      setBusiness(business[0]);
    } else {
      setBusiness(undefined);
    }

  };

  useEffect(() => {
    fetchBusiness();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : business ? (
        <View>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text>Address: {business.address}</Text>
          <Text>Phone: {business.phoneNumber}</Text>
        </View>
      ) : (
        <Text>No business associated with this account.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  }
});