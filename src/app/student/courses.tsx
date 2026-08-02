import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, Modal, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getSession } from '../../utils/authStore';
import { mockCourses, Course, CourseModule } from '../../constants/mockData';
import { getItem, setItem } from '../../utils/storage';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../../utils/api';

// ─── Icon Components ──────────────────────────────────────────────────────────

// Back arrow
const BackArrow = ({ color = '#0369a1' }: { color?: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <View style={{ width: 7, height: 7, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: 10, height: 2, backgroundColor: color, borderRadius: 1, marginLeft: -2 }} />
  </View>
);

// Check icon
const CheckIcon = ({ size = 9, color = '#ffffff' }: { size?: number; color?: string }) => (
  <View style={{ width: size + 2, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.35, height: size * 0.6, borderBottomWidth: 2, borderRightWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }], marginBottom: size * 0.15 }} />
  </View>
);

// Lock icon (for premium)
const LockIcon = ({ size = 12, color = '#0369a1' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size + 2, alignItems: 'center' }}>
    <View style={{ width: size * 0.65, height: size * 0.45, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: color }} />
    <View style={{ width: size, height: size * 0.65, borderRadius: 2, backgroundColor: color + '30', borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center', marginTop: -1 }}>
      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: color }} />
    </View>
  </View>
);

// Target/objective bullet
const BulletDot = ({ color = '#0ea5e9' }: { color?: string }) => (
  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color, marginTop: 5 }} />
);

// Gem icon (for upgrade)
const GemIcon = ({ size = 22, color = '#0369a1' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.7, height: size * 0.7, backgroundColor: color + '25', borderWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }], borderRadius: 3 }} />
  </View>
);

// Book icon
const BookIcon = ({ size = 14, color = '#0369a1' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size + 2, alignItems: 'center' }}>
    <View style={{ position: 'absolute', left: 0, top: 0, width: (size / 2) - 0.5, height: size + 2, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: color, borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }} />
    <View style={{ width: 1.5, height: size + 2, backgroundColor: color, position: 'absolute' }} />
    <View style={{ position: 'absolute', right: 0, top: 0, width: (size / 2) - 0.5, height: size + 2, borderRightWidth: 1.5, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: color, borderTopRightRadius: 2, borderBottomRightRadius: 2 }} />
  </View>
);

