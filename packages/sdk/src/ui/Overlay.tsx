import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface OverlayProps {
  width: number;
  height: number;
  ovalCx: number;
  ovalCy: number;
  ovalWidth: number;
  ovalHeight: number;
  ringColor: 'neutral' | 'warning' | 'success';
}

export function Overlay({
  width,
  height,
  ovalCx,
  ovalCy,
  ovalWidth,
  ovalHeight,
  ringColor,
}: OverlayProps) {
  const theme = useTheme();

  const strokeColor = theme.primary;

  const rx = ovalWidth / 2;

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect
        x={ovalCx - ovalWidth / 2}
        y={ovalCy - ovalHeight / 2}
        width={ovalWidth}
        height={ovalHeight}
        rx={rx}
        ry={rx}
        fill="none"
        stroke={strokeColor}
        strokeWidth={3}
      />
    </Svg>
  );
}
