import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { C } from './theme';
import { ensureSeeded, store } from './lib/store';
import MiniPlayer from './components/MiniPlayer';
import FeedScreen from './screens/FeedScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import PodcastsScreen from './screens/PodcastsScreen';
import ProfileScreen from './screens/ProfileScreen';
import PostDetailScreen from './screens/PostDetailScreen';
import ComposerScreen from './screens/ComposerScreen';
import AnimeDetailScreen from './screens/AnimeDetailScreen';
import ShowDetailScreen from './screens/ShowDetailScreen';
import OnboardingScreen from './screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icon =
  (emoji: string) =>
  ({ color }: { color: string }) =>
    <Text style={{ fontSize: 22, color }}>{emoji}</Text>;

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
      tabBar={(props: any) => (
        <View>
          <MiniPlayer />
          <BottomTabBar {...props} />
        </View>
      )}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarIcon: icon('💬') }} />
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ tabBarIcon: icon('🔍') }} />
      <Tab.Screen name="Podcasts" component={PodcastsScreen} options={{ tabBarIcon: icon('🎙️') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: icon('👤') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      await ensureSeeded();
      setOnboarded((await store.onboarded()) === 'yes');
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.primary, fontSize: 30, fontWeight: '900' }}>AniVerse</Text>
      </View>
    );
  }

  if (!onboarded) {
    return <OnboardingScreen onDone={() => setOnboarded(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}
      >
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen
          name="Composer"
          component={ComposerScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="AnimeDetail" component={AnimeDetailScreen} />
        <Stack.Screen name="ShowDetail" component={ShowDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
