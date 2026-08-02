import { apiGet, apiPost, apiPut } from './api';
import { Provider } from '../constants/mockData';

export interface RegisteredProvider extends Provider {
  userId?: string;
  email?: string;
  phone?: string;
  documentName?: string;
  age?: string;
  experience?: string;
  description?: string;
  website?: string;
  operatingHours?: any;
  dbServices?: any[]; // Full service objects from DB
}

let memoryProviders: RegisteredProvider[] = [];
let listeners: (() => void)[] = [];
let isLoaded = false;

export const loadProvidersFromApi = async () => {
  try {
    const dbProviders = await apiGet('/providers');
    if (dbProviders && Array.isArray(dbProviders)) {
      memoryProviders = dbProviders.map((p: any) => {
        const typeStr = p.providerType === 'LAB' ? 'Lab' : p.providerType === 'HOSPITAL' ? 'Hospital' : 'Pharmacy';
        
        // Find line1 address
        const addrStr = p.address ? `${p.address.line1}, ${p.address.city}` : 'Noida';
        
        return {
          id: p.id,
          userId: p.userId,
          name: p.legalName,
          type: typeStr,
          rating: parseFloat(p.avgRating) || 5.0,
          location: addrStr,
          distance: '1.2 km',
          services: p.services?.filter((s: any) => s.isActive).map((s: any) => s.name) || [],
          avatar: p.user?.profile?.avatarFile?.url || (typeStr === 'Lab' ? 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=200' : 'https://images.unsplash.com/photo-1586773860418-d3b31966cfde?w=200'),
          email: p.user?.email || '',
          phone: p.user?.profile?.phone || '',
          documentName: p.permitFileId || undefined,
          age: p.user?.profile?.bio ? p.user.profile.bio.replace('Establishment Age: ', '') : '10 Years',
          experience: '10 Yrs',
          description: p.description || undefined,
          website: p.website || undefined,
          operatingHours: p.operatingHours || undefined,
          dbServices: p.services || []
        };
      });
      listeners.forEach(fn => fn());
    }
  } catch (e) {
    console.error('Failed to load providers from backend', e);
  }
};

export const getProviders = (): RegisteredProvider[] => {
  if (!isLoaded) {
    isLoaded = true;
    loadProvidersFromApi();
  }
  return memoryProviders;
};

export const subscribeProviders = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};

export const addProviderService = async (providerProfileId: string, name: string, price: number, availableSlot: string) => {
  try {
    await apiPost(`/providers/${providerProfileId}/services`, { name, price, availableSlot });
    await loadProvidersFromApi();
  } catch (e) {
    console.error('Failed to add provider service', e);
    throw e;
  }
};

export const toggleProviderService = async (serviceId: string, isActive: boolean) => {
  try {
    await apiPut(`/providers/services/${serviceId}/toggle`, { isActive });
    await loadProvidersFromApi();
  } catch (e) {
    console.error('Failed to toggle provider service', e);
    throw e;
  }
};
