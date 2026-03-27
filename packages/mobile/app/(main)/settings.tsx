import { View, Text, StyleSheet, Switch } from 'react-native';
import { useState } from 'react';
import { GlassCard } from '../../src/components/ui';
import { colors } from '../../src/theme/tokens';

export default function SettingsScreen() {
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <View style={styles.container}>
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

      <Text style={styles.version}>Social Teen Patti v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 60 },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 20 },
  section: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  version: { color: colors.white40, fontSize: 12, textAlign: 'center', marginTop: 32 },
});
