import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSession } from '../../utils/authStore';
import { HubItem } from '../../constants/mockData';
import { getHubItems, subscribeHub } from '../../utils/hubStore';

// Search Icon (no emoji)
const SearchIcon = ({ size = 14, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.65, height: size * 0.65, borderRadius: size * 0.65, borderWidth: 1.5, borderColor: color }} />
    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 1.5, height: size * 0.35, backgroundColor: color, transform: [{ rotate: '-45deg' }], borderRadius: 1 }} />
  </View>
);

// Clock icon (no emoji)
const ClockIcon = ({ size = 10, color = '#94a3b8' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: 1.5, height: size * 0.35, backgroundColor: color, top: size * 0.12, borderRadius: 1 }} />
    <View style={{ position: 'absolute', width: size * 0.3, height: 1.5, backgroundColor: color, left: size * 0.5, top: size * 0.43, borderRadius: 1 }} />
  </View>
);

// Heart icon (no emoji)
const HeartIcon = ({ size = 10, color = '#f43f5e' }: { size?: number; color?: string }) => (
  <View style={{ width: size + 2, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.65, height: size * 0.55, backgroundColor: color, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, transform: [{ rotate: '-45deg' }], position: 'absolute', top: size * 0.1, left: size * 0.15 }} />
    <View style={{ width: size * 0.65, height: size * 0.55, backgroundColor: color, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, transform: [{ rotate: '45deg' }], position: 'absolute', top: size * 0.1, right: size * 0.15 }} />
  </View>
);

// Back arrow
const BackArrow = ({ color = '#0369a1' }: { color?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: 6, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: 10, height: 2, backgroundColor: color, marginLeft: -1, borderRadius: 1 }} />
  </View>
);

