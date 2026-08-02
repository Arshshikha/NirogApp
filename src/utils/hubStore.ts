import { Platform } from 'react-native';
import { HubItem } from '../constants/mockData';
import { apiGet, apiPost } from './api';
import { getSession } from './authStore';

let memoryHubItems: HubItem[] = [];
let listeners: (() => void)[] = [];
let isLoaded = false;

const mapType = (type: string): HubItem['type'] => {
  if (type === 'COURSE') return 'Course';
  if (type === 'CASE_STUDY') return 'Special Case';
  if (type === 'ARTICLE') return 'Article';
  return 'Blog';
};

const loadHubItemsFromApi = async () => {
  try {
    const dbItems = await apiGet('/hub');
    if (dbItems && Array.isArray(dbItems)) {
      memoryHubItems = dbItems.map((item: any) => {
        const authorName = item.author?.user?.profile
          ? `Dr. ${item.author.user.profile.firstName} ${item.author.user.profile.lastName}`
          : 'System Health';
        const authorTitle = item.author?.specialties?.[0] || 'Medical Expert';

        return {
          id: item.id,
          title: item.title,
          type: mapType(item.type),
          author: authorName,
          authorId: item.authorId || undefined,
          authorTitle: authorTitle,
          duration: item.type === 'COURSE' ? `${item.course?.totalModules || 1} Modules` : undefined,
          content: item.body || item.excerpt || '',
          likes: item.likesCount || 0,
          comments: item.commentsCount || 0,
          videoUrl: item.videoUrl || undefined,
          thumbnail: item.thumbnailFileId || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300',
        };
      });
      listeners.forEach(fn => fn());
    }
  } catch (e) {
    console.error('Failed to load hub items from backend', e);
  }
};

export const getHubItems = (): HubItem[] => {
  if (!isLoaded) {
    isLoaded = true;
    loadHubItemsFromApi();
  }
  return memoryHubItems;
};

export const addHubItem = async (title: string, type: 'Blog' | 'Article', content: string, author: string, authorTitle: string) => {
  const session = getSession();
  // Use session.profileId (DoctorProfile id) if available, otherwise fallback to userId or a mock id
  const authorId = session.profileId || session.id;

  if (!authorId) {
    console.error('No logged in profile found to post hub content');
    return;
  }

  try {
    const body = {
      authorId,
      title,
      type: type.toUpperCase(),
      content,
    };

    const res = await apiPost('/hub', body);
    if (res && res.hubItem) {
      loadHubItemsFromApi();
    }
  } catch (e) {
    console.error('Failed to create hub item', e);
  }
};

export const subscribeHub = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
};
