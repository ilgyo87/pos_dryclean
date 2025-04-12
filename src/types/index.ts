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
  onCancel: () => void;
  onReset: () => void;
  onCreate: (data: any) => Promise<void>;
  isValid: boolean;
  isLoading: boolean;
  entityType?: string;
  isEdit?: boolean;
  data?: any; 
  onDelete?: (data: any) => Promise<void>; 
}

export type DashboardCategory = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  color: string;
};