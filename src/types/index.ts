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