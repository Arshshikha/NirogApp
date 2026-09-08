import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getHubItems, addHubItem, subscribeHub } from '../../utils/hubStore';
import { getSession } from '../../utils/authStore';
import { HubItem } from '../../constants/mockData';

// Heart icon (no emoji)
const HeartIcon = ({ size = 10, color = '#f43f5e' }: { size?: number; color?: string }) => (
  <View style={{ width: size + 2, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.65, height: size * 0.55, backgroundColor: color, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, transform: [{ rotate: '-45deg' }], position: 'absolute', top: size * 0.1, left: size * 0.15 }} />
    <View style={{ width: size * 0.65, height: size * 0.55, backgroundColor: color, borderTopLeftRadius: size * 0.35, borderTopRightRadius: size * 0.35, transform: [{ rotate: '45deg' }], position: 'absolute', top: size * 0.1, right: size * 0.15 }} />
  </View>
);

export default function DoctorHubScreen() {
  const router = useRouter();
  const [published, setPublished] = useState<HubItem[]>([]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Blog' | 'Article'>('Blog');
  const [content, setContent] = useState('');

  const session = getSession();
  const authorName = session.name;

  useEffect(() => {
    const updateList = () => {
      // Filter list to only show items authored by this doctor
      const items = getHubItems().filter(item => item.authorId === session.profileId);
      setPublished(items);
    };

    updateList();
    const unsubscribe = subscribeHub(updateList);
    return () => unsubscribe();
  }, [session.profileId]);

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Please enter a title and content.');
      return;
    }

    addHubItem(title.trim(), type, content.trim(), authorName, 'Cardiologist');
    
    setTitle('');
    setContent('');
    Alert.alert('Published!', `Your ${type.toLowerCase()} has been shared and is now visible on Patient and Student screens.`);
  };

  const inputStyle = {
    backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: '#0f172a', fontWeight: '600' as const, fontSize: 13, marginBottom: 14,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
      {/* Header */}
      <View style={{
        backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: '#bae6fd',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,marginTop:-36,
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
            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, letterSpacing: -0.3 , marginTop:28}}>
              HUB <Text style={{ color: '#10b981', fontWeight: '700' }}>CREATOR</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Publish Education Blogs
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/doctor/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1, marginTop: 28,
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {session.name ? session.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'D'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Creator Form */}
        <View style={{
          backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
          borderRadius: 20, padding: 18, marginBottom: 20,
          shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}>
          <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '800', marginBottom: 16 }}>Draft New Content</Text>

          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Content Title</Text>
          <TextInput
            placeholder="e.g. Navigating Hypertension in Older Adults"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            style={inputStyle}
          />

          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Publishing Format</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            {(['Blog', 'Article'] as const).map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={{
                  flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center',
                  backgroundColor: type === t ? '#e0f2fe' : '#f8fafc',
                  borderColor: type === t ? '#38bdf8' : '#e2e8f0',
                }}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: type === t ? '#0369a1' : '#64748b' }}>
                  {t === 'Blog' ? 'Blog Post' : 'Research Article'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Body Content</Text>
          <TextInput
            placeholder="Write clinical advice or share diagnostic summaries..."
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={{ ...inputStyle, height: 120, marginBottom: 18 }}
          />

          <TouchableOpacity
            onPress={handlePublish}
            style={{ backgroundColor: '#0ea5e9', paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Publish Content</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
          Published by You
        </Text>
        {published.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#bae6fd', borderRadius: 20, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '700' }}>No published content yet.</Text>
          </View>
        ) : (
          published.map(item => (
            <View key={item.id} style={{
              backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
              borderRadius: 16, padding: 16, marginBottom: 10,
              shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc' }}>
                    <Text style={{ color: '#0369a1', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }}>{item.type}</Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '600' }}>Today</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <HeartIcon size={10} color="#f43f5e" />
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700' }}>{item.likes}</Text>
                </View>
              </View>
              <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 13 }}>{item.title}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}