// ─── Level Badge ──────────────────────────────────────────────────────────────
const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    Beginner:     { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669' },
    Intermediate: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0369a1' },
    Advanced:     { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' },
  };
  const c = colors[level] || colors.Beginner;
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
      <Text style={{ color: c.text, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>{level}</Text>
    </View>
  );
};

// ─── View States ─────────────────────────────────────────────────────────────
type ViewState = 'courses' | 'modules' | 'detail';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentCoursesScreen() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>('courses');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<CourseModule | null>(null);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({ 'c1m1': true });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeCourse, setUpgradeCourse] = useState<Course | null>(null);
  const [unlockedCourses, setUnlockedCourses] = useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = useState(0);

  // Load unlocked courses on mount
  useEffect(() => {
    const loadUnlockedCourses = async () => {
      try {
        const session = getSession();
        const userId = session?.id || 'guest';
        const stored = await getItem(`unlocked_courses_${userId}`);
        if (stored) {
          setUnlockedCourses(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load unlocked courses', e);
      }
    };
    loadUnlockedCourses();
  }, []);

  const openCourse = (course: Course) => {
    setActiveCourse(course);
    setView('modules');
  };

  const openModule = (module: CourseModule) => {
    if (module.isPremium && activeCourse && !unlockedCourses[activeCourse.id]) {
      setUpgradeCourse(activeCourse);
      setShowUpgrade(true);
      return;
    }
    setActiveModule(module);
    setActiveLesson(0);
    setView('detail');
  };

  const markComplete = (moduleId: string) => {
    setCompletedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleUpgradeSuccess = async (courseId: string) => {
    try {
      const session = getSession();
      const userId = session?.id || 'guest';
      const updated = { ...unlockedCourses, [courseId]: true };
      setUnlockedCourses(updated);
      await setItem(`unlocked_courses_${userId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save unlocked course', e);
    }
  };

  const completedCount = activeCourse
    ? activeCourse.modules.filter(m => completedModules[m.id]).length
    : 0;
  const progressPct = activeCourse
    ? Math.round((completedCount / activeCourse.modules.length) * 100)
    : 0;

  // ─── Shared Header ─────────────────────────────────────────────────────────
  const Header = ({ title, subtitle, onBack }: { title: string; subtitle: string; onBack?: () => void }) => (
    <View style={{
      backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: '#bae6fd',
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,marginTop:-36,
    }}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{ marginRight: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <BackArrow color="#0369a1" />
          <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 11 }}>Back</Text>
        </TouchableOpacity>
      )}
      {!onBack && (
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', marginRight: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3, marginTop: 28 }}>
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>C</Text>
        </View>
      )}
      <View style={{ flex: 1,marginTop:28 }}>
        <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14, letterSpacing: -0.3 ,}} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase',}}>{subtitle}</Text>
      </View>
      {!onBack && (
        <TouchableOpacity
          onPress={() => router.push('/student/profile')}
          style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: '#e0f2fe', borderWidth: 1.5, borderColor: '#0ea5e9',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#0ea5e9', shadowOpacity: 0.1, shadowRadius: 4, elevation: 1,marginTop:28,
          }}
        >
          <Text style={{ color: '#0369a1', fontSize: 11, fontWeight: '900' }}>
            {getSession().name ? getSession().name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : 'S'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: Course List
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'courses') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
        <Header title="MY COURSES" subtitle="Medical Curriculum Study" />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Pro Banner */}
          <View style={{
            backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc',
            borderRadius: 20, padding: 18, marginBottom: 20,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 15 }}>Nirog Pro Academy</Text>
              <Text style={{ color: '#0284c7', fontSize: 11, marginTop: 4, fontWeight: '600', lineHeight: 17 }}>
                Unlock clinical modules, board exam prep, and accredited certificates.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setUpgradeCourse(mockCourses[0]);
                setShowUpgrade(true);
              }}
              style={{ backgroundColor: '#10b981', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Upgrade</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginLeft: 2 }}>
            {mockCourses.length} Enrolled Courses
          </Text>

          {mockCourses.map(course => {
            const done = course.modules.filter(m => completedModules[m.id]).length;
            const pct = Math.round((done / course.modules.length) * 100);
            const isUnlocked = unlockedCourses[course.id];
            const hasPremium = course.modules.some(m => m.isPremium);

            return (
              <TouchableOpacity
                key={course.id}
                onPress={() => openCourse(course)}
                activeOpacity={0.95}
                style={{
                  backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                  borderRadius: 20, overflow: 'hidden', marginBottom: 16,
                  shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
                }}
              >
                <Image source={{ uri: course.thumbnail }} style={{ width: '100%', height: 140 }} resizeMode="cover" />

                {/* Level / Premium badge overlay */}
                <View style={{ position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 6 }}>
                  <LevelBadge level={course.level} />
                  {hasPremium && (
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
                      backgroundColor: isUnlocked ? '#ecfdf5' : '#fef3c7',
                      borderWidth: 1, borderColor: isUnlocked ? '#a7f3d0' : '#fcd34d',
                      flexDirection: 'row', alignItems: 'center', gap: 4
                    }}>
                      {isUnlocked ? (
                        <>
                          <CheckIcon size={8} color="#059669" />
                          <Text style={{ color: '#059669', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }}>Unlocked</Text>
                        </>
                      ) : (
                        <>
                          <LockIcon size={9} color="#b45309" />
                          <Text style={{ color: '#b45309', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }}>PRO (₹{course.price || 499})</Text>
                        </>
                      )}
                    </View>
                  )}
                </View>

                <View style={{ padding: 18 }}>
                  <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    {course.instructor} • {course.instructorTitle.split(',')[0]}
                  </Text>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 16, marginBottom: 6, lineHeight: 22 }}>{course.title}</Text>
                  <Text style={{ color: '#64748b', fontSize: 12, lineHeight: 18, marginBottom: 14 }} numberOfLines={2}>{course.description}</Text>

                  {/* Stats row */}
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#ecfdf5', borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0' }}>
                      <Text style={{ color: '#059669', fontSize: 10, fontWeight: '700' }}>{course.totalModules} Modules</Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f0f9ff', borderRadius: 10, borderWidth: 1, borderColor: '#bae6fd' }}>
                      <Text style={{ color: '#0369a1', fontSize: 10, fontWeight: '700' }}>{course.totalDuration}</Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700' }}>{done}/{course.modules.length} modules completed</Text>
                    <Text style={{ color: '#10b981', fontSize: 10, fontWeight: '800' }}>{pct}%</Text>
                  </View>
                  <View style={{ backgroundColor: '#e2e8f0', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ backgroundColor: '#10b981', height: '100%', width: `${pct}%`, borderRadius: 4 }} />
                  </View>

                  {/* CTA Buttons */}
                  <View style={{ flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    <TouchableOpacity
                      onPress={() => openCourse(course)}
                      style={{ backgroundColor: '#0ea5e9', paddingVertical: 12, borderRadius: 14, alignItems: 'center', shadowColor: '#0ea5e9', shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 }}
                    >
                      <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>
                        {pct === 0 ? 'Start Course' : pct === 100 ? 'Review Course' : 'Continue Course'}  →
                      </Text>
                    </TouchableOpacity>

                    {hasPremium && !isUnlocked && (
                      <TouchableOpacity
                        onPress={() => {
                          setUpgradeCourse(course);
                          setShowUpgrade(true);
                        }}
                        style={{
                          backgroundColor: '#ecfdf5',
                          borderWidth: 1,
                          borderColor: '#a7f3d0',
                          paddingVertical: 11,
                          borderRadius: 14,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <GemIcon size={14} color="#059669" />
                        <Text style={{ color: '#059669', fontWeight: '800', fontSize: 12 }}>
                          Unlock Pro Content (₹{course.price || 499})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <UpgradeModal
          visible={showUpgrade}
          course={upgradeCourse || mockCourses[0]}
          onClose={() => {
            setShowUpgrade(false);
            setUpgradeCourse(null);
          }}
          onUpgradeSuccess={async () => {
            if (upgradeCourse) {
              await handleUpgradeSuccess(upgradeCourse.id);
            }
            setShowUpgrade(false);
            setUpgradeCourse(null);
          }}
        />
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: Module List (inside a course)
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'modules' && activeCourse) {
    const isUnlocked = unlockedCourses[activeCourse.id];
    const hasPremiumModules = activeCourse.modules.some(m => m.isPremium);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
        <Header
          title={activeCourse.title}
          subtitle={`${activeCourse.totalModules} Modules • ${activeCourse.totalDuration}`}
          onBack={() => setView('courses')}
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {/* Course info card */}
          <View style={{
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
            borderRadius: 20, overflow: 'hidden', marginBottom: 20,
            shadowColor: '#0ea5e9', shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
          }}>
            <Image source={{ uri: activeCourse.thumbnail }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', flex: 1 }}>
                  {activeCourse.instructor}
                </Text>
                <LevelBadge level={activeCourse.level} />
              </View>
              <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, marginBottom: 6 }}>{activeCourse.title}</Text>
              <Text style={{ color: '#64748b', fontSize: 12, lineHeight: 18, marginBottom: 14 }}>{activeCourse.description}</Text>

              {/* Progress */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700' }}>{completedCount}/{activeCourse.modules.length} completed</Text>
                <Text style={{ color: '#10b981', fontSize: 11, fontWeight: '800' }}>{progressPct}%</Text>
              </View>
              <View style={{ backgroundColor: '#e2e8f0', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ backgroundColor: '#10b981', height: '100%', width: `${progressPct}%`, borderRadius: 4 }} />
              </View>
            </View>
          </View>

          {/* Premium Upgrade Banner for this Course */}
          {hasPremiumModules && (
            <View style={{
              backgroundColor: isUnlocked ? '#ecfdf5' : '#fff7ed',
              borderWidth: 1,
              borderColor: isUnlocked ? '#a7f3d0' : '#ffedd5',
              borderRadius: 20, padding: 18, marginBottom: 20,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              shadowColor: isUnlocked ? '#10b981' : '#f97316',
              shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
            }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ color: isUnlocked ? '#059669' : '#c2410c', fontWeight: '800', fontSize: 14 }}>
                  {isUnlocked ? 'Premium Access Active' : 'Upgrade to Premium'}
                </Text>
                <Text style={{ color: isUnlocked ? '#047857' : '#9a3412', fontSize: 11, marginTop: 4, fontWeight: '600', lineHeight: 16 }}>
                  {isUnlocked
                    ? 'All pro modules, clinical reasoning files, and certificates are fully unlocked.'
                    : `Unlock all premium modules of this course for a one-time payment of ₹${activeCourse.price || 499}.`
                  }
                </Text>
              </View>
              {!isUnlocked && (
                <TouchableOpacity
                  onPress={() => {
                    setUpgradeCourse(activeCourse);
                    setShowUpgrade(true);
                  }}
                  style={{
                    backgroundColor: '#f97316',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 14,
                    shadowColor: '#f97316',
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 11 }}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Module list */}
          <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 2 }}>
            Course Modules
          </Text>

          {activeCourse.modules.map((module, index) => {
            const isDone = completedModules[module.id] || false;
            const isLocked = module.isPremium && !isUnlocked;
            const isFirst = index === 0;
            const isLast = index === activeCourse.modules.length - 1;

            return (
              <TouchableOpacity
                key={module.id}
                onPress={() => openModule(module)}
                activeOpacity={0.92}
                style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 1,
                  borderColor: isDone ? '#d1fae5' : isLocked ? '#e0f2fe' : '#e2e8f0',
                  borderRadius: 18,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#0ea5e9',
                  shadowOpacity: isDone ? 0.06 : 0.04,
                  shadowRadius: 6, elevation: isDone ? 2 : 1,
                }}
              >
                {/* Step number / status */}
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  alignItems: 'center', justifyContent: 'center', marginRight: 14,
                  backgroundColor: isDone ? '#10b981' : isLocked ? '#e0f2fe' : '#f0f9ff',
                  borderWidth: 2,
                  borderColor: isDone ? '#10b981' : isLocked ? '#7dd3fc' : '#bae6fd',
                }}>
                  {isDone
                    ? <CheckIcon size={11} color="#ffffff" />
                    : isLocked
                    ? <LockIcon size={13} color="#0369a1" />
                    : <Text style={{ color: '#0369a1', fontWeight: '900', fontSize: 13 }}>{module.number}</Text>
                  }
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Text style={{
                      fontSize: 13, fontWeight: '700',
                      color: isDone ? '#94a3b8' : '#0f172a',
                      textDecorationLine: isDone ? 'line-through' : 'none',
                      flex: 1,
                    }} numberOfLines={2}>
                      {module.title}
                    </Text>
                    {isLocked && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#7dd3fc' }}>
                        <Text style={{ fontSize: 7, color: '#0369a1', fontWeight: '900', textTransform: 'uppercase' }}>PRO</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                      {module.duration}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '600' }}>
                      {module.lessons.length} lessons
                    </Text>
                  </View>
                </View>

                {/* Arrow */}
                {!isLocked && (
                  <View style={{ marginLeft: 8 }}>
                    <View style={{ width: 7, height: 7, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#94a3b8', transform: [{ rotate: '45deg' }] }} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <UpgradeModal
          visible={showUpgrade}
          course={upgradeCourse || activeCourse}
          onClose={() => {
            setShowUpgrade(false);
            setUpgradeCourse(null);
          }}
          onUpgradeSuccess={async () => {
            const courseToUnlock = upgradeCourse || activeCourse;
            if (courseToUnlock) {
              await handleUpgradeSuccess(courseToUnlock.id);
            }
            setShowUpgrade(false);
            setUpgradeCourse(null);
          }}
        />
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 3: Module Detail Page
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && activeModule && activeCourse) {
    const isDone = completedModules[activeModule.id] || false;
    const totalLessons = activeModule.lessons.length;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }} edges={['top']}>
        <Header
          title={`Module ${activeModule.number}`}
          subtitle={activeCourse.title}
          onBack={() => setView('modules')}
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Module title card */}
          <View style={{
            backgroundColor: '#0ea5e9', padding: 20,
            shadowColor: '#0ea5e9', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Module {activeModule.number} of {activeCourse.totalModules}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>{activeModule.duration}</Text>
              </View>
            </View>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', lineHeight: 26, marginBottom: 6 }}>
              {activeModule.title}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' }}>
              {totalLessons} lessons • {activeModule.keyTerms.length} key terms
            </Text>
          </View>

          <View style={{ padding: 16 }}>
            {/* ── Learning Objectives ── */}
            <View style={{
              backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
              borderRadius: 18, padding: 18, marginBottom: 16,
              shadowColor: '#0ea5e9', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}>
                  <BookIcon size={13} color="#0369a1" />
                </View>
                <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14 }}>Learning Objectives</Text>
              </View>
              {activeModule.objectives.map((obj, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <BulletDot color="#0ea5e9" />
                  <Text style={{ flex: 1, color: '#334155', fontSize: 13, lineHeight: 20, fontWeight: '500' }}>{obj}</Text>
                </View>
              ))}
            </View>

            {/* ── Lesson Tabs ── */}
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 2 }}>
              Lessons
            </Text>

            {/* Lesson selector pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {activeModule.lessons.map((lesson, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setActiveLesson(i)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                      backgroundColor: activeLesson === i ? '#0ea5e9' : '#ffffff',
                      borderColor: activeLesson === i ? '#0ea5e9' : '#bae6fd',
                      shadowColor: '#0ea5e9', shadowOpacity: activeLesson === i ? 0.25 : 0.04, shadowRadius: 4, elevation: activeLesson === i ? 2 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: activeLesson === i ? '#ffffff' : '#0369a1' }}>
                      Lesson {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Active lesson content */}
            {activeModule.lessons[activeLesson] && (
              <View style={{
                backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                borderRadius: 18, padding: 20, marginBottom: 16,
                shadowColor: '#0ea5e9', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#e0f2fe', borderRadius: 8, borderWidth: 1, borderColor: '#7dd3fc' }}>
                    <Text style={{ color: '#0369a1', fontSize: 8, fontWeight: '800', textTransform: 'uppercase' }}>Lesson {activeLesson + 1}</Text>
                  </View>
                  <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 14, flex: 1 }}>
                    {activeModule.lessons[activeLesson].title}
                  </Text>
                </View>
                <Text style={{ color: '#334155', fontSize: 13, lineHeight: 22, fontWeight: '400' }}>
                  {activeModule.lessons[activeLesson].body}
                </Text>

                {/* Lesson navigation */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f0f9ff' }}>
                  <TouchableOpacity
                    onPress={() => setActiveLesson(Math.max(0, activeLesson - 1))}
                    disabled={activeLesson === 0}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: activeLesson === 0 ? '#e2e8f0' : '#7dd3fc', backgroundColor: activeLesson === 0 ? '#f8fafc' : '#e0f2fe' }}
                  >
                    <Text style={{ color: activeLesson === 0 ? '#cbd5e1' : '#0369a1', fontWeight: '700', fontSize: 12 }}>← Previous</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveLesson(Math.min(totalLessons - 1, activeLesson + 1))}
                    disabled={activeLesson === totalLessons - 1}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: activeLesson === totalLessons - 1 ? '#e2e8f0' : '#7dd3fc', backgroundColor: activeLesson === totalLessons - 1 ? '#f8fafc' : '#e0f2fe' }}
                  >
                    <Text style={{ color: activeLesson === totalLessons - 1 ? '#cbd5e1' : '#0369a1', fontWeight: '700', fontSize: 12 }}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Module Summary ── */}
            <View style={{
              backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0',
              borderRadius: 18, padding: 18, marginBottom: 16,
              shadowColor: '#10b981', shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
            }}>
              <Text style={{ color: '#059669', fontWeight: '800', fontSize: 13, marginBottom: 10 }}>Module Summary</Text>
              <Text style={{ color: '#047857', fontSize: 13, lineHeight: 22, fontWeight: '400' }}>
                {activeModule.summary}
              </Text>
            </View>

            {/* ── Key Terms ── */}
            <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 2 }}>
              Key Terms & Definitions
            </Text>
            {activeModule.keyTerms.map((kt, i) => (
              <View key={i} style={{
                backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e0f2fe',
                borderRadius: 14, padding: 14, marginBottom: 8,
                shadowColor: '#0ea5e9', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
              }}>
                <Text style={{ color: '#0369a1', fontWeight: '800', fontSize: 13, marginBottom: 4 }}>{kt.term}</Text>
                <Text style={{ color: '#475569', fontSize: 12, lineHeight: 18 }}>{kt.definition}</Text>
              </View>
            ))}

            {/* ── Complete Button ── */}
            <TouchableOpacity
              onPress={() => {
                markComplete(activeModule.id);
                Alert.alert(
                  isDone ? 'Marked Incomplete' : 'Module Completed!',
                  isDone ? 'Progress has been reset for this module.' : 'Great work! Keep going with the next module.',
                  [{ text: isDone ? 'OK' : 'Next Module', onPress: () => setView('modules') }]
                );
              }}
              style={{
                marginTop: 8,
                backgroundColor: isDone ? '#f8fafc' : '#10b981',
                borderWidth: 1,
                borderColor: isDone ? '#e2e8f0' : '#10b981',
                paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                shadowColor: isDone ? 'transparent' : '#10b981',
                shadowOpacity: 0.3, shadowRadius: 8, elevation: isDone ? 0 : 4,
              }}
            >
              <Text style={{ color: isDone ? '#94a3b8' : '#ffffff', fontWeight: '800', fontSize: 14 }}>
                {isDone ? 'Mark as Incomplete' : 'Mark Module as Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({
  visible,
  course,
  onClose,
  onUpgradeSuccess
}: {
  visible: boolean;
  course: Course;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}) {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [upiOption, setUpiOption] = useState<'GPAY' | 'PHONEPE' | 'PAYTM' | 'ID'>('GPAY');
  const [upiId, setUpiId] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [customBank, setCustomBank] = useState('');
  const [paymentState, setPaymentState] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [statusMessage, setStatusMessage] = useState('');

  // Reset modal state on visibility change
  useEffect(() => {
    if (visible) {
      setMethod('UPI');
      setUpiOption('GPAY');
      setUpiId('');
      setCardNo('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
      setSelectedBank('SBI');
      setCustomBank('');
      setPaymentState('IDLE');
      setStatusMessage('');
    }
  }, [visible]);

  const handlePay = async () => {
    // Basic validation
    if (method === 'UPI' && upiOption === 'ID' && !upiId.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid UPI ID');
      return;
    }
    if (method === 'CARD' && (!cardNo || !cardExpiry || !cardCvv || !cardName)) {
      Alert.alert('Validation Error', 'Please fill in all card details');
      return;
    }
    if (method === 'NET_BANKING' && selectedBank === 'Other' && !customBank.trim()) {
      Alert.alert('Validation Error', 'Please enter your bank provider name');
      return;
    }

    setPaymentState('PROCESSING');
    setStatusMessage('Initiating transaction with Razorpay...');

    try {
      const session = getSession();
      const userId = session?.id || 'guest';
      
      // Construct the checkout URL served by our backend
      const checkoutUrl = `${API_BASE_URL}/payments/razorpay-checkout` +
        `?courseId=${course.id}` +
        `&userId=${userId}` +
        `&amount=${price}`;

      setStatusMessage('Opening secure checkout window...');
      
      // Open hosted checkout page in Expo WebBrowser overlay
      await WebBrowser.openBrowserAsync(checkoutUrl);

      // Once the overlay browser closes, verify backend status
      setStatusMessage('Verifying payment signature...');

      try {
        const statusRes = await fetch(`${API_BASE_URL}/hub/courses/${course.id}/status?userId=${userId}`);
        if (!statusRes.ok) {
          throw new Error('Failed to verify status from server');
        }

        const statusData = await statusRes.json();

        if (statusData.isPremiumUnlocked) {
          setPaymentState('SUCCESS');
        } else {
          setPaymentState('IDLE');
          Alert.alert(
            'Payment Check',
            'We could not verify your payment via server. If this is a local sandbox without the backend database online, would you like to unlock this course locally?',
            [
              { text: 'Try Again', style: 'cancel' },
              { text: 'Unlock Locally (Demo)', onPress: () => setPaymentState('SUCCESS') }
            ]
          );
        }
      } catch (networkError) {
        setPaymentState('IDLE');
        Alert.alert(
          'Offline Mode / Backend Offline',
          'Could not connect to the backend server. For testing the interface, do you want to unlock this course locally?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Unlock Locally (Demo)', onPress: () => setPaymentState('SUCCESS') }
          ]
        );
      }
    } catch (err: any) {
      console.error('Razorpay checkout error:', err);
      setPaymentState('IDLE');
      Alert.alert('Checkout Error', err.message || 'An error occurred.');
    }
  };

  const price = course.price || 499;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.6)' }}>
        <View style={{
          backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#bae6fd',
          borderTopLeftRadius: 36, borderTopRightRadius: 36,
          padding: 24, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
          maxHeight: '90%'
        }}>
          {/* Drag handle */}
          <View style={{ width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 18 }} />

          {paymentState === 'IDLE' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <View style={{ width: 50, height: 50, backgroundColor: '#e0f2fe', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <GemIcon size={26} color="#0369a1" />
                </View>
                <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>Upgrade to Premium</Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4, textAlign: 'center', fontWeight: '600', paddingHorizontal: 12 }} numberOfLines={2}>
                  Unlock all pro lessons, quizzes, & digital certificate for:
                </Text>
                <Text style={{ color: '#0369a1', fontSize: 13, fontWeight: '800', marginTop: 3, textAlign: 'center' }}>
                  "{course.title}"
                </Text>
              </View>

              {/* Price Tag */}
              <View style={{ backgroundColor: '#f0f9ff', borderWidth: 1, borderColor: '#bae6fd', padding: 14, borderRadius: 16, alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ color: '#0284c7', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>One-Time Course Payment</Text>
                <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 26, marginTop: 4 }}>₹{price}</Text>
                <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '700', marginTop: 2 }}>All pro modules included • Lifetime access</Text>
              </View>

              {/* Payment Method Selector */}
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 2 }}>
                Select Payment Method
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 18 }}>
                {(['UPI', 'CARD', 'NET_BANKING'] as const).map(m => {
                  const label = m === 'UPI' ? 'UPI' : m === 'CARD' ? 'Card' : 'Net Banking';
                  const active = method === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setMethod(m)}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
                        backgroundColor: active ? '#e0f2fe' : '#ffffff',
                        borderColor: active ? '#0ea5e9' : '#e2e8f0',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#0369a1' : '#64748b' }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Payment Method Content */}
              <View style={{ marginBottom: 20, minHeight: 140 }}>
                {method === 'UPI' && (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {(['GPAY', 'PHONEPE', 'PAYTM', 'ID'] as const).map(opt => {
                        const active = upiOption === opt;
                        const label = opt === 'GPAY' ? 'Google Pay' : opt === 'PHONEPE' ? 'PhonePe' : opt === 'PAYTM' ? 'Paytm' : 'UPI ID';
                        return (
                          <TouchableOpacity
                            key={opt}
                            onPress={() => setUpiOption(opt)}
                            style={{
                              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
                              backgroundColor: active ? '#f0f9ff' : '#f8fafc',
                              borderColor: active ? '#0ea5e9' : '#e2e8f0',
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '700', color: active ? '#0369a1' : '#64748b' }}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {upiOption === 'ID' ? (
                      <TextInput
                        placeholder="Enter your UPI ID (e.g. name@upi)"
                        value={upiId}
                        onChangeText={setUpiId}
                        placeholderTextColor="#94a3b8"
                        style={{
                          borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12,
                          paddingHorizontal: 14, paddingVertical: 10, fontSize: 12,
                          color: '#0f172a', backgroundColor: '#f8fafc'
                        }}
                      />
                    ) : (
                      <View style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                          You will be redirected to the selected app to complete your payment of ₹{price}.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {method === 'CARD' && (
                  <View style={{ gap: 8 }}>
                    <TextInput
                      placeholder="Card Number (mock: 16 digits)"
                      value={cardNo}
                      onChangeText={val => setCardNo(val.replace(/[^0-9]/g, '').substring(0, 16))}
                      keyboardType="numeric"
                      placeholderTextColor="#94a3b8"
                      style={{
                        borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 10, fontSize: 12,
                        color: '#0f172a', backgroundColor: '#f8fafc'
                      }}
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        placeholder="Expiry (MM/YY)"
                        value={cardExpiry}
                        onChangeText={setCardExpiry}
                        placeholderTextColor="#94a3b8"
                        style={{
                          flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12,
                          paddingHorizontal: 14, paddingVertical: 10, fontSize: 12,
                          color: '#0f172a', backgroundColor: '#f8fafc'
                        }}
                      />
                      <TextInput
                        placeholder="CVV (3 digits)"
                        value={cardCvv}
                        onChangeText={val => setCardCvv(val.replace(/[^0-9]/g, '').substring(0, 3))}
                        keyboardType="numeric"
                        secureTextEntry
                        placeholderTextColor="#94a3b8"
                        style={{
                          flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12,
                          paddingHorizontal: 14, paddingVertical: 10, fontSize: 12,
                          color: '#0f172a', backgroundColor: '#f8fafc'
                        }}
                      />
                    </View>
                    <TextInput
                      placeholder="Cardholder Name"
                      value={cardName}
                      onChangeText={setCardName}
                      placeholderTextColor="#94a3b8"
                      style={{
                        borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 10, fontSize: 12,
                        color: '#0f172a', backgroundColor: '#f8fafc'
                      }}
                    />
                  </View>
                )}

                {method === 'NET_BANKING' && (
                  <View style={{ gap: 8 }}>
                    <Text style={{ fontSize: 10, color: '#64748b', fontWeight: '700', marginBottom: 4 }}>Select Bank Provider</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'BOB', 'Canara Bank', 'IndusInd', 'Yes Bank', 'Other'].map(bank => {
                        const active = selectedBank === bank;
                        return (
                          <TouchableOpacity
                            key={bank}
                            onPress={() => setSelectedBank(bank)}
                            style={{
                              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
                              backgroundColor: active ? '#f0f9ff' : '#f8fafc',
                              borderColor: active ? '#0ea5e9' : '#e2e8f0',
                              minWidth: 65, alignItems: 'center'
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: '800', color: active ? '#0369a1' : '#64748b' }}>{bank}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {selectedBank === 'Other' && (
                      <TextInput
                        placeholder="Enter Bank Name Manually"
                        value={customBank}
                        onChangeText={setCustomBank}
                        placeholderTextColor="#94a3b8"
                        style={{
                          borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 12,
                          paddingHorizontal: 14, paddingVertical: 10, fontSize: 12,
                          color: '#0f172a', backgroundColor: '#f8fafc', marginTop: 8
                        }}
                      />
                    )}
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handlePay}
                style={{ backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 10, shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14 }}>Pay & Unlock Course</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                style={{ borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', paddingVertical: 12, borderRadius: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 12 }}>Keep Free Version</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {paymentState === 'PROCESSING' && (
            <View style={{ paddingVertical: 50, alignItems: 'center', gap: 20 }}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Processing Payment</Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 6, fontWeight: '600' }}>{statusMessage}</Text>
              </View>
            </View>
          )}

          {paymentState === 'SUCCESS' && (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 20 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIcon size={24} color="#059669" />
                </View>
              </View>

              <View style={{ alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '900', textAlign: 'center' }}>Upgrade Successful!</Text>
                <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }}>
                  Thank you for your purchase. All pro modules and lessons for "{course.title}" have been unlocked.
                </Text>
              </View>

              <TouchableOpacity
                onPress={onUpgradeSuccess}
                style={{ backgroundColor: '#10b981', width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 14 }}>Start Learning</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}