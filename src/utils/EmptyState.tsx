import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { styles } from '../styles/screens/productManagementStyles';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {message}
      </Text>
    </View>
  );
};

export default EmptyState;