// src/components/BarcodeScannerModal.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    Dimensions,
    Animated,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { styles } from '../styles/components/barcodeScannerModalStyles';

interface BarcodeScannerModalProps {
    visible: boolean;
    onClose: () => void;
    onCodeScanned: (value: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
    visible,
    onClose,
    onCodeScanned,
}) => {
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [orientation, setOrientation] = useState('portrait');

    // Animation for the scanning line
    const scanLineAnimation = useRef(new Animated.Value(0)).current;

    // Monitor orientation changes
    useEffect(() => {
        const updateOrientation = () => {
            const { width, height } = Dimensions.get('window');
            setOrientation(width < height ? 'portrait' : 'landscape');
        };

        // Initial check
        updateOrientation();

        // Listen for orientation changes
        Dimensions.addEventListener('change', updateOrientation);

        return () => {
            // Cleanup event listener
            // Note: In newer React Native versions, this is handled differently
            // This is a simplified approach
        };
    }, []);

    useEffect(() => {
        if (visible) {
            // Start the scanning line animation when modal is visible
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnimation, {
                        toValue: 1,
                        duration: 2000, // 2 seconds to move down
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnimation, {
                        toValue: 0,
                        duration: 2000, // 2 seconds to move back up
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            // Stop the animation when modal is closed
            scanLineAnimation.stopAnimation();
        }
    }, [visible, scanLineAnimation]);

    // Request camera permissions on mount
    useEffect(() => {
        (async () => {
            try {
                const cameraPermission = await request(
                    Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
                );
                setHasPermission(cameraPermission === RESULTS.GRANTED);
            } catch (error) {
                console.error('Error requesting camera permission:', error);
                setHasPermission(false);
            }
        })();
    }, []);

    // Reset scanned state when modal opens
    useEffect(() => {
        if (visible) {
            setScanned(false);
        }
    }, [visible]);

    // Handle barcode detection
    const handleCodeScanned = useCallback(
        (event: { nativeEvent: { codeStringValue: string } }) => {
            if (!scanned && event.nativeEvent.codeStringValue) {
                const scannedValue = event.nativeEvent.codeStringValue;
                setScanned(true);
                onCodeScanned(scannedValue);
                onClose();
            }
        },
        [scanned, onCodeScanned, onClose]
    );

    // Handle unavailable camera
    if (hasPermission === false) {
        return (
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
            >
                <SafeAreaView style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.errorText}>
                            Camera permission not granted. Please enable camera access in device settings.
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    // Render loading state
    if (hasPermission === null) {
        return (
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
            >
                <SafeAreaView style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <ActivityIndicator size="large" />
                        <Text style={styles.text}>Initializing camera...</Text>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    // Calculate the translateY value for the scanning line
    const translateY = scanLineAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 490] // Fixed height for scan area
    });

    // Screen dimensions
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const scanBoxSize = 500;
    
    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.safeAreaContainer}>
                <View style={styles.container}>
                    {/* Camera takes up the full screen */}
                    <Camera
                        style={styles.camera}
                        cameraType={CameraType.Back}
                        flashMode="auto"
                        scanBarcode={true}
                        onReadCode={handleCodeScanned}
                        showFrame={false}
                        laserColor="transparent"
                        frameColor="transparent"
                        scanThrottleDelay={1000}
                        ratioOverlay={'1:1'}
                    />

                    {/* Extra layers to completely hide any UI elements from the library */}
                    <View style={styles.fullScreenMask} />
                    <View style={[styles.extraCoverRight, orientation === 'portrait' ? styles.visibleCover : styles.hiddenCover]} />
                    <View style={[styles.extraCoverBottom, orientation === 'landscape' ? styles.visibleCover : styles.hiddenCover]} />

                    {/* Completely opaque overlay with cutout for scanning area */}
                    <View style={styles.overlayContainer}>
                        {/* Top semi-transparent section */}
                        <View style={[styles.opaqueSectionTop, {height: (screenHeight / 2) - (scanBoxSize / 2)}]} />
                        
                        {/* Middle row with transparent center */}
                        <View style={styles.middleSection}>
                            {/* Left semi-transparent section */}
                            <View style={[styles.opaqueSectionSide, {width: (screenWidth - scanBoxSize) / 2}]} />
                            
                            {/* Transparent scanning area */}
                            <View style={[styles.scanArea, {width: scanBoxSize, height: scanBoxSize}]}>
                                {/* Corner indicators */}
                                <View style={[styles.corner, styles.topLeftCorner]} />
                                <View style={[styles.corner, styles.topRightCorner]} />
                                <View style={[styles.corner, styles.bottomLeftCorner]} />
                                <View style={[styles.corner, styles.bottomRightCorner]} />
                                
                                {/* Scanning line */}
                                <Animated.View
                                    style={[
                                        styles.scanLine,
                                        { transform: [{ translateY }] }
                                    ]}
                                />
                            </View>
                            
                            {/* Right semi-transparent section */}
                            <View style={[styles.opaqueSectionSide, {width: (screenWidth - scanBoxSize) / 2}]} />
                        </View>
                        
                        {/* Bottom semi-transparent section - extends to the bottom of the screen */}
                        <View style={[styles.opaqueSectionBottom, {flex: 1}]} />
                    </View>

                    {/* Header text - absolute positioned on top of everything */}
                    <View style={styles.headerContainer}>
                        <Text style={styles.headerText}>Scan Barcode or QR Code</Text>
                        <Text style={styles.instructionText}>
                            Position the code within the square
                        </Text>
                    </View>

                    {/* Cancel button area with matching semi-transparent background */}
                    <View style={styles.bottomButtonArea}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default BarcodeScannerModal;