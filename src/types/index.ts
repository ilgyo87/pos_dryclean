import { Ionicons } from "@expo/vector-icons";

export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Garment' | 'Rack' | 'Product' | 'Category' | 'Unknown';

export interface CreateFormModalProps {
  visible: boolean;
  onClose: () => void;
  params: Record<string, any>;
  type: EntityType;
}

export interface CancelResetCreateButtonsProps {
    userId: string;
    entityName: string;
    params: Record<string, any>;
    phoneNumberAvailable?: boolean | null;
    onCloseModal: () => void;
    onResetForm?: () => void;
    isFormValid: boolean;
}

export type DashboardCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  color: string;
};