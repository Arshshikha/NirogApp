import { Stack } from 'expo-router';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import '../global.css';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="patient" />
        <Stack.Screen name="doctor" />
        <Stack.Screen name="student" />
        <Stack.Screen name="provider" />
      </Stack>
    </ThemeProvider>
  );
}
