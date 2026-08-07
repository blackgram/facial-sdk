import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { PromptConfig, CapturedFrame, CaptureResult, ProgressEvent } from './types';
import { LivenessError } from './types';
import type { LivenessTheme } from '../theme/types';
import { defaultTheme } from '../theme/defaults';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import type { LivenessMessages } from '../localization/types';
import { en } from '../localization/en';
import { LocaleProvider } from '../localization/LocaleContext';
import type { LivenessPlugin } from '../plugins/types';
import { InstructionsView } from '../ui/InstructionsView';
import { CaptureView } from '../ui/CaptureView';

// SDK version injected at build time
const SDK_VERSION = '0.1.0';

export interface LivenessCaptureProps {
  prompts: PromptConfig[];

  /** Show instructions screen before capture. Default: true */
  showInstructions?: boolean;

  /** Theme overrides. Merged with defaults. */
  theme?: Partial<LivenessTheme>;

  /** Localization messages. Merged with English defaults. */
  messages?: Partial<LivenessMessages>;

  /** Plugins to hook into the capture pipeline. */
  plugins?: LivenessPlugin[];

  /** Enable SDK debug logging. Default: false */
  enableLogs?: boolean;

  // ─── Callbacks ───

  /** Called when all frames have been captured successfully. */
  onComplete: (result: CaptureResult) => void;

  /** Called when the user cancels. */
  onCancel: () => void;

  /** Called on unrecoverable errors (camera, capture failures). */
  onError: (error: LivenessError) => void;

  /** Called when a prompt begins. */
  onPromptStart?: (prompt: PromptConfig, index: number) => void;

  /** Called when a single prompt frame is captured. */
  onPromptComplete?: (prompt: PromptConfig, frame: CapturedFrame) => void;

  /** Called with progress after each capture. */
  onProgress?: (event: ProgressEvent) => void;
}

type Phase = 'instructions' | 'capturing' | 'processing';

function LivenessCaptureInner({
  prompts,
  showInstructions = true,
  enableLogs = false,
  plugins,
  onComplete,
  onCancel,
  onError,
  onPromptStart,
  onPromptComplete,
  onProgress,
}: LivenessCaptureProps) {
  const theme = useTheme();
  const [phase, setPhase] = useState<Phase>(showInstructions ? 'instructions' : 'capturing');
  const framesRef = useRef<CapturedFrame[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  const log = useCallback((...args: unknown[]) => {
    if (enableLogs) console.log('[LivenessSDK]', ...args);
  }, [enableLogs]);

  const handleReady = useCallback(() => {
    startTimeRef.current = Date.now();
    log('Capture started');
    setPhase('capturing');
  }, [log]);

  const handleFrameCaptured = useCallback((frame: CapturedFrame) => {
    framesRef.current = [...framesRef.current, frame];
    log('Frame captured:', frame.prompt.id);
  }, [log]);

  const handleAllCaptured = useCallback(() => {
    setPhase('processing');

    // Notify plugins
    if (plugins) {
      for (const plugin of plugins) {
        plugin.onCaptureComplete?.(framesRef.current);
      }
    }

    const result: CaptureResult = {
      version: 1,
      frames: framesRef.current,
      durationMs: Date.now() - startTimeRef.current,
      deviceOrientation: 'portrait',
      metadata: {
        sdkVersion: SDK_VERSION,
      },
    };

    log('Capture complete:', JSON.stringify(result, null, 2));
    onComplete(result);
  }, [onComplete, plugins, log]);

  const handleError = useCallback(
    (error: Error) => {
      log('Error:', error.message);
      onError(
        error instanceof LivenessError
          ? error
          : new LivenessError(error.message, 'CAPTURE_ERROR'),
      );
    },
    [onError, log],
  );

  if (phase === 'instructions') {
    return <InstructionsView onReady={handleReady} onCancel={onCancel} />;
  }

  if (phase === 'processing') {
    return (
      <View style={[styles.processingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.processingText, { color: theme.textSecondary }]}>
          Processing captured frames…
        </Text>
      </View>
    );
  }

  return (
    <CaptureView
      prompts={prompts}
      plugins={plugins}
      onFrameCaptured={handleFrameCaptured}
      onAllCaptured={handleAllCaptured}
      onCancel={onCancel}
      onError={handleError}
      onPromptStart={onPromptStart}
      onPromptComplete={onPromptComplete}
      onProgress={onProgress}
    />
  );
}

export function LivenessCapture(props: LivenessCaptureProps) {
  const mergedTheme: LivenessTheme = { ...defaultTheme, ...props.theme };
  const mergedMessages: LivenessMessages = { ...en, ...props.messages };

  return (
    <ThemeProvider theme={mergedTheme}>
      <LocaleProvider messages={mergedMessages}>
        <LivenessCaptureInner {...props} />
      </LocaleProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 15,
    marginTop: 16,
  },
});
