// src/screens/Dashboard/styles/styles.ts
import { StyleSheet } from 'react-native';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 30,
  },
  gridContainer: {
    flex: 1,
    marginTop: 10,
  },
  header: {
    marginBottom: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginVertical: 16,
    width: '100%',
    zIndex: 100,
  },
});

export default dashboardStyles;