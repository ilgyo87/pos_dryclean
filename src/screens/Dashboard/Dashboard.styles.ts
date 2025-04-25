import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center', // keep horizontal centering for now
    justifyContent: 'flex-start', // top align
    backgroundColor: '#f7f9fa',
  },
  businessInfo: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16, // less padding
    marginBottom: 16, // less margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 300,
    maxWidth: 400,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  businessDetail: {
    fontSize: 16,
    color: '#444',
    marginBottom: 4,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007bff',
    color: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    textAlign: 'center',
    alignSelf: 'center',
    marginTop: 10,
  }
});

export default styles;
