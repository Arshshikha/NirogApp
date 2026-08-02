import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const TriggerLabel = (NativeTabs.Trigger as any).Label;
const TriggerIcon = (NativeTabs.Trigger as any).Icon;

export default function AppTabs() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <TriggerLabel>Home</TriggerLabel>
        <TriggerIcon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <TriggerLabel>Explore</TriggerLabel>
        <TriggerIcon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
