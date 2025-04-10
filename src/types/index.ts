export interface BusinessButtonsProps {
    userId: string;
    businessName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    onCloseModal: () => void;
    onResetForm?: () => void;
}