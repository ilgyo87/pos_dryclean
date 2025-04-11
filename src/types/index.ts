import { Ionicons } from "@expo/vector-icons";

export interface BusinessButtonsProps {
    userId: string;
    businessName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    phoneNumberAvailable: boolean | null;
    onCloseModal: () => void;
    onResetForm?: () => void;
}

export type DashboardCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  color: string;
};