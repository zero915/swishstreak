import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ActiveMatchProvider } from './src/context/ActiveMatchContext';
import { PlayerDataProvider } from './src/context/PlayerDataContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PlayerDataProvider>
            <ActiveMatchProvider>
              <AppNavigator />
            </ActiveMatchProvider>
            <StatusBar style="auto" />
          </PlayerDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
