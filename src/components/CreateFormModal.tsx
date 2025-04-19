import React from "react";
import { View } from "react-native";
import ModalContainer from "./ModalContainer";
import BusinessForm from "./BusinessForm";
import CustomerForm from "../screens/Customers/components/CustomerForm";
import EmployeeForm from "../screens/Employees/components/EmployeeForm";
import CategoryForm from "../screens/Products/components/CategoryForm";
import ItemForm from "../screens/Products/components/ItemForm";
import FormModal from "./FormModal";

interface CreateFormModalProps {
  visible: boolean;
  onClose: () => void;
  type: "Business" | "Customer" | "Employee" | "Category" | "Item";
  createOrEdit: "create" | "edit";
  params?: any;
}

const CreateFormModal: React.FC<CreateFormModalProps> = ({
  visible,
  onClose,
  type,
  createOrEdit,
  params
}) => {
  const formRef = React.useRef<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [isFormValid, setIsFormValid] = React.useState(true);
  const [formChanged, setFormChanged] = React.useState(false);

  const handleSubmit = async () => {
    if (formRef.current) {
      try {
        setLoading(true);
        await formRef.current.handleSubmit();
        onClose();
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    if (formRef.current) {
      formRef.current.resetForm();
      setFormChanged(false);
    }
  };

  const handleDelete = async () => {
    if (formRef.current) {
      try {
        setLoading(true);
        await formRef.current.handleDelete();
        onClose();
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderFormContent = () => {
    switch (type) {
      case "Business":
        return (
          <BusinessForm
            ref={formRef}
            onCloseModal={onClose}
            createOrEdit={createOrEdit}
            params={params}
            onFormChange={() => setFormChanged(true)}
          />
        );
      case "Customer":
        return (
          <CustomerForm
            ref={formRef}
            onCloseModal={onClose}
            createOrEdit={createOrEdit}
            params={params}
            onFormChange={() => setFormChanged(true)}
            userId={params?.userId}
          />
        );
      case "Employee":
        return (
          <EmployeeForm
            ref={formRef}
            onCloseModal={onClose}
            createOrEdit={createOrEdit}
            params={params}
            onFormChange={() => setFormChanged(true)}
          />
        );
      case "Category":
        return (
          <CategoryForm
            ref={formRef}
            onCloseModal={onClose}
            createOrEdit={createOrEdit}
            params={params}
            onFormChange={() => setFormChanged(true)}
          />
        );
      case "Item":
        return (
          <ItemForm
            ref={formRef}
            onCloseModal={onClose}
            createOrEdit={createOrEdit}
            params={params}
            onFormChange={() => setFormChanged(true)}
          />
        );
      default:
        return <View />;
    }
  };

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      type={type}
      createOrEdit={createOrEdit}
      formRef={formRef}
      loading={loading}
      isFormValid={isFormValid}
      formChanged={formChanged}
      setFormChanged={setFormChanged}
      handleSubmit={handleSubmit}
      handleReset={handleReset}
      handleDelete={createOrEdit === "edit" ? handleDelete : undefined}
      params={params}
    >
      {renderFormContent()}
    </FormModal>
  );
};

export default CreateFormModal;
