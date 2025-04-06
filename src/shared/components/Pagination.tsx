import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

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
    <View style={paginationStyles.container}>
      <TouchableOpacity
        style={[
          paginationStyles.arrowButton,
          currentPage === 0 && paginationStyles.arrowButtonDisabled
        ]}
        onPress={onPrevPage}
        disabled={currentPage === 0}
      >
        <Text style={paginationStyles.arrowText}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          paginationStyles.arrowButton,
          currentPage === totalPages - 1 && paginationStyles.arrowButtonDisabled
        ]}
        onPress={onNextPage}
        disabled={currentPage === totalPages - 1}
      >
        <Text style={paginationStyles.arrowText}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const paginationStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: '#1890ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  arrowButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  arrowText: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    // Text shadow for the arrow characters
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default Pagination;