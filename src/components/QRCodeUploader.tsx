// import React, { useState, useRef } from 'react';
// import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import QRCode from 'react-native-qrcode-svg';
// import { uploadData, getUrl } from 'aws-amplify/storage';
// import { v4 as uuidv4 } from 'uuid';

// /**
//  * Component for generating and uploading QR codes to S3
//  * 
//  * @param {Object} props
//  * @param {string} props.value - Content to encode in QR code
//  * @param {string} props.type - Type of object (customer, garment, etc.)
//  * @param {string} props.id - ID of the object
//  * @param {Function} props.onUploadComplete - Callback when upload completes
//  * @param {number} props.size - Size of QR code (default: 200)
//  * @param {string} props.backgroundColor - Background color (default: white)
//  * @param {string} props.color - Foreground color (default: black)
//  */
// const QRCodeUploader = ({
//   value,
//   type,
//   id,
//   onUploadComplete,
//   size = 200,
//   backgroundColor = 'white',
//   color = 'black',
// }) => {
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState(null);
//   const [uploadedUrl, setUploadedUrl] = useState(null);
//   const qrRef = useRef();

//   const generateQRAndUpload = async () => {
//     if (!qrRef.current) {
//       setError('QR code reference not available');
//       return;
//     }

//     setUploading(true);
//     setError(null);

//     try {
//       // Get QR code as base64 PNG
//       const qrPromise = new Promise((resolve) => {
//         qrRef.current.toDataURL(resolve);
//       });
//       const base64Data = await qrPromise;
      
//       // Convert base64 to blob
//       const fetchResponse = await fetch(`data:image/png;base64,${base64Data}`);
//       const blob = await fetchResponse.blob();
      
//       // Generate unique file path
//       const filePath = `${type}/${id}/${uuidv4()}.png`;
      
//       // Upload to S3 using Amplify Gen 2 API
//       const result = await uploadData({
//         key: filePath,
//         data: blob,
//         options: {
//           contentType: 'image/png',
//           metadata: {
//             objectType: type,
//             objectId: id,
//             content: value
//           }
//         }
//       });
      
//       // Get the URL for the uploaded file
//       const urlResult = await getUrl({
//         key: result.key,
//         options: {
//           expiresIn: 3600 // URL expires in 1 hour
//         }
//       });
      
//       setUploadedUrl(urlResult.url);
      
//       if (onUploadComplete) {
//         onUploadComplete({
//           key: result.key,
//           url: urlResult.url
//         });
//       }
//     } catch (err) {
//       console.error('Error uploading QR code:', err);
//       setError(err.message || 'Failed to upload QR code');
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* QR Code */}
//       <QRCode
//         value={value}
//         size={size}
//         backgroundColor={backgroundColor}
//         color={color}
//         getRef={(ref) => (qrRef.current = ref)}
//       />
      
//       {/* Upload Button */}
//       <TouchableOpacity 
//         style={styles.button} 
//         onPress={generateQRAndUpload} 
//         disabled={uploading}
//       >
//         {uploading ? (
//           <ActivityIndicator size="small" color="#ffffff" />
//         ) : (
//           <Text style={styles.buttonText}>Upload QR Code</Text>
//         )}
//       </TouchableOpacity>
      
//       {/* Error message */}
//       {error && <Text style={styles.errorText}>{error}</Text>}
      
//       {/* Success message */}
//       {uploadedUrl && (
//         <Text style={styles.successText}>
//           QR code uploaded successfully!
//         </Text>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   button: {
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: '#007AFF',
//     borderRadius: 8,
//   },
//   buttonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   errorText: {
//     color: '#ff0000',
//     fontSize: 14,
//     marginTop: 8,
//   },
//   successText: {
//     color: '#008000',
//     fontSize: 14,
//     marginTop: 8,
//   },
// });