export default function StudentHubScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Blog' | 'Special Case'>('All');
  const [activeDetailItem, setActiveDetailItem] = useState<HubItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hubItems, setHubItems] = useState(() => getHubItems());

  useEffect(() => {
    const update = () => setHubItems(getHubItems());
    const unsubscribe = subscribeHub(update);
    return () => unsubscribe();
  }, []);

  const feedItems = hubItems.filter((item) => {
    if (item.type === 'Course') return false;

    // Filter pill matching: Blogs includes both blogs and research articles
    if (activeFilter !== 'All') {
      if (activeFilter === 'Blog' && item.type !== 'Blog' && item.type !== 'Article') return false;
      if (activeFilter === 'Special Case' && item.type !== 'Special Case') return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      
      // Match type terms like "blog", "case", "article"
      const matchesTypeQuery = 
        (query.includes('blog') && (item.type === 'Blog' || item.type === 'Article')) ||
        (query.includes('case') && item.type === 'Special Case') ||
        (query.includes('article') && item.type === 'Article');

      return (
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        matchesTypeQuery
      );
    }
    return true;
  });

  if (activeDetailItem) {
    const isCase = activeDetailItem.type === 'Special Case';
    const tagBg = isCase ? '#e0f2fe' : '#ecfdf5';
    const tagBorder = isCase ? '#7dd3fc' : '#a7f3d0';
    const tagText = isCase ? '#0369a1' : '#059669';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View style={{
          paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
          flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        }}>
          <TouchableOpacity
            onPress={() => setActiveDetailItem(null)}
            style={{ marginRight: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <BackArrow color="#0369a1" />
            <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '800', flex: 1 }} numberOfLines={1}>
            {activeDetailItem.type === 'Blog' ? 'Clinical Blog' : 'Case Study'}
          </Text>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: '#f0f9ff' }} contentContainerStyle={{ paddingBottom: 40 }}>
          {activeDetailItem.thumbnail && (
            <Image source={{ uri: activeDetailItem.thumbnail }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
          )}
          <View style={{ padding: 20 }}>
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe', borderRadius: 20, padding: 24, shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, backgroundColor: tagBg, borderWidth: 1, borderColor: tagBorder, marginRight: 8 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', textTransform: 'uppercase', color: tagText }}>{activeDetailItem.type}</Text>
                </View>
                {activeDetailItem.duration && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <ClockIcon size={10} color="#94a3b8" />
                    <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>{activeDetailItem.duration}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 20, marginBottom: 16, lineHeight: 28 }}>{activeDetailItem.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e0f2fe', paddingVertical: 14, marginBottom: 20, gap: 12 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Dr</Text>
                </View>
                <View>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13 }}>{activeDetailItem.author}</Text>
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{activeDetailItem.authorTitle}</Text>
                </View>
              </View>
              <Text style={{ color: '#475569', fontSize: 13, lineHeight: 22 }}>{activeDetailItem.content}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#bae6fd',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginTop:-36,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={{
              width: 36, height: 36, borderRadius: 10, marginRight: 10, marginTop: 28
            }}
            resizeMode="contain"
          />
          <View>
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3, marginTop: 28 }}>
              STUDENT <Text style={{ color: '#10b981', fontWeight: '700' }}>HUB</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Medical Study Portal
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/student/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,
            marginTop: 28,
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {getSession().name ? getSession().name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'S'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd',
          borderRadius: 16, flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 14, paddingVertical: 11,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
        }}>
          <SearchIcon size={15} color="#94a3b8" />
          <TextInput
            placeholder="Search academic blogs, case studies..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ color: '#0f172a', flex: 1, fontSize: 12, fontWeight: '600', marginLeft: 8 }}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View style={{ paddingVertical: 4 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          canCancelContentTouches={true}
          scrollEventThrottle={16}
          directionalLockEnabled={true}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 8, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
        >
          {(['All', 'Blog', 'Special Case'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            const label = filter === 'All' ? 'All Resources' : filter === 'Blog' ? 'Clinical Blogs' : 'Case Studies';
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.7}
                onPress={() => setActiveFilter(filter)}
                style={{
                  flexShrink: 0,
                  marginRight: 8,
                  paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.2,
                  backgroundColor: isActive ? '#e0f2fe' : '#ffffff',
                  borderColor: isActive ? '#0284c7' : '#e2e8f0',
                  shadowColor: '#0ea5e9', shadowOpacity: isActive ? 0.12 : 0.04, shadowRadius: 4, elevation: isActive ? 2 : 1,
                }}
              >
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#0284c7' : '#64748b' }}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {feedItems.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 32, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700' }}>No academic resources match your search.</Text>
          </View>
        ) : (
          feedItems.map((item) => {
            const isCase = item.type === 'Special Case';
            const tagBg = isCase ? '#e0f2fe' : '#ecfdf5';
            const tagBorder = isCase ? '#7dd3fc' : '#a7f3d0';
            const tagText = isCase ? '#0369a1' : '#059669';

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setActiveDetailItem(item)}
                style={{
                  backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                  borderRadius: 20, marginBottom: 14, overflow: 'hidden',
                  shadowColor: '#0ea5e9', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
                }}
              >
                {item.thumbnail && <Image source={{ uri: item.thumbnail }} style={{ width: '100%', height: 140 }} resizeMode="cover" />}
                <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8, backgroundColor: tagBg, borderWidth: 1, borderColor: tagBorder }}>
                      <Text style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', color: tagText }}>
                        {item.type === 'Blog' ? 'Clinical Blog' : 'Case Study'}
                      </Text>
                    </View>
                    <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700' }}>By {item.author}</Text>
                  </View>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13, marginBottom: 6, lineHeight: 20 }}>{item.title}</Text>
                  <Text style={{ color: '#64748b', fontSize: 11, lineHeight: 18 }} numberOfLines={2}>{item.content}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f9ff' }}>
                    <Text style={{ fontWeight: '800', fontSize: 11, color: tagText }}>
                      {item.type === 'Special Case' ? 'Analyze Case Study →' : 'Read Article →'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <HeartIcon size={10} color="#f43f5e" />
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8' }}>{item.likes} Likes</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}