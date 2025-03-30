import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { styles } from '../styles/components/utilityStyles';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[
          styles.paginationButton,
          currentPage === 0 && styles.paginationButtonDisabled
        ]}
        onPress={onPrevPage}
        disabled={currentPage === 0}
      >
        <Text>←</Text>
      </TouchableOpacity>

      <Text style={styles.paginationText}>
        Page {currentPage + 1} of {totalPages}
      </Text>

      <TouchableOpacity
        style={[
          styles.paginationButton,
          currentPage === totalPages - 1 && styles.paginationButtonDisabled
        ]}
        onPress={onNextPage}
        disabled={currentPage === totalPages - 1}
      >
        <Text>→</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Pagination;