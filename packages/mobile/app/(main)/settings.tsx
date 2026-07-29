import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GlassCard } from '../../src/components/ui';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { colors } from '../../src/theme/tokens';

const LEGAL_URL = 'https://social-teen-patti.vercel.app/legal.html';

export default function SettingsScreen() {
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, logout } = useAuthStore();

  const deleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.delete<{ deleted: true }>('/users/account', {
        confirmation,
        password: user?.isGuest ? undefined : password,
      });
      logout();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete account');
      setIsDeleting(false);
    }
  };

  const confirmDeletion = () => {
    Alert.alert(
      'Delete this account?',
      'This is permanent. Your profile and social content will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => void deleteAccount() },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Settings</Text>

      <GlassCard style={styles.section} pressable={false}>
        {[
          { label: 'Sound Effects', value: sound, onChange: setSound },
          { label: 'Haptic Feedback', value: haptics, onChange: setHaptics },
          { label: 'Notifications', value: notifications, onChange: setNotifications },
        ].map((item) => (
          <View key={item.label} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Switch
              value={item.value}
              onValueChange={item.onChange}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#22c55e' }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </GlassCard>

      <GlassCard style={styles.legalSection} pressable={false}>
        <Pressable style={styles.linkRow} onPress={() => void Linking.openURL(`${LEGAL_URL}#privacy`)}>
          <Text style={styles.rowLabel}>Privacy & responsible play</Text>
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => void Linking.openURL(`${LEGAL_URL}#terms`)}>
          <Text style={styles.rowLabel}>Referral terms</Text>
        </Pressable>
      </GlassCard>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Delete account</Text>
        <Text style={styles.dangerCopy}>
          Your profile and social content will be removed. Auditable game, referral, and transaction records stay pseudonymous.
        </Text>
        <Text style={styles.inputLabel}>Type DELETE to confirm</Text>
        <TextInput
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          placeholderTextColor={colors.white40}
          placeholder="DELETE"
        />
        {!user?.isGuest && (
          <>
            <Text style={styles.inputLabel}>Current password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              style={styles.input}
            />
          </>
        )}
        {deleteError ? <Text style={styles.error} accessibilityRole="alert">{deleteError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={confirmation !== 'DELETE' || (!user?.isGuest && !password) || isDeleting}
          onPress={confirmDeletion}
          style={({ pressed }) => [styles.deleteButton, (pressed || isDeleting) && styles.pressed, (confirmation !== 'DELETE' || (!user?.isGuest && !password)) && styles.disabled]}
        >
          <Text style={styles.deleteLabel}>{isDeleting ? 'Deleting…' : 'Permanently delete account'}</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Social Teen Patti v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 120 },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  section: { padding: 0, overflow: 'hidden' },
  legalSection: { padding: 0, overflow: 'hidden', marginTop: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  linkRow: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.white05 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  dangerZone: { marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.07)' },
  dangerTitle: { color: '#fca5a5', fontSize: 17, fontWeight: '700' },
  dangerCopy: { color: colors.white60, fontSize: 13, lineHeight: 20, marginTop: 8, marginBottom: 14 },
  inputLabel: { color: colors.white60, fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.white10, borderRadius: 12, paddingHorizontal: 12, color: colors.white, backgroundColor: 'rgba(0,0,0,0.25)' },
  error: { color: '#fca5a5', fontSize: 13, marginTop: 10 },
  deleteButton: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', marginTop: 14 },
  deleteLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
  version: { color: colors.white40, fontSize: 12, textAlign: 'center', marginTop: 32 },
});
