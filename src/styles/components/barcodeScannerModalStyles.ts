import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)', // Semi-transparent background
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  fullScreenMask: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Slightly darken the camera view
  },
  extraCoverRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30%',  // Wide enough to cover the green box
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent black
    zIndex: 5,  // Above the camera but below our UI
  },
  extraCoverBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '30%',  // Tall enough to cover any bottom UI elements
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent black
    zIndex: 5,  // Above the camera but below our UI
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
    zIndex: 10,  // Above the extra covers
  },
  opaqueSectionTop: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent black
  },
  opaqueSectionBottom: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent black
  },
  middleSection: {
    flexDirection: 'row',
    height: 500, // Same as scanBoxSize
  },
  opaqueSectionSide: {
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent black
  },
  scanArea: {
    backgroundColor: 'transparent',
  },
  scanLine: {
    width: 490, // Slightly less than container width
    height: 2,
    backgroundColor: '#FF3131', // Bright red scanning line
    marginLeft: 5,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
    borderColor: 'white', // White corners for visibility
    backgroundColor: 'transparent',
  },
  topLeftCorner: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRightCorner: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeftCorner: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRightCorner: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  headerContainer: {
    position: 'absolute',
    top: '15%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white', // White text for visibility
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  instructionText: {
    fontSize: 14,
    color: 'white', // White text for visibility
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomButtonArea: {
    bottom: 0,
    left: 0,
    right: 0,
    height: '20%',
    backgroundColor: 'rgba(0,0,0,0.7)', // Semi-transparent to match other areas
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15, // Above other overlays but below the button itself
    position: 'relative',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: '#2196F3',
    borderRadius: 20,
    padding: 15,
    elevation: 2,
    minWidth: 120,
    alignItems: 'center',
    zIndex: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: {
    marginTop: 15,
    color: '#333',
    fontSize: 16,
  },
  errorText: {
    marginBottom: 15,
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});