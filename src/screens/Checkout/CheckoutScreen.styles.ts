import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 3.5, // Increased from 3 to 3.5 to make the product grid larger
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  productSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  rightPanel: {
    flex: 1.5, // Decreased from 2 to 1.5 to make the order summary narrower
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  checkoutSection: {
    padding: 15,
  },
  // Alternative layout for smaller screens
  smallScreenContent: {
    flex: 1,
    flexDirection: 'column',
  },
  smallScreenLeftPanel: {
    flex: 2, // Give more space to product section on small screens
    padding: 10,
  },
  smallScreenRightPanel: {
    flex: 1, // Order summary takes less space on small screens
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  }
});

export default styles;