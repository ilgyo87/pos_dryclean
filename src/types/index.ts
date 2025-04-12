import { Ionicons } from "@expo/vector-icons";

export type EntityType = 'Business' | 'Employee' | 'Customer' | 'Garment' | 'Rack' | 'Product' | 'Category' | 'Unknown';

export interface CreateFormModalProps {
  visible: boolean;
  onClose: () => void;
  params: Record<string, any>;
  type: EntityType;
  createOrEdit: 'create' | 'edit';
}

export interface CancelResetCreateButtonsProps {
    entityName: string;
    params: Record<string, any>;
    phoneNumberAvailable?: boolean | null;
    onCloseModal: () => void;
    onResetForm?: () => void;
    isFormValid: boolean;
    createOrEdit: 'create' | 'edit';
}

export type DashboardCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  color: string;
};