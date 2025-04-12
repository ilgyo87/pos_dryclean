// src/screens/Dashboard/styles/styles.ts
import { StyleSheet } from 'react-native';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  gridContainer: {
    flex: 1,
    width: '100%',

  },
  header: {
    marginBottom: 3,
  },
  businessName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginVertical: 25,
    width: '100%',
    zIndex: 100,
  },
});

export default dashboardStyles;