import React, { useState } from 'react';
import CustomerForm from '../Categories/Customers/CustomerForm';
import type { Customer } from '../../types';

interface CheckoutScreenCustomerFormModalProps {
  visible: boolean;
  customer: Customer | null;
  businessId?: string;
  onClose: () => void;
  onSuccess?: (customer?: Customer) => void;
}

const CheckoutScreenCustomerFormModal: React.FC<CheckoutScreenCustomerFormModalProps> = ({
  visible,
  customer,
  businessId,
  onClose,
  onSuccess,
}) => {
  return (
    <CustomerForm
      visible={visible}
      userId={businessId}
      onClose={onClose}
      onSuccess={onSuccess}
      customer={customer}
    />
  );
};

export default CheckoutScreenCustomerFormModal;
