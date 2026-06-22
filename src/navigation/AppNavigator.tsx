import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MainTabParamList, RootStackParamList } from '../types';
import { colors } from '../constants/theme';
import { linking } from './linking';
import { MatchCountdownBanner } from '../components/MatchCountdownBanner';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LevelMapScreen } from '../screens/LevelMapScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { ShopScreen } from '../screens/ShopScreen';
import { GameScreen } from '../screens/GameScreen';
import { VersusScreen } from '../screens/VersusScreen';
import { TournamentScreen } from '../screens/TournamentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <MatchCountdownBanner />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: { minHeight: 56 },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Map" component={LevelMapScreen} options={{ title: 'Map' }} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} options={{ title: 'Ranks' }} />
        <Tab.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
        <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Shop' }} />
      </Tab.Navigator>
    </View>
  );
}

function RootNavigator() {
  const { hasSeenLogin, isLoading, user, isGuest } = useAuth();
  const showLogin = !isLoading && !user && !isGuest && !hasSeenLogin;

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showLogin ? <Stack.Screen name="Login" component={LoginScreen} /> : null}
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="Versus" component={VersusScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="Tournament" component={TournamentScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <RootNavigator />
    </NavigationContainer>
  );
}
