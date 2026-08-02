import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolve backend API base address depending on platform
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  // Connect to the computer's local network IP (useful for physical devices & emulators)
  const hostUri = Constants.expoConfig?.hostUri;
  const devMachineIp = hostUri ? hostUri.split(':')[0] : '10.101.92.173';
  return `http://${devMachineIp}:5000/api`;
};

export const API_BASE_URL = getBaseUrl();

interface FetchOptions extends RequestInit {
  bodyData?: any;
}

import { getTokenInMemory } from './tokenHolder';

const request = async (path: string, options: FetchOptions = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  
  const token = getTokenInMemory();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.bodyData) {
    headers.set('Content-Type', 'application/json');
    options.body = JSON.stringify(options.bodyData);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        errMsg = errJson.error;
      }
    } catch (_) {}
    throw new Error(errMsg);
  }

  return response.json();
};

export const apiGet = (path: string) => request(path, { method: 'GET' });
export const apiPost = (path: string, bodyData: any) => request(path, { method: 'POST', bodyData });
export const apiPatch = (path: string, bodyData: any) => request(path, { method: 'PATCH', bodyData });
export const apiPut = (path: string, bodyData: any) => request(path, { method: 'PUT', bodyData });
export const apiDelete = (path: string) => request(path, { method: 'DELETE' });
