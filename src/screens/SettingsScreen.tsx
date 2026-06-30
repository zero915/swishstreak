import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLocalSettings } from '../hooks/useLocalSettings';

const C = { bg: '#0E1116', surface: '#1B2030', text: '#F2F4F8', muted: '#8A93A6', line: '#2A3142', primary: '#FF7A3D', danger: '#E0563F' };

export function SettingsScreen() {
  const { profile, isGuest, isAnonymous, signOut } = useAuth();
  const { settings, update } = useLocalSettings();
  const [name, setName] = useState(settings.displayName || profile?.displayName || '');

  const accountLabel = profile?.displayName ?? (isGuest || isAnonymous ? 'Guest' : 'Player');

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Settings</Text>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.section}>Account</Text>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Signed in as</Text>
            <Text style={styles.value}>{accountLabel}</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onEndEditing={() => update({ displayName: name.trim() })}
            placeholder="Your name"
            placeholderTextColor={C.muted}
            maxLength={20}
            returnKeyType="done"
          />
          {(isGuest || isAnonymous) && (
            <Text style={styles.note}>Link a Google or Facebook account from the Home screen to save your progress.</Text>
          )}
        </View>

        <Text style={styles.section}>Preferences</Text>
        <View style={styles.card}>
          <ToggleRow label="Sound effects" value={settings.soundOn} onValueChange={(v) => update({ soundOn: v })} />
          <View style={styles.divider} />
          <ToggleRow label="Haptics" value={settings.hapticsOn} onValueChange={(v) => update({ hapticsOn: v })} />
          <View style={styles.divider} />
          <ToggleRow label="Notifications" value={settings.notificationsOn} onValueChange={(v) => update({ notificationsOn: v })} />
        </View>

        <Pressable style={styles.signOut} onPress={confirmSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={{ textAlign: 'center', color: '#8A93A6', fontSize: 12, fontWeight: '600', marginTop: 22 }}>
          Developed by PECJOdata
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: '#FFB59E', false: '#3A4256' }} thumbColor={value ? C.primary : '#C9D0DE'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  title: { fontSize: 22, fontWeight: '800', color: C.text, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  body: { padding: 16, paddingBottom: 40 },
  section: { fontSize: 13, fontWeight: '800', color: C.muted, marginTop: 14, marginBottom: 6, marginLeft: 4 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 15, color: C.text, fontWeight: '600' },
  value: { fontSize: 15, color: C.muted, fontWeight: '700' },
  label: { fontSize: 13, color: C.muted, marginBottom: 6, fontWeight: '600', marginTop: 6 },
  input: { borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: C.text },
  note: { fontSize: 12, color: C.muted, marginTop: 10, lineHeight: 18 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 4 },
  signOut: { marginTop: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: '#2A1A1A', alignItems: 'center' },
  signOutText: { fontSize: 15, fontWeight: '800', color: C.danger },
});
