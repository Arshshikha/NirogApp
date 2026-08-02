import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setSession, verifyCredentials, registerAccount, resetPassword } from '../utils/authStore';
import { addDoctor } from '../utils/doctorStore';

type Role = 'Patient' | 'Doctor' | 'Student' | 'Provider';

// ─── Custom Icons (No Emojis) ────────────────────────────────────────────────

const UserIcon = ({ color = '#64748b' }: { color?: string }) => (
  <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: color }} />
    <View style={{ width: 14, height: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.8, borderColor: color, borderBottomWidth: 0, marginTop: 1 }} />
  </View>
);

const ShieldIcon = ({ color = '#64748b' }: { color?: string }) => (
  <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 12, height: 14, borderWidth: 1.8, borderColor: color, borderRadius: 3, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
    <View style={{ width: 6, height: 4, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderLeftWidth: 1.8, borderRightWidth: 1.8, borderBottomWidth: 1.8, borderColor: color, position: 'absolute', top: 5 }} />
  </View>
);

const CapIcon = ({ color = '#64748b' }: { color?: string }) => (
  <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 14, height: 6, borderWidth: 1.8, borderColor: color, transform: [{ rotate: '-10deg' }, { scaleX: 1.2 }] }} />
    <View style={{ width: 8, height: 5, borderLeftWidth: 1.8, borderRightWidth: 1.8, borderBottomWidth: 1.8, borderColor: color, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: 1 }} />
  </View>
);

const BuildingIcon = ({ color = '#64748b' }: { color?: string }) => (
  <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 12, height: 14, borderWidth: 1.8, borderColor: color, borderRadius: 2 }} />
    <View style={{ width: 4, height: 4, borderWidth: 1.5, borderColor: color, position: 'absolute', bottom: 0 }} />
    <View style={{ width: 6, height: 1.5, backgroundColor: color, position: 'absolute', top: 4 }} />
  </View>
);

const WarningIcon = ({ color = '#ef4444' }: { color?: string }) => (
  <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 1.5, height: 5, backgroundColor: color, borderRadius: 0.5, marginBottom: 1 }} />
    <View style={{ width: 1.5, height: 1.5, backgroundColor: color, borderRadius: 0.75 }} />
  </View>
);

const UploadIcon = ({ color = '#0284c7' }: { color?: string }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 18, height: 14, borderWidth: 2, borderColor: color, borderRadius: 3, position: 'absolute', bottom: 2 }} />
    <View style={{ width: 2, height: 8, backgroundColor: color, position: 'absolute', bottom: 8 }} />
    <View style={{ width: 6, height: 6, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color, transform: [{ rotate: '45deg' }], position: 'absolute', bottom: 10 }} />
  </View>
);

const SuccessCheckIcon = () => (
  <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 4, height: 7, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: '#ffffff', transform: [{ rotate: '45deg' }], marginBottom: 1.5 }} />
  </View>
);

