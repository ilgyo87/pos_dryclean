// src/screens/Dashboard/hooks/useDashboardData.ts
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";

export const useDashboardData = () => {
  const business = useSelector((state: RootState) => state.business.businesses[0]);
  const isLoading = useSelector((state: RootState) => state.business.isLoading);
  return { business, isLoading };
};

export default useDashboardData;