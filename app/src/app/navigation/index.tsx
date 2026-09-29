import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  useNavigation,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import {createBottomTabNavigator, type BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {Icon, Row, Text, tokens, useTheme, type IconName} from '../../design-system';
import {useSelectedTrackId, useServices, useSettings} from '../providers/Services';
import {HomeScreen} from '../../features/home';
import {LibraryScreen} from '../../features/library';
import {DiscoveryScreen} from '../../features/discovery';
import {DownloadsScreen} from '../../features/downloads';
import {SettingsScreen} from '../../features/settings';
import {TrackDetailsScreen} from '../../features/player';
import {OnboardingScreen} from '../../features/onboarding';
import type {RootStackParamList, TabParamList} from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();
const icons: Record<keyof TabParamList, IconName> = {
  Home: 'home',
  Library: 'library',
  Discover: 'discover',
  Downloads: 'downloads',
};
function TabBar({state, navigation}: BottomTabBarProps) {
  const {colors, rtl} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const services = useServices();
  const trackId = useSelectedTrackId();
  const [title, setTitle] = useState('');
  const root = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useEffect(() => {
    let alive = true;
    if (trackId) {
      services.tracks
        .get(trackId)
        .then(track => {
          if (alive) {
            setTitle(track?.title ?? '');
          }
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [services, trackId]);
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, tokens.spacing.sm),
        },
      ]}
    >
      {!!trackId && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('trackDetails')}
          style={styles.preview}
          onPress={() => root.navigate('Details', {trackId})}
        >
          <Row>
            <Icon name="music" />
            <View style={styles.fill}>
              <Text numberOfLines={1}>{title}</Text>
              <Text kind="caption" muted>
                {t('previewLibrary')}
              </Text>
            </View>
          </Row>
        </Pressable>
      )}
      <View style={[styles.tabs, {flexDirection: rtl ? 'row-reverse' : 'row'}]}>
        {state.routes.map((route, index) => {
          const name = route.name as keyof TabParamList;
          const selected = index === state.index;
          return (
            <Pressable
              key={`${route.key}-${rtl}`}
              accessibilityRole="tab"
              accessibilityLabel={t(name.toLowerCase())}
              accessibilityState={{selected}}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={styles.tab}
            >
              <Icon name={icons[name]} color={selected ? colors.accent : colors.muted} />
              <Text kind="caption" style={{color: selected ? colors.text : colors.muted}}>
                {t(name.toLowerCase())}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
function renderTabBar(props: BottomTabBarProps) {
  return <TabBar {...props} />;
}
function MainTabs() {
  return (
    <Tabs.Navigator tabBar={renderTabBar} screenOptions={{headerShown: false}}>
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Library" component={LibraryScreen} />
      <Tabs.Screen name="Discover" component={DiscoveryScreen} />
      <Tabs.Screen name="Downloads" component={DownloadsScreen} />
    </Tabs.Navigator>
  );
}
export function AppNavigation() {
  const settings = useSettings();
  const {colors, dark, reduceMotion} = useTheme();
  const {t} = useTranslation();
  if (!settings.onboarded) {
    return <OnboardingScreen />;
  }
  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      theme={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          primary: colors.accent,
          border: colors.border,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: colors.background},
          headerTintColor: colors.text,
          headerBackButtonDisplayMode: 'minimal',
          animation: reduceMotion ? 'none' : 'default',
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} options={{headerShown: false}} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{title: t('settings')}} />
        <Stack.Screen
          name="Details"
          component={TrackDetailsScreen}
          options={{title: t('trackDetails')}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  bar: {borderTopWidth: tokens.surface.border, paddingHorizontal: tokens.spacing.sm},
  tabs: {alignItems: 'center'},
  tab: {
    flex: 1,
    minHeight: tokens.size.touch,
    paddingVertical: tokens.spacing.md,
    gap: tokens.spacing.xs,
    alignItems: 'center',
  },
  preview: {padding: tokens.spacing.md, minHeight: tokens.size.touch},
  fill: {flex: 1},
});
