export interface BusinessData {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    owner: string;
    qrCode?: string;
    website?: string;
    createdAt?: string;
    updatedAt?: string;
  }