import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardScreen } from '../src/screens/DashboardScreen';
import { SearchScreen } from '../src/screens/SearchScreen';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { useApp } from '../src/context/AppContext';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'profile', label: 'Profile', icon: '👤' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Index() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { colors, loaded, signedOutToast } = useApp();
  const insets = useSafeAreaInsets();
  const { bg, surface, border, accent, textMuted } = colors;

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={accent} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={colors.bg === '#0f0f13' || colors.bg.startsWith('#0') || colors.bg.startsWith('#1') ? 'light-content' : 'dark-content'} />

      {/* Signed out toast */}
      {signedOutToast && (
        <View style={{
          position: 'absolute', top: insets.top + 16, left: 0, right: 0,
          zIndex: 500, alignItems: 'center',
        }}>
          <View style={{ backgroundColor: colors.green, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Signed out successfully ✓</Text>
          </View>
        </View>
      )}

      {/* Screen content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardScreen onNavigateToSearch={() => setActiveTab('search')} />
        )}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      {/* Tab bar */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: surface,
        borderTopWidth: 1,
        borderTopColor: border,
        paddingBottom: insets.bottom,
      }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={{ flex: 1, paddingVertical: 10, paddingBottom: 12, alignItems: 'center', gap: 2 }}
          >
            <Text style={{ fontSize: 22 }}>{t.icon}</Text>
            <Text style={{
              fontSize: 11,
              fontWeight: activeTab === t.id ? '600' : '400',
              color: activeTab === t.id ? accent : textMuted,
            }}>
              {t.label}
            </Text>
            {activeTab === t.id && (
              <View style={{ width: 20, height: 2.5, backgroundColor: accent, borderRadius: 99 }} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