const testAccounts: Record<Role, { email: string; pass: string }> = {
  Patient:  { email: 'patient@nirog.com', pass: 'patient123' },
  Doctor:   { email: 'doctor@nirog.com', pass: 'doctor123' },
  Student:  { email: 'student@nirog.com', pass: 'student123' },
  Provider: { email: 'provider@nirog.com', pass: 'provider123' },
};

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [role, setRole] = useState<Role>('Patient');
  
  // Basic Form States
  const [email, setEmail] = useState(testAccounts.Patient.email);
  const [password, setPassword] = useState(testAccounts.Patient.pass);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Role-Specific Dynamic States
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [experience, setExperience] = useState('');
  const [category, setCategory] = useState<'Allopathy' | 'Ayurveda'>('Allopathy');
  const [feeInput, setFeeInput] = useState('500');
  const [consultationMode, setConsultationMode] = useState<'Online' | 'Offline' | 'Both'>('Both');
  const [selOnlineSlots, setSelOnlineSlots] = useState<string[]>(['09:00 AM', '11:00 AM', '03:00 PM']);
  const [selOfflineSlots, setSelOfflineSlots] = useState<string[]>(['10:00 AM', '12:00 PM', '04:00 PM']);

  // Upload state
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Active input tracking (for focus styles)
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Error/Success Alert States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return val.includes('@') && val.includes('.');
  };

  const handleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Password reset validation
    if (mode === 'forgot') {
      if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
        setErrorMsg('Please fill in all password reset fields.');
        return;
      }
      if (!validateEmail(email)) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      
      const success = await resetPassword(email.trim(), role, password);
      if (success) {
        setSuccessMsg('Password reset successful! You can now sign in.');
        setConfirmPassword('');
        setPassword('');
        setMode('login');
      } else {
        setErrorMsg(`No registered ${role} found with this email address.`);
      }
      return;
    }

    // Form Field Validations (login/signup)
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please fill in email and password.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'login') {
      // Sign-In credentials check
      let user;
      try {
        user = await verifyCredentials(email.trim(), password, role);
        if (!user) {
          setErrorMsg(`Incorrect email id or password combination for ${role}.`);
          return;
        }
      } catch (err: any) {
        console.error('Login error:', err);
        setErrorMsg(err.message || 'Connection error. Please check if the server is running.');
        return;
      }

      const convertTo24h = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
          hours = '00';
        }
        if (modifier === 'PM') {
          hours = String(parseInt(hours, 10) + 12);
        }
        return `${hours.padStart(2, '0')}:${minutes}`;
      };

      setSession(
        user.name,
        user.email,
        user.role,
        user.documentName,
        user.age,
        user.bloodGroup,
        user.address,
        user.phone,
        user.collegeName,
        user.experience,
        user.id,
        user.profileId,
        user.category,
        user.fee,
        user.consultationMode,
        user.onlineSlots,
        user.offlineSlots,
        user.token
      );

      const path = role === 'Patient' ? '/patient' : role === 'Doctor' ? '/doctor' : role === 'Student' ? '/student' : '/provider';
      router.replace(path);
    } else {
      // Sign Up validation checks
      if (!name.trim()) { setErrorMsg('Please enter your full name.'); return; }
      if (!age.trim()) { setErrorMsg('Please enter your age.'); return; }
      if (!phone.trim()) { setErrorMsg('Please enter your phone number.'); return; }
      if (!address.trim()) { setErrorMsg('Please enter your address.'); return; }

      if (role === 'Patient') {
        if (!bloodGroup.trim()) { setErrorMsg('Please enter your blood group.'); return; }
      } else if (role === 'Student') {
        if (!collegeName.trim()) { setErrorMsg('Please enter your college name.'); return; }
        if (!uploadedDoc) { setErrorMsg('Please upload your Student ID Card.'); return; }
      } else if (role === 'Doctor') {
        if (!experience.trim()) { setErrorMsg('Please enter your experience.'); return; }
        if (!feeInput.trim()) { setErrorMsg('Please specify your consultation fee.'); return; }
        const feeVal = parseFloat(feeInput);
        if (isNaN(feeVal) || feeVal <= 0) { setErrorMsg('Please enter a valid consultation fee.'); return; }
        if (consultationMode === 'Online' || consultationMode === 'Both') {
          if (selOnlineSlots.length === 0) { setErrorMsg('Please select at least one online timing slot.'); return; }
        }
        if (consultationMode === 'Offline' || consultationMode === 'Both') {
          if (selOfflineSlots.length === 0) { setErrorMsg('Please select at least one offline timing slot.'); return; }
        }
        if (!uploadedDoc) { setErrorMsg('Please upload your Medical License.'); return; }
      } else if (role === 'Provider') {
        if (!experience.trim()) { setErrorMsg('Please enter your company experience.'); return; }
        if (!uploadedDoc) { setErrorMsg('Please upload your Provider Registration License.'); return; }
      }

      const convertTo24h = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
          hours = '00';
        }
        if (modifier === 'PM') {
          hours = String(parseInt(hours, 10) + 12);
        }
        return `${hours.padStart(2, '0')}:${minutes}`;
      };

      // Save user-registered details to credentials store
      const newAccount = {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        documentName: uploadedDoc || undefined,
        age: age.trim(),
        bloodGroup: role === 'Patient' ? bloodGroup.trim() : undefined,
        address: address.trim(),
        phone: phone.trim(),
        collegeName: role === 'Student' ? collegeName.trim() : undefined,
        experience: role === 'Doctor' || role === 'Provider' ? experience.trim() : undefined,
        category: role === 'Doctor' ? category : undefined,
        fee: role === 'Doctor' ? parseFloat(feeInput) : undefined,
        consultationMode: role === 'Doctor' ? consultationMode : undefined,
        onlineSlots: role === 'Doctor' ? selOnlineSlots.map(convertTo24h) : undefined,
        offlineSlots: role === 'Doctor' ? selOfflineSlots.map(convertTo24h) : undefined
      };
      
      const regResult = await registerAccount(newAccount);

      // If Doctor role, add to doctorStore registry
      if (role === 'Doctor' && regResult?.userId) {
        addDoctor(
          name.trim(),
          'General Physician',
          category,
          parseInt(experience.trim()) || 5,
          address.trim(),
          parseFloat(feeInput) || 500,
          consultationMode === 'Online' ? selOnlineSlots : selOfflineSlots,
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
          phone.trim(),
          email.trim(),
          uploadedDoc || undefined,
          consultationMode,
          selOnlineSlots,
          selOfflineSlots,
          regResult.profileId || undefined,
          regResult.userId
        );
      }

      // Set session and redirect
      setSession(
        newAccount.name,
        newAccount.email,
        newAccount.role,
        newAccount.documentName,
        newAccount.age,
        newAccount.bloodGroup,
        newAccount.address,
        newAccount.phone,
        newAccount.collegeName,
        newAccount.experience,
        regResult?.userId || undefined,
        regResult?.profileId || undefined,
        newAccount.category,
        newAccount.fee,
        newAccount.consultationMode,
        newAccount.consultationMode ? selOnlineSlots : undefined,
        newAccount.consultationMode ? selOfflineSlots : undefined,
        regResult?.token || undefined
      );

      const path = role === 'Patient' ? '/patient' : role === 'Doctor' ? '/doctor' : role === 'Student' ? '/student' : '/provider';
      router.replace(path);
    }
  };

  const handleSimulateUpload = () => {
    setErrorMsg(null);
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const docExt = role === 'Student' ? 'jpg' : 'pdf';
      const docName = role === 'Doctor' ? 'medical_license' : role === 'Student' ? 'student_id' : 'business_license';
      setUploadedDoc(`${docName}_${randomNum}.${docExt}`);
    }, 1200);
  };

  const handleToggleTab = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadedDoc(null);
    if (newMode === 'login') {
      setEmail(testAccounts[role].email);
      setPassword(testAccounts[role].pass);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setErrorMsg(null);
    setSuccessMsg(null);
    setUploadedDoc(null);
    if (mode === 'login') {
      setEmail(testAccounts[newRole].email);
      setPassword(testAccounts[newRole].pass);
    } else {
      setEmail('');
      setPassword('');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f9ff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 48, justifyContent: 'center' }}>
          
          {/* Logo Header */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 54, height: 54, borderRadius: 16, backgroundColor: '#0ea5e9',
              alignItems: 'center', justifyContent: 'center', marginBottom: 10,
              shadowColor: '#0ea5e9', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}>
              <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '900' }}>N</Text>
            </View>
            <Text style={{ color: '#0f172a', textTransform: 'uppercase', fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>
              Nirog <Text style={{ color: '#10b981', fontWeight: '700' }}>Health</Text>
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 }}>
              Unified Medical Verification Portal
            </Text>
          </View>

          {/* Form Card */}
          <View style={{
            backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bae6fd',
            borderRadius: 24, padding: 20,
            shadowColor: '#0ea5e9', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
            marginBottom: 20,
          }}>
            {/* Login / Register Toggle Tabs */}
            {mode !== 'forgot' ? (
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 4, marginBottom: 18 }}>
                <TouchableOpacity
                  onPress={() => handleToggleTab('login')}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: mode === 'login' ? '#0ea5e9' : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: mode === 'login' ? '#0369a1' : '#94a3b8' }}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleToggleTab('register')}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: mode === 'register' ? '#0ea5e9' : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: mode === 'register' ? '#0369a1' : '#94a3b8' }}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10, marginBottom: 18 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0369a1', textAlign: 'center' }}>Reset Account Password</Text>
              </View>
            )}

            {/* Error Alert Display Box */}
            {errorMsg && (
              <View style={{
                backgroundColor: '#fff1f2', borderLeftWidth: 3, borderLeftColor: '#ef4444',
                borderRadius: 10, padding: 12, marginBottom: 16,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <WarningIcon color="#ef4444" />
                <Text style={{ color: '#e11d48', fontSize: 11, fontWeight: '700', flex: 1 }}>{errorMsg}</Text>
              </View>
            )}

            {/* Success Alert Display Box */}
            {successMsg && (
              <View style={{
                backgroundColor: '#ecfdf5', borderLeftWidth: 3, borderLeftColor: '#10b981',
                borderRadius: 10, padding: 12, marginBottom: 16,
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <SuccessCheckIcon />
                <Text style={{ color: '#065f46', fontSize: 11, fontWeight: '700', flex: 1 }}>{successMsg}</Text>
              </View>
            )}

            {/* Access Role Picker Header */}
            <Text style={{ color: '#64748b', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Account Access Portal
            </Text>

            {/* Grid Role Picker */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {(['Patient', 'Doctor', 'Student', 'Provider'] as Role[]).map((r) => {
                const isSelected = role === r;
                const activeColor = isSelected ? '#0ea5e9' : '#64748b';
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => handleRoleChange(r)}
                    style={{
                      flex: 1, minWidth: '45%',
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12,
                      borderWidth: 1.5,
                      backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                      borderColor: isSelected ? '#7dd3fc' : '#e2e8f0',
                    }}
                  >
                    {r === 'Patient' && <UserIcon color={activeColor} />}
                    {r === 'Doctor' && <ShieldIcon color={activeColor} />}
                    {r === 'Student' && <CapIcon color={activeColor} />}
                    {r === 'Provider' && <BuildingIcon color={activeColor} />}
                    
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#0369a1' : '#475569' }}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Input Form Fields */}
            <View style={{ gap: 12 }}>
              
              {/* Full Name (Sign Up only) */}
              {mode === 'register' && (
                <View>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
                  />
                </View>
              )}

              {/* Email Address */}
              <View>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder={mode === 'login' ? testAccounts[role].email : 'user@domain.com'}
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={styles.label}>{mode === 'forgot' ? 'New Password' : 'Password'}</Text>
                <TextInput
                  placeholder={mode === 'login' ? testAccounts[role].pass : '••••••••'}
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                />
              </View>

              {/* Confirm Password (Forgot only) */}
              {mode === 'forgot' && (
                <View>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocusedInput('confirmPassword')}
                    onBlur={() => setFocusedInput(null)}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, focusedInput === 'confirmPassword' && styles.inputFocused]}
                  />
                </View>
              )}

              {/* Forgot Password link (Login only) */}
              {mode === 'login' && (
                <View style={{ alignItems: 'flex-end', marginTop: -4 }}>
                  <TouchableOpacity onPress={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}>
                    <Text style={{ color: '#0ea5e9', fontSize: 11, fontWeight: '700' }}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* DYNAMIC REGISTRATION FIELDS (Sign Up only) */}
              {mode === 'register' && (
                <>
                  {/* Experience (Doctor and Provider only) */}
                  {(role === 'Doctor' || role === 'Provider') && (
                    <View>
                      <Text style={styles.label}>Years of Experience</Text>
                      <TextInput
                        placeholder={role === 'Doctor' ? 'e.g. 12 Yrs' : 'e.g. 10 Yrs'}
                        placeholderTextColor="#94a3b8"
                        value={experience}
                        onChangeText={setExperience}
                        onFocus={() => setFocusedInput('experience')}
                        onBlur={() => setFocusedInput(null)}
                        style={[styles.input, focusedInput === 'experience' && styles.inputFocused]}
                      />
                    </View>
                  )}

                  {/* Category Selection (Doctor only) */}
                  {role === 'Doctor' && (
                    <View>
                      <Text style={styles.label}>Medical Category / Background</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        {(['Allopathy', 'Ayurveda'] as const).map((cat) => {
                          const isCatSelected = category === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              onPress={() => setCategory(cat)}
                              style={{
                                flex: 1,
                                paddingVertical: 11,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                alignItems: 'center',
                                backgroundColor: isCatSelected ? '#e0f2fe' : '#f8fafc',
                                borderColor: isCatSelected ? '#0ea5e9' : '#e2e8f0',
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: isCatSelected ? '#0369a1' : '#475569' }}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Consultation Fee (Doctor only) */}
                  {role === 'Doctor' && (
                    <View>
                      <Text style={styles.label}>Consultation Fee (₹)</Text>
                      <TextInput
                        placeholder="e.g. 500"
                        placeholderTextColor="#94a3b8"
                        value={feeInput}
                        onChangeText={feeStr => setFeeInput(feeStr.replace(/[^0-9]/g, ''))}
                        onFocus={() => setFocusedInput('feeInput')}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="numeric"
                        style={[styles.input, focusedInput === 'feeInput' && styles.inputFocused]}
                      />
                    </View>
                  )}

                  {/* Consultation Mode (Doctor only) */}
                  {role === 'Doctor' && (
                    <View>
                      <Text style={styles.label}>Consultation Mode</Text>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                        {(['Online', 'Offline', 'Both'] as const).map((modeVal) => {
                          const isModeSelected = consultationMode === modeVal;
                          return (
                            <TouchableOpacity
                              key={modeVal}
                              onPress={() => setConsultationMode(modeVal)}
                              style={{
                                flex: 1,
                                paddingVertical: 11,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                alignItems: 'center',
                                backgroundColor: isModeSelected ? '#e0f2fe' : '#f8fafc',
                                borderColor: isModeSelected ? '#0ea5e9' : '#e2e8f0',
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: isModeSelected ? '#0369a1' : '#475569' }}>
                                {modeVal === 'Offline' ? 'In-Person' : modeVal}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Online Timing Slots (Doctor only - Online or Both) */}
                  {role === 'Doctor' && (consultationMode === 'Online' || consultationMode === 'Both') && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={styles.label}>Online Timing Slots</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map((slot) => {
                          const isSelected = selOnlineSlots.includes(slot);
                          return (
                            <TouchableOpacity
                              key={slot}
                              onPress={() => {
                                if (isSelected) {
                                  setSelOnlineSlots(selOnlineSlots.filter(s => s !== slot));
                                } else {
                                  setSelOnlineSlots([...selOnlineSlots, slot]);
                                }
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                borderWidth: 1,
                                backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
                                borderColor: isSelected ? '#10b981' : '#e2e8f0',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#065f46' : '#64748b' }}>
                                {slot}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* In-Person Timing Slots (Doctor only - Offline/In-Person or Both) */}
                  {role === 'Doctor' && (consultationMode === 'Offline' || consultationMode === 'Both') && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={styles.label}>In-Person Timing Slots</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'].map((slot) => {
                          const isSelected = selOfflineSlots.includes(slot);
                          return (
                            <TouchableOpacity
                              key={slot}
                              onPress={() => {
                                if (isSelected) {
                                  setSelOfflineSlots(selOfflineSlots.filter(s => s !== slot));
                                } else {
                                  setSelOfflineSlots([...selOfflineSlots, slot]);
                                }
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 10,
                                borderWidth: 1,
                                backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                                borderColor: isSelected ? '#0ea5e9' : '#e2e8f0',
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#0369a1' : '#64748b' }}>
                                {slot}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Age (All Roles) */}
                  <View>
                    <Text style={styles.label}>{role === 'Provider' ? 'Company Establishment Age' : 'Age'}</Text>
                    <TextInput
                      placeholder="e.g. 28 Years"
                      placeholderTextColor="#94a3b8"
                      value={age}
                      onChangeText={setAge}
                      onFocus={() => setFocusedInput('age')}
                      onBlur={() => setFocusedInput(null)}
                      style={[styles.input, focusedInput === 'age' && styles.inputFocused]}
                    />
                  </View>

                  {/* Blood Group (Patient only) */}
                  {role === 'Patient' && (
                    <View>
                      <Text style={styles.label}>Blood Group</Text>
                      <TextInput
                        placeholder="e.g. O-positive"
                        placeholderTextColor="#94a3b8"
                        value={bloodGroup}
                        onChangeText={setBloodGroup}
                        onFocus={() => setFocusedInput('bloodGroup')}
                        onBlur={() => setFocusedInput(null)}
                        style={[styles.input, focusedInput === 'bloodGroup' && styles.inputFocused]}
                      />
                    </View>
                  )}

                  {/* College Name (Student only) */}
                  {role === 'Student' && (
                    <View>
                      <Text style={styles.label}>College Name</Text>
                      <TextInput
                        placeholder="e.g. Nirog Medical Institute"
                        placeholderTextColor="#94a3b8"
                        value={collegeName}
                        onChangeText={setCollegeName}
                        onFocus={() => setFocusedInput('collegeName')}
                        onBlur={() => setFocusedInput(null)}
                        style={[styles.input, focusedInput === 'collegeName' && styles.inputFocused]}
                      />
                    </View>
                  )}

                  {/* Phone Number (All Roles) */}
                  <View>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                      placeholder="e.g. +91 98765 43210"
                      placeholderTextColor="#94a3b8"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedInput('phone')}
                      onBlur={() => setFocusedInput(null)}
                      keyboardType="phone-pad"
                      style={[styles.input, focusedInput === 'phone' && styles.inputFocused]}
                    />
                  </View>

                  {/* Address (All Roles) */}
                  <View>
                    <Text style={styles.label}>Address</Text>
                    <TextInput
                      placeholder="e.g. Sector 62, Noida, UP"
                      placeholderTextColor="#94a3b8"
                      value={address}
                      onChangeText={setAddress}
                      onFocus={() => setFocusedInput('address')}
                      onBlur={() => setFocusedInput(null)}
                      style={[styles.input, focusedInput === 'address' && styles.inputFocused]}
                    />
                  </View>
                </>
              )}

              {/* Document Upload Area (Sign Up only, and only Doctor / Student / Provider) */}
              {mode === 'register' && role !== 'Patient' && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.label}>
                    Verification Documents Required
                  </Text>
                  
                  <TouchableOpacity
                    onPress={handleSimulateUpload}
                    disabled={isUploading}
                    activeOpacity={0.8}
                    style={{
                      borderWidth: 1.5, borderStyle: 'dashed', borderColor: uploadedDoc ? '#10b981' : '#cbd5e1',
                      backgroundColor: '#f8fafc', borderRadius: 14, padding: 18,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isUploading ? (
                      <View style={{ alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator color="#0ea5e9" size="small" />
                        <Text style={{ color: '#0ea5e9', fontSize: 11, fontWeight: '700' }}>Attaching Document...</Text>
                      </View>
                    ) : uploadedDoc ? (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <SuccessCheckIcon />
                        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '800' }}>File Attached Successfully</Text>
                        <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600' }}>{uploadedDoc}</Text>
                      </View>
                    ) : (
                      <View style={{ alignItems: 'center', gap: 6 }}>
                        <UploadIcon color="#0ea5e9" />
                        <Text style={{ color: '#0369a1', fontSize: 12, fontWeight: '800', marginTop: 4 }}>
                          Click to Upload {role === 'Doctor' ? 'Medical License' : role === 'Student' ? 'Student ID Card' : 'Provider License'}
                        </Text>
                        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '600', textAlign: 'center' }}>
                          PDF, PNG, or JPG up to 10MB
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Back to Sign In Link (Forgot only) */}
              {mode === 'forgot' && (
                <View style={{ alignItems: 'center', marginTop: 4 }}>
                  <TouchableOpacity onPress={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}>
                    <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700' }}>← Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </View>

          {/* Submit Action Button */}
          <TouchableOpacity
            onPress={handleAuth}
            style={{
              backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#10b981', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
              {mode === 'login' ? 'Verify & Sign In' : mode === 'register' ? 'Submit & Register Profile' : 'Reset Password'}
            </Text>
          </TouchableOpacity>

          {/* Secure Trust Badge */}
          <Text style={{ color: '#94a3b8', fontSize: 9, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.8, textAlign: 'center', marginTop: 22 }}>
            🛡️ SSL Encrypted Secure verification server
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  inputFocused: {
    borderColor: '#38bdf8',
  },
});
