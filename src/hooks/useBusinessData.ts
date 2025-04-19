import { useEffect } from "react";
import { AuthUser } from "@aws-amplify/auth";
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchBusinesses,
  createBusiness as createBusinessThunk,
  updateBusiness as updateBusinessThunk,
  deleteBusiness as deleteBusinessThunk
} from "../store/slices/BusinessSlice";

export const useBusinessData = (user: AuthUser | null) => {
  const dispatch = useAppDispatch();
  const businesses = useAppSelector(state => state.business.businesses);
  const isLoading = useAppSelector(state => state.business.isLoading);
  const error = useAppSelector(state => state.business.error);

  // Fetch businesses for the current user
  useEffect(() => {
    if (user?.userId) {
      dispatch(fetchBusinesses(user.userId));
    }
  }, [user?.userId, dispatch]);

  // CRUD operations using thunks
  const createBusiness = async (businessData: any) => {
    if (!user?.userId) throw new Error("User ID is required");
    return await dispatch(createBusinessThunk({ businessData, userId: user.userId }));
  };

  const updateBusiness = async (businessData: any) => {
    if (!user?.userId) throw new Error("User ID is required");
    return await dispatch(updateBusinessThunk({ businessData, userId: user.userId }));
  };

  const deleteBusiness = async (businessId: string) => {
    return await dispatch(deleteBusinessThunk(businessId));
  };


  return {
    businesses,
    isLoading,
    error,
    createBusiness,
    updateBusiness,
    deleteBusiness,
  };
};