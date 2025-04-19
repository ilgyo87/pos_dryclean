import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import ModalContainer from "./ModalContainer";

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  type: "Business" | "Customer" | "Employee" | "Category" | "Item";
  createOrEdit: "create" | "edit";
  formRef: React.RefObject<any>;
  loading: boolean;
  isFormValid: boolean;
  formChanged: boolean;
  setFormChanged: (changed: boolean) => void;
  handleSubmit: () => void;
  handleReset: () => void;
  handleDelete?: () => void;
  params?: any;
  children?: React.ReactNode;
}

const FormModal: React.FC<FormModalProps> = ({
  visible,
  onClose,
  type,
  createOrEdit,
  formRef,
  loading,
  isFormValid,
  formChanged,
  setFormChanged,
  handleSubmit,
  handleReset,
  handleDelete,
  params,
  children
}) => {
  const getEntityTitle = (): string => {
    switch (type) {
      case "Business":
        return "Business";
      case "Customer":
        return "Customer";
      case "Employee":
        return "Employee";
      case "Category":
        return "Service";
      case "Item":
        return "Product";
      default:
        return type;
    }
  };

  // Render the actual form content passed as children
  const renderForm = () => {
    if (children) return children;
    return (
      <View style={styles.formPlaceholder} />
    );
  };


  return (
    <ModalContainer
      visible={visible}
      onClose={onClose}
      title={`${createOrEdit === "create" ? "Create" : "Edit"} ${getEntityTitle()}`}
      onSubmit={handleSubmit}
      onReset={handleReset}
      onDelete={handleDelete}
      loading={loading}
      isFormValid={isFormValid}
      formChanged={formChanged}
      createOrEdit={createOrEdit}
    >
      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={{
          paddingBottom: 24,
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {renderForm()}
      </ScrollView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    padding: 20,
  },
  formPlaceholder: {
    width: "100%",
    minHeight: 200,
  }
});

export default FormModal;
