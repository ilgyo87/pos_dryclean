import React from "react";
import { View, Text, StyleSheet, Modal } from "react-native";
import { CancelButton, ResetButton, CreateButton, DeleteButton, UpdateButton } from "./ButtonComponents";

interface ModalContainerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  loading?: boolean;
  isFormValid?: boolean;
  formChanged?: boolean;
  createOrEdit: "create" | "edit";
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  visible,
  onClose,
  title,
  children,
  onReset,
  onSubmit,
  onDelete,
  loading = false,
  isFormValid = true,
  formChanged = false,
  createOrEdit
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          
          {children}
          
          <View style={styles.buttonContainer}>
            <View style={styles.leftButtons}>
              <CancelButton
                onPress={onClose}
                style={styles.buttonSpacing}
              />
              {onReset && (
                <ResetButton
                  onPress={onReset}
                  disabled={!formChanged}
                  style={styles.buttonSpacing}
                />
              )}
            </View>
            <View style={styles.rightButtons}>
              {createOrEdit === "create" ? (
                <CreateButton
                  onPress={onSubmit}
                  loading={loading}
                  style={styles.buttonSpacing}
                  disabled={!isFormValid}
                />
              ) : (
                <>
                  {onDelete && (
                    <DeleteButton
                      onPress={onDelete}
                      loading={loading}
                      style={styles.buttonSpacing}
                    />
                  )}
                  <UpdateButton
                    onPress={onSubmit}
                    loading={loading}
                    style={styles.buttonSpacing}
                    disabled={!isFormValid}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 20,
    borderRadius: 18,
    width: "90%",
    maxWidth: 500,
    minWidth: 320,
    maxHeight: "70%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: "flex-start",
    display: "flex",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    alignSelf: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 6,
    paddingBottom: 20,
    alignSelf: "center",
    borderTopColor: "#eee",
  },
  leftButtons: {
    flexDirection: "row",
  },
  rightButtons: {
    flexDirection: "row",
  },
  buttonSpacing: {
    marginHorizontal: 20,
  }
});

export default ModalContainer;
