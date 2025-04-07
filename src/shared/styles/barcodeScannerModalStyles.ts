import { StyleSheet, Dimensions } from 'react-native';

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const scanBoxSize = Math.min(screenWidth, screenHeight) * 0.7; // 70% of the smaller dimension

export const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  fullScreenMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)', // Slightly darken the camera view
  },
  extraCoverRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 5,
  },
  extraCoverBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 5,
  },
  visibleCover: {
    opacity: 1,
  },
  hiddenCover: {
    opacity: 0,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    flexDirection: 'column',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  opaqueSectionTop: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  opaqueSectionBottom: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  middleSection: {
    flexDirection: 'row',
    height: scanBoxSize,
    width: '100%',
    alignItems: 'center',
  },
  opaqueSectionSide: {
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scanArea: {
    backgroundColor: 'transparent',
    borderRadius: 10, // Slightly rounded corners for modern look
    overflow: 'hidden', // Ensure the scan line doesn't overflow the rounded corners
  },
  scanLine: {
    width: '96%', // Slightly less than container width
    height: 2,
    backgroundColor: '#4f46e5', // Indigo color to match app theme
    marginLeft: '2%',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: '#4f46e5', // Indigo color to match app theme
    backgroundColor: 'transparent',
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 10,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 10,
  },
  headerContainer: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  bottomButtonArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: '#4f46e5', // Indigo color to match app theme
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    elevation: 5,
    minWidth: 150,
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  text: {
    marginTop: 15,
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 15,
    color: '#ef4444', // Red color for errors
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
