import { Platform } from 'react-native';

// Android emulators reach the host machine at 10.0.2.2, not localhost.
const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? defaultUrl).replace(/\/+$/, '');
