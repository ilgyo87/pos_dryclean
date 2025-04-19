// src/screens/Employees/components/EmployeeForm.tsx
import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View, Text, TextInput, Alert, Platform, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { usePhoneNumberAvailability } from "../../../components/usePhoneNumberAvailability";
import { Schema } from "../../../../amplify/data/resource";
import { usePinCodeAvailability } from "../../../components/usePinCodeAvailability";
import { useAppDispatch } from "../../../store/hooks";
import { createEmployee, updateEmployee } from "../../../store/slices/EmployeeSlice";

type RoleType = "MANAGER" | "STAFF" | "ADMIN" | "CLEANER" | "PRESSER" | "COUNTER";
type StatusType = "ACTIVE" | "INACTIVE" | "ON_LEAVE";

// Define an interface for the employee data
interface EmployeeFormData {
    id?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    role: RoleType;
    status?: StatusType;
    hourlyRate?: number;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    pinCode?: string;
    userId?: string;
}

const EmployeeForm = forwardRef(({
    onCloseModal,
    createOrEdit,
    params,
    onFormChange
}: {
    onCloseModal: () => void,
    createOrEdit: "create" | "edit",
    params: Record<string, any>,
    onFormChange?: () => void
}, ref) => {
    const existingEmployee = createOrEdit === "edit" ? params?.employee : null;

    // Form state
    const [firstName, setFirstName] = useState(existingEmployee?.firstName || "");
    const [lastName, setLastName] = useState(existingEmployee?.lastName || "");
    const [email, setEmail] = useState(existingEmployee?.email || "");
    const [role, setRole] = useState<RoleType>(existingEmployee?.role || "STAFF");
    const [status, setStatus] = useState<StatusType>(existingEmployee?.status || "ACTIVE");
    const [hourlyRate, setHourlyRate] = useState(existingEmployee?.hourlyRate?.toString() || "");
    const [address, setAddress] = useState(existingEmployee?.address || "");
    const [city, setCity] = useState(existingEmployee?.city || "");
    const [state, setState] = useState(existingEmployee?.state || "");
    const [zipCode, setZipCode] = useState(existingEmployee?.zipCode || "");
    // pinCode is now managed by the usePinCodeAvailability hook

    // UI state for dropdowns
    const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    // Phone number with availability check
    const {
        phoneNumber,
        setPhoneNumber,
        isAvailable: phoneNumberAvailable,
        isChecking: isCheckingPhone,
        getPhoneInputStyle,
        getPhoneStatusText
    } = usePhoneNumberAvailability({
        initialPhoneNumber: existingEmployee?.phoneNumber || "",
        currentEntityId: existingEmployee?.id,
        entityType: "Employee"
    });

    // Pin code state and availability
    const [pinCode, setPinCode] = useState(existingEmployee?.pinCode || "");
    const pinCodeAvailable = usePinCodeAvailability(pinCode, existingEmployee?.id);

    // Get loading state from Redux store
    const reduxLoading = useSelector((state: RootState) => state.employee.isLoading);
    const [isLoading, setIsLoading] = useState(false);

    // Update loading state from Redux
    useEffect(() => {
        setIsLoading(reduxLoading);
    }, [reduxLoading]);

    // Notify parent component when form changes
    useEffect(() => {
        if (onFormChange) {
            onFormChange();
        }
    }, [
        firstName, lastName, email, phoneNumber, role,
        hourlyRate, address, city, state, zipCode, status, pinCode
    ]);

    const dispatch = useAppDispatch();
    const userId = params?.userId;
    const [submitError, setSubmitError] = useState<string|null>(null);

    // Validate and collect form data
    const validateAndGetFormData = () => {
        if (!firstName.trim()) return { valid: false, message: "First name is required" };
        if (!lastName.trim()) return { valid: false, message: "Last name is required" };
        if (!phoneNumber.trim()) return { valid: false, message: "Phone number is required" };
        if (phoneNumberAvailable === false) return { valid: false, message: "Phone number is already in use" };
        if (!pinCode.trim() || pinCode.length !== 4) return { valid: false, message: "A 4-digit PIN code is required" };
        if (pinCodeAvailable === false) return { valid: false, message: "A PIN code is already in use" };
        // Build payload
        const data: any = { firstName, lastName, email, phoneNumber, role, status, address, city, state, zipCode, pinCode };
        if (hourlyRate) data.hourlyRate = parseFloat(hourlyRate);
        if (createOrEdit === "edit" && existingEmployee?.id) data.id = existingEmployee.id;
        return { valid: true, ...data };
    };

    // Submit handler for CreateFormModal
    const handleSubmit = async () => {
        setSubmitError(null);
        const formData = validateAndGetFormData();
        if (!formData.valid) {
            setSubmitError(formData.message!);
            return;
        }
        try {
            setIsLoading(true);
            if (createOrEdit === "create") {
                await dispatch(createEmployee({ employeeData: formData, userId })).unwrap();
            } else {
                await dispatch(updateEmployee({ employeeData: formData, userId })).unwrap();
            }
        } catch (err: any) {
            setSubmitError(err.message || "Failed to save employee");
        } finally {
            setIsLoading(false);
        }
    };

    // Role options
    const roleOptions: { label: string; value: RoleType }[] = [
        { label: "Manager", value: "MANAGER" },
        { label: "Staff", value: "STAFF" },
        { label: "Admin", value: "ADMIN" },
        { label: "Cleaner", value: "CLEANER" },
        { label: "Presser", value: "PRESSER" },
        { label: "Counter", value: "COUNTER" }
    ];

    // Status options
    const statusOptions: { label: string; value: StatusType; color: string }[] = [
        { label: "Active", value: "ACTIVE", color: "#4CAF50" },
        { label: "Inactive", value: "INACTIVE", color: "#F44336" },
        { label: "On Leave", value: "ON_LEAVE", color: "#FFC107" }
    ];

    // Get formatted role name
    const getFormattedRole = (roleValue: RoleType): string => {
        const option = roleOptions.find(opt => opt.value === roleValue);
        return option ? option.label : "Staff";
    };

    // Get status with color
    const getStatusWithColor = (statusValue: StatusType) => {
        return statusOptions.find(opt => opt.value === statusValue) || statusOptions[0];
    };

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        resetForm: () => {
            if (createOrEdit === "edit" && existingEmployee) {
                // In edit mode, reset to the original employee data
                setFirstName(existingEmployee.firstName || "");
                setLastName(existingEmployee.lastName || "");
                setEmail(existingEmployee.email || "");
                setPhoneNumber(existingEmployee.phoneNumber || "");
                setRole(existingEmployee.role || "STAFF");
                setHourlyRate(existingEmployee.hourlyRate?.toString() || "");
                setAddress(existingEmployee.address || "");
                setCity(existingEmployee.city || "");
                setState(existingEmployee.state || "");
                setZipCode(existingEmployee.zipCode || "");
                setStatus(existingEmployee.status || "ACTIVE");
                setPinCode(existingEmployee.pinCode || "");
            } else {
                // In create mode, clear the form completely
                setFirstName("");
                setLastName("");
                setEmail("");
                setPhoneNumber("");
                setRole("STAFF");
                setHourlyRate("");
                setAddress("");
                setCity("");
                setState("");
                setZipCode("");
                setStatus("ACTIVE");
                setPinCode("");
            }
        },
        validateAndGetFormData,
        handleSubmit
    }));

    const handleHourlyRateChange = (text: string) => {
        // Only allow numbers and decimal point
        const filteredText = text.replace(/[^0-9.]/g, "");
        setHourlyRate(filteredText);
    };

    const handlePinCodeChange = (text: string) => {
        // Only allow numbers and limit to 4 digits
        const filteredText = text.replace(/[^0-9]/g, "").substring(0, 4);
        setPinCode(filteredText);
    };

    const selectRole = (selectedRole: RoleType) => {
        setRole(selectedRole);
        setIsRoleDropdownOpen(false);
    };

    const selectStatus = (selectedStatus: StatusType) => {
        setStatus(selectedStatus);
        setIsStatusDropdownOpen(false);
    };

    const currentStatus = getStatusWithColor(status);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer}>
                <Text style={styles.label}>First Name*</Text>
                <TextInput
                    placeholder="Enter first name"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Last Name*</Text>
                <TextInput
                    placeholder="Enter last name"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Phone Number*</Text>
                <TextInput
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={[
                        styles.input,
                        phoneNumberAvailable === true && styles.validInput,
                        phoneNumberAvailable === false && styles.invalidInput
                    ]}
                    keyboardType="phone-pad"
                    placeholderTextColor="#A0A0A0"
                />
                {phoneNumber.length >= 10 && (
                    <Text style={getPhoneInputStyle(
                        styles.statusText,
                        styles.available,
                        styles.unavailable,
                        styles.checking
                    )}>
                        {getPhoneStatusText(
                            "Checking availability...",
                            "Phone number is available",
                            "Phone number is already in use"
                        )}
                    </Text>
                )}

                <Text style={styles.label}>Email</Text>
                <TextInput
                    placeholder="Enter email address"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Role*</Text>
                <View style={[styles.dropdownContainer, { zIndex: isRoleDropdownOpen ? 3 : 1 }]}>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                            setIsRoleDropdownOpen(!isRoleDropdownOpen);
                            setIsStatusDropdownOpen(false);
                        }}
                    >
                        <Text style={styles.dropdownButtonText}>{getFormattedRole(role)}</Text>
                        <Ionicons
                            name={isRoleDropdownOpen ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#333"
                        />
                    </TouchableOpacity>

                    {isRoleDropdownOpen && (
                        <View style={styles.dropdownList}>
                            {roleOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.dropdownItem,
                                        role === option.value && styles.dropdownItemSelected
                                    ]}
                                    onPress={() => selectRole(option.value)}
                                >
                                    <Text
                                        style={[
                                            styles.dropdownItemText,
                                            role === option.value && styles.dropdownItemTextSelected
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {role === option.value && (
                                        <Ionicons name="checkmark" size={18} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <Text style={styles.label}>Status</Text>
                <View style={[styles.dropdownContainer, { zIndex: isStatusDropdownOpen ? 2 : 1 }]}>
                    <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => {
                            setIsStatusDropdownOpen(!isStatusDropdownOpen);
                            setIsRoleDropdownOpen(false);
                        }}
                    >
                        <View style={styles.statusContainer}>
                            <View
                                style={[
                                    styles.statusIndicator,
                                    { backgroundColor: currentStatus.color }
                                ]}
                            />
                            <Text style={styles.dropdownButtonText}>{currentStatus.label}</Text>
                        </View>
                        <Ionicons
                            name={isStatusDropdownOpen ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#333"
                        />
                    </TouchableOpacity>

                    {isStatusDropdownOpen && (
                        <View style={styles.dropdownList}>
                            {statusOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.dropdownItem,
                                        status === option.value && styles.dropdownItemSelected
                                    ]}
                                    onPress={() => selectStatus(option.value)}
                                >
                                    <View style={styles.statusContainer}>
                                        <View
                                            style={[
                                                styles.statusIndicator,
                                                { backgroundColor: option.color }
                                            ]}
                                        />
                                        <Text
                                            style={[
                                                styles.dropdownItemText,
                                                status === option.value && styles.dropdownItemTextSelected
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </View>
                                    {status === option.value && (
                                        <Ionicons name="checkmark" size={18} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <Text style={styles.label}>Hourly Rate ($)</Text>
                <TextInput
                    placeholder="Enter hourly rate"
                    value={hourlyRate}
                    onChangeText={handleHourlyRateChange}
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>PIN Code (4 digits)*</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder="Enter 4-digit PIN"
                        value={pinCode}
                        onChangeText={handlePinCodeChange}
                        style={[
                            styles.input,
                            pinCodeAvailable === true && styles.validInput,
                            pinCodeAvailable === false && styles.invalidInput
                        ]}
                        keyboardType="number-pad"
                        maxLength={4}
                        secureTextEntry
                        placeholderTextColor="#A0A0A0"
                    />
                    {pinCode.length > 0 && (
                        <View style={styles.statusIndicatorContainer}>
                            {pinCode.length === 4 ? (
                                <Text style={[styles.statusText, { color: pinCodeAvailable ? '#4CAF50' : '#E53935' }]}> 
                                    {pinCodeAvailable ? 'Available' : 'Already in use'}
                                </Text>
                            ) : null}
                        </View>
                    )}
                </View>

                <Text style={styles.sectionHeader}>Address</Text>

                <Text style={styles.label}>Street Address</Text>
                <TextInput
                    placeholder="Enter street address"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>City</Text>
                <TextInput
                    placeholder="Enter city"
                    value={city}
                    onChangeText={setCity}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>State</Text>
                <TextInput
                    placeholder="Enter state"
                    value={state}
                    onChangeText={setState}
                    style={styles.input}
                    placeholderTextColor="#A0A0A0"
                />

                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChangeText={setZipCode}
                    style={styles.input}
                    keyboardType="numeric"
                    placeholderTextColor="#A0A0A0"
                />

                {isLoading && <ActivityIndicator size="small" color="#0000ff" style={styles.loader} />}
            </ScrollView>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    scrollContainer: {
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
    },
    label: {
        marginBottom: 5,
        fontWeight: "500",
        color: "#333",
    },
    sectionHeader: {
        fontSize: 25,
        fontWeight: "bold",
        marginTop: 16,
        marginBottom: 8,
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    validInput: {
        borderColor: "#4CAF50",  // Green for valid
        backgroundColor: "rgba(76, 175, 80, 0.1)",
    },
    invalidInput: {
        borderColor: "#E53935",  // Red for invalid
        backgroundColor: "rgba(229, 57, 53, 0.1)",
    },
    statusText: {
        fontSize: 12,
        marginRight: 5,
        marginTop: -10,
        marginBottom: 10,
        textAlign: "right"
    },
    statusIndicatorContainer: {
        position: "absolute",
        right: 10,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
    },
    inputContainer: {
        position: "relative",
        marginBottom: 15,
    },
    available: {
        color: "#4CAF50", // Green
    },
    unavailable: {
        color: "#E53935", // Red
    },
    checking: {
        color: "#0000ff", // Blue
    },
    loader: {
        marginVertical: 10,
    },
    dropdownContainer: {
        marginBottom: 15,
        position: "relative",
        // The base z-index will be overridden by inline styles
        zIndex: 1,
    },
    dropdownButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        backgroundColor: "#fff",
    },
    dropdownButtonText: {
        fontSize: 16,
        color: "#333",
    },
    dropdownList: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        marginTop: 5,
        maxHeight: 200,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 2,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
    },
    dropdownItemSelected: {
        backgroundColor: "rgba(0, 122, 255, 0.1)",
    },
    dropdownItemText: {
        fontSize: 16,
        color: "#333",
    },
    dropdownItemTextSelected: {
        color: "#007AFF",
        fontWeight: "500",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
});

export default EmployeeForm;