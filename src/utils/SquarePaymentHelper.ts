// src/utils/SquarePaymentHelper.ts
import { Platform } from 'react-native';
import MockSquareSDK from './MockSquareSDK';

// Always use the mock implementation during development
const SquareSDK = MockSquareSDK;

export default SquareSDK;