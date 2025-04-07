// src/screens/EmployeeManagement/styles/employeeDetailStyles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeIcon: {
    color: '#999',
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
});
