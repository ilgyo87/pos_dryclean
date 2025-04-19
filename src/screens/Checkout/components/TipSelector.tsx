// src/screens/Checkout/components/TipSelector.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";

interface TipSelectorProps {
  subtotal: number;
  value: string;
  onChange: (value: string) => void;
}

const TipSelector: React.FC<TipSelectorProps> = ({ 
  subtotal, 
  value, 
  onChange 
}) => {
  const [customTip, setCustomTip] = useState(value);
  const [activePercent, setActivePercent] = useState<number | null>(null);
  
  // Default tip percentages
  const tipPercentages = [0, 10, 15, 20];

  // When subtotal changes, recalculate the tip if a percentage is selected
  useEffect(() => {
    if (activePercent !== null) {
      const calculatedTip = (subtotal * activePercent / 100).toFixed(2);
      setCustomTip(calculatedTip);
      onChange(calculatedTip);
    }
  }, [subtotal, activePercent, onChange]);

  // Handle selecting a percentage
  const handleSelectPercent = (percent: number) => {
    setActivePercent(percent);
    const calculatedTip = (subtotal * percent / 100).toFixed(2);
    setCustomTip(calculatedTip);
    onChange(calculatedTip);
  };

  // Handle custom tip input
  const handleCustomTipChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const sanitizedText = text.replace(/[^0-9.]/g, "");
    
    // Ensure only one decimal point
    const parts = sanitizedText.split(".");
    let formattedText = parts[0];
    if (parts.length > 1) {
      formattedText += "." + parts[1].substring(0, 2); // Limit to 2 decimal places
    }
    
    setCustomTip(formattedText);
    onChange(formattedText);
    
    // Deselect the percentage button when manually editing
    setActivePercent(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Tip</Text>
      
      <View style={styles.percentButtons}>
        {tipPercentages.map((percent) => (
          <TouchableOpacity
            key={percent}
            style={[
              styles.percentButton,
              activePercent === percent && styles.activePercentButton
            ]}
            onPress={() => handleSelectPercent(percent)}
          >
            <Text
              style={[
                styles.percentText,
                activePercent === percent && styles.activePercentText
              ]}
            >
              {percent === 0 ? "No Tip" : `${percent}%`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.customTipContainer}>
        <Text style={styles.customTipLabel}>Custom Amount:</Text>
        <View style={styles.customTipInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.customTipInput}
            value={customTip}
            onChangeText={handleCustomTipChange}
            keyboardType="numeric"
            placeholder="0.00"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  percentButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  percentButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
  },
  activePercentButton: {
    backgroundColor: "#2196F3",
  },
  percentText: {
    color: "#555",
    fontWeight: "500",
  },
  activePercentText: {
    color: "#fff",
  },
  customTipContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  customTipLabel: {
    fontSize: 16,
    color: "#555",
  },
  customTipInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    paddingHorizontal: 10,
    minWidth: 100,
  },
  currencySymbol: {
    fontSize: 16,
    color: "#555",
    marginRight: 5,
  },
  customTipInput: {
    fontSize: 16,
    paddingVertical: 8,
    minWidth: 60,
  },
});

export default TipSelector;