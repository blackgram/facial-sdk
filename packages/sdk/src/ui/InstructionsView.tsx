import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { useMessages } from '../localization/LocaleContext';

interface InstructionsViewProps {
  onReady: () => void;
  onCancel: () => void;
}

function FaceScanIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Path d="M9 16C9.85038 16.6303 10.8846 17 12 17C13.1154 17 14.1496 16.6303 15 16" stroke="#1E3A5F" strokeWidth={1.5} strokeLinecap="round" />
      <Ellipse cx={15} cy={10.5} rx={1} ry={1.5} fill="#1E3A5F" />
      <Ellipse cx={9} cy={10.5} rx={1} ry={1.5} fill="#1E3A5F" />
      <Path d="M22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22" stroke="#1E3A5F" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 22C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14" stroke="#1E3A5F" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M10 2C6.22876 2 4.34315 2 3.17157 3.17157C2 4.34315 2 6.22876 2 10" stroke="#1E3A5F" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M14 2C17.7712 2 19.6569 2 20.8284 3.17157C22 4.34315 22 6.22876 22 10" stroke="#1E3A5F" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function InstructionsView({ onReady }: InstructionsViewProps) {
  const theme = useTheme();
  const messages = useMessages();

  const tips = [messages.tipLighting, messages.tipCenterFace, messages.tipObstructions];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <FaceScanIcon />
          </View>

          <Text style={styles.title}>{messages.instructionsTitle}</Text>
          <Text style={styles.subtitle}>{messages.instructionsSubtitle}</Text>

          <View style={styles.listSection}>
            <Text style={styles.listHeader}>{messages.instructionsListHeader}</Text>
            {tips.map((tip, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                <Text style={styles.bulletText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.button, { backgroundColor: theme.primary, borderRadius: theme.borderRadius }]}
            onPress={onReady}
          >
            <Text style={styles.buttonText}>{messages.readyButton}</Text>
          </Pressable>
          <View style={styles.footerBrand}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L3 7v6c0 5.25 3.83 10.16 9 11 5.17-.84 9-5.75 9-11V7l-9-5z"
                fill={theme.primary}
              />
            </Svg>
            <Text style={styles.footerBrandText}>Powered by Digital Factory</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6F8' },
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E3EBF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A2B4A',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 320,
  },
  listSection: {
    alignSelf: 'stretch',
    maxWidth: 340,
  },
  listHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A2B4A',
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
  },
  footer: { paddingHorizontal: 32, paddingBottom: 32 },
  button: { paddingVertical: 18, alignItems: 'center' },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  footerBrand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 },
  footerBrandText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
});
