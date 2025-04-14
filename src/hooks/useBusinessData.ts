import { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../amplify/data/resource";
import { AuthUser } from '@aws-amplify/auth';

const client = generateClient<Schema>();

export const useBusinessData = (user: AuthUser | null) => {
  const [businesses, setBusinesses] = useState<Schema['Business']['type'][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchBusinesses = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, errors } = await client.models.Business.list({
        filter: { userId: { eq: user.userId } }
      });

      if (errors) {
        console.error("Error fetching businesses:", errors);
        return;
      }

      setBusinesses(data || []);
    } catch (error) {
      console.error("Error in fetchBusinesses:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const createBusiness = async (businessData: Schema["Business"]["type"]) => {
    try {
      const { data, errors } = await client.models.Business.create({
        ...businessData,
        userId: user?.userId || '',
      });
    
      if (errors) {
        console.error("Error creating business:", errors[0].message);
        throw new Error(errors[0].message);
      }
    
      // Refresh the business list
      fetchBusinesses();
      return data;
    } catch (error) {
      console.error("Error in createBusiness:", error);
      throw error;
    }
  };

  const updateBusiness = async (businessData: Schema["Business"]["type"]) => {
    if (!businessData.id) {
      throw new Error("Business ID is required for update");
    }

    try {
      const { data, errors } = await client.models.Business.update(businessData);

      if (errors) {
        console.error("Error updating business:", errors);
        throw new Error(errors[0].message);
      }

      // Refresh the business list
      fetchBusinesses();
      return data;
    } catch (error) {
      console.error("Error in updateBusiness:", error);
      throw error;
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!businessId) {
      throw new Error("Business ID is required for deletion");
    }

    try {
      const { data, errors } = await client.models.Business.delete({
        id: businessId
      });

      if (errors) {
        console.error("Error deleting business:", errors);
        throw new Error(errors[0].message);
      }

      // Refresh the business list
      fetchBusinesses();
      return data;
    } catch (error) {
      console.error("Error in deleteBusiness:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBusinesses();
    }
  }, [user?.userId]);

  return {
    businesses,
    isLoading,
    refreshing,
    setRefreshing,
    fetchBusinesses,
    createBusiness,
    updateBusiness,
    deleteBusiness
  };
};