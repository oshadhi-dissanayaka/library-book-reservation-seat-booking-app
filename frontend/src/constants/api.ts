import Constants from 'expo-constants';

const developmentHost = Constants.expoConfig?.hostUri?.split(':')[0];
const defaultApiUrl = developmentHost
  ? `http://${developmentHost}:5000/api`
  : 'http://localhost:5000/api';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || defaultApiUrl
).replace(/\/+$/, '');

export const BACKEND_ROOT_URL = API_BASE_URL.replace(/\/api$/, '');
