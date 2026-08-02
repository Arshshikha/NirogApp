import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pure JavaScript in-memory cache fallback for environments without native linking
const memoryCache: Record<string, string> = {};

export const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage getItem warning:', e);
      return memoryCache[key] || null;
    }
  }
  
  try {
    // Attempt native storage
    const value = await AsyncStorage.getItem(key);
    return value !== null ? value : (memoryCache[key] || null);
  } catch (e: any) {
    console.warn('AsyncStorage native module not linked, falling back to memory cache:', e.message);
    return memoryCache[key] || null;
  }
};

export const setItem = async (key: string, value: string): Promise<void> => {
  memoryCache[key] = value; // Always write to fallback cache

  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
      return;
    } catch (e) {
      console.warn('localStorage setItem warning:', e);
      return;
    }
  }

  try {
    await AsyncStorage.setItem(key, value);
  } catch (e: any) {
    console.warn('AsyncStorage native module not linked, falling back to memory cache:', e.message);
  }
};

export const removeItem = async (key: string): Promise<void> => {
  delete memoryCache[key];

  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
      return;
    } catch (e) {
      console.warn('localStorage removeItem warning:', e);
      return;
    }
  }

  try {
    await AsyncStorage.removeItem(key);
  } catch (e: any) {
    console.warn('AsyncStorage native module not linked, falling back to memory cache:', e.message);
  }
};
