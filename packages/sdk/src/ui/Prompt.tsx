import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { PromptConfig } from '../capture/types';

interface PromptDisplayProps {
  prompt: PromptConfig;
  subtitle?: string;
}

function ArrowIndicator({ direction }: { direction: 'left' | 'right' }) {
  const rotation = direction === 'left' ? '180' : '0';
  return (
    <View style={[styles.arrowContainer, direction === 'left' ? styles.arrowLeft : styles.arrowRight]}>
      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate: `${rotation}deg` }] }}>
        <Path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="#FFFFFF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function PromptDisplay({ prompt, subtitle }: PromptDisplayProps) {
  const showLeftArrow = prompt.id === 'turn_left';
  const showRightArrow = prompt.id === 'turn_right';

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {showLeftArrow && <ArrowIndicator direction="left" />}
        <Text style={styles.title}>{prompt.instruction}</Text>
        {showRightArrow && <ArrowIndicator direction="right" />}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {},
  arrowRight: {},
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 6,
  },
});
