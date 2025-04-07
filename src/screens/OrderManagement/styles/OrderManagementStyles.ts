// src/screens/OrderManagement/styles/OrderManagementStyles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  actionButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  ordersList: {
    padding: 8,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumber: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333333',
  },
  orderStatus: {
    fontWeight: '500',
    fontSize: 12,
  },
  orderDetails: {
    marginBottom: 8,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#777777',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  filterContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
  },
  filterOptionActive: {
    backgroundColor: '#1E88E5',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#555555',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5EB',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#F0F2F5',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
});