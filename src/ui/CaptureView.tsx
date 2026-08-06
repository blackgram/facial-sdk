import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Brightness from 'expo-brightness';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import type { CameraRef } from 'react-native-vision-camera';
import { useFaceDetectorOutput } from 'react-native-vision-camera-face-detector';
import type { Face } from 'react-native-vision-camera-face-detector';
import { useTheme } from '../theme/ThemeContext';
import { useMessages } from '../localization/LocaleContext';
import type { PromptConfig, CapturedFrame, GateBlockReason, OvalGuide } from '../capture/types';
import {
  evaluateGate,
  advanceBlinkState,
  advanceNodState,
  initialBlinkState,
  initialNodState,
  DEFAULT_GATE_HINTS,
  type BlinkState,
  type NodState,
  type DetectedFace,
} from '../capture/Gatekeeper';
import { computePositionVariance, evaluateFaceQuality } from '../capture/FaceQuality';
import type { LivenessPlugin } from '../plugins/types';
import { Overlay } from './Overlay';
import { Progress } from './Progress';
import { PromptDisplay } from './Prompt';

const FRAME_W = 240;
const FRAME_H = 340;

const THROTTLE_MS = 66;
const READY_DEBOUNCE_MS = 160;
const STATIC_VARIANCE_MAX = 8;
const STATIC_DURATION_MS = 1400;
const MOTION_MAX_SAMPLES = 14;

const SUCCESS_DISPLAY_MS = 700;

type InternalPhase = 'live' | 'busy' | 'success';

const ACTION_PROMPTS = new Set(['blink', 'nod', 'smile']);

function evaluatePositionGate(
  faces: DetectedFace[],
  oval: OvalGuide,
): { ok: boolean; reason: GateBlockReason | null } {
  if (faces.length === 0) return { ok: false, reason: 'no_face' };
  if (faces.length > 1) return { ok: false, reason: 'multi_face' };
  const quality = evaluateFaceQuality({ bounds: faces[0].bounds, oval });
  if (quality.tooSmall) return { ok: false, reason: 'face_too_small' };
  if (quality.outsideOval) return { ok: false, reason: 'face_not_in_oval' };
  return { ok: true, reason: null };
}

interface CaptureViewProps {
  prompts: PromptConfig[];
  plugins?: LivenessPlugin[];
  onFrameCaptured: (frame: CapturedFrame) => void;
  onAllCaptured: () => void;
  onCancel: () => void;
  onError: (error: Error) => void;
  onPromptStart?: (prompt: PromptConfig, index: number) => void;
  onPromptComplete?: (prompt: PromptConfig, frame: CapturedFrame) => void;
  onProgress?: (event: { completed: number; total: number; currentPrompt: PromptConfig }) => void;
}

export function CaptureView({
  prompts,
  plugins,
  onFrameCaptured,
  onAllCaptured,
  onCancel,
  onError,
  onPromptStart,
  onPromptComplete,
  onProgress,
}: CaptureViewProps) {
  const theme = useTheme();
  const messages = useMessages();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<CameraRef>(null);
  const capturingRef = useRef(false);
  const phaseRef = useRef<InternalPhase>('live');
  const primedRef = useRef(false);

  const [phase, setPhase] = useState<InternalPhase>('live');
  const [promptIndex, setPromptIndex] = useState(0);

  const currentPrompt = prompts[promptIndex];
  const currentPromptRef = useRef(currentPrompt);
  currentPromptRef.current = currentPrompt;
  const promptIndexRef = useRef(promptIndex);
  promptIndexRef.current = promptIndex;
  const { width: winW, height: winH } = useWindowDimensions();
  // Fixed oval position — always centered on screen
  const cutout = useMemo(() => ({ cx: winW / 2, cy: winH / 2 }), [winW, winH]);

  const successOpacity = useRef(new Animated.Value(0)).current;

  // Gatekeeper state — only used for positioning hints, never capture status
  const [blockReason, setBlockReason] = useState<GateBlockReason | null>('no_face');

  const motionSamplesRef = useRef<{ cx: number; cy: number }[]>([]);
  const lowMotionSinceRef = useRef<number | null>(null);
  const readySinceRef = useRef<number | null>(null);
  const lastProcessAtRef = useRef(0);
  const blinkStateRef = useRef<BlinkState>(initialBlinkState());
  const nodStateRef = useRef<NodState>(initialNodState());
  const prevReasonRef = useRef<GateBlockReason | null>(null);
  const captureFrameRef = useRef<() => void>(() => {});

  const ovalGuide = useMemo<OvalGuide>(
    () => ({ cx: cutout.cx, cy: cutout.cy, width: FRAME_W, height: FRAME_H, edgeInsetPx: 14 }),
    [cutout.cx, cutout.cy],
  );

  // Reset state on prompt change
  const resetTemporalState = useCallback(() => {
    motionSamplesRef.current = [];
    lowMotionSinceRef.current = null;
    readySinceRef.current = null;
    lastProcessAtRef.current = 0;
    blinkStateRef.current = initialBlinkState();
    nodStateRef.current = initialNodState();
    primedRef.current = false;
    phaseRef.current = 'live';
    capturingRef.current = false;
    setPhase('live');
    setBlockReason('no_face');
    prevReasonRef.current = 'no_face';
  }, []);

  useEffect(() => {
    onPromptStart?.(currentPrompt, promptIndex);
    resetTemporalState();
  }, [promptIndex]);

  const photoOutput = usePhotoOutput({ qualityPrioritization: 'speed' });
  const photoOutputRef = useRef(photoOutput);
  photoOutputRef.current = photoOutput;

  const advanceAfterCapture = useCallback(
    (frame: CapturedFrame) => {
      const prompt = currentPromptRef.current;
      const index = promptIndexRef.current;

      onFrameCaptured(frame);
      onPromptComplete?.(prompt, frame);
      onProgress?.({
        completed: index + 1,
        total: prompts.length,
        currentPrompt: prompt,
      });

      // Show success checkmark briefly before advancing
      phaseRef.current = 'success';
      setPhase('success');
      Animated.sequence([
        Animated.timing(successOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(SUCCESS_DISPLAY_MS - 300),
        Animated.timing(successOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => {
        if (index >= prompts.length - 1) {
          onAllCaptured();
          return;
        }
        setPromptIndex(index + 1);
      });
    },
    [onFrameCaptured, onPromptComplete, onProgress, onAllCaptured, prompts.length, successOpacity],
  );

  const captureFrame = useCallback(async () => {
    if (capturingRef.current || phaseRef.current === 'busy') return;
    capturingRef.current = true;
    phaseRef.current = 'busy';
    setPhase('busy');

    const prompt = currentPromptRef.current;

    const finishCapture = (frame: CapturedFrame) => {
      capturingRef.current = false;
      advanceAfterCapture(frame);
    };

    const failCapture = (err: unknown) => {
      capturingRef.current = false;
      phaseRef.current = 'live';
      setPhase('live');
      onError(err instanceof Error ? err : new Error('Capture failed'));
    };

    try {
      const photoFile = await photoOutputRef.current.capturePhotoToFile(
        { flashMode: 'off', enableShutterSound: false },
        {},
      );
      const uri = photoFile.filePath.startsWith('file://')
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;

      finishCapture({
        prompt,
        uri,
        width: photoFile.width ?? 0,
        height: photoFile.height ?? 0,
        timestamp: Date.now(),
      });
    } catch {
      try {
        const retryFile = await photoOutputRef.current.capturePhotoToFile(
          { flashMode: 'off', enableShutterSound: false },
          {},
        );
        const uri = retryFile.filePath.startsWith('file://')
          ? retryFile.filePath
          : `file://${retryFile.filePath}`;

        finishCapture({
          prompt,
          uri,
          width: retryFile.width ?? 0,
          height: retryFile.height ?? 0,
          timestamp: Date.now(),
        });
      } catch (retryErr) {
        failCapture(retryErr);
      }
    }
  }, [advanceAfterCapture, onError]);

  captureFrameRef.current = captureFrame;

  // Face detection callback
  const handleFaces = useCallback(
    (faces: Face[]) => {
      if (phaseRef.current === 'busy' || phaseRef.current === 'success' || capturingRef.current) return;

      const now = Date.now();
      if (now - lastProcessAtRef.current < THROTTLE_MS) return;
      lastProcessAtRef.current = now;

      const prompt = currentPromptRef.current;
      const detectedFaces = faces as DetectedFace[];
      const positioned = evaluatePositionGate(detectedFaces, ovalGuide);
      const isActionPrompt = ACTION_PROMPTS.has(prompt.id);

      // Advance blink/nod state machines
      if (faces.length === 1) {
        const face = faces[0];
        if (prompt.id === 'blink') {
          const leftEye = face.leftEyeOpenProbability ?? 1;
          const rightEye = face.rightEyeOpenProbability ?? 1;
          blinkStateRef.current = advanceBlinkState(blinkStateRef.current, leftEye, rightEye, now);
        }
        if (prompt.id === 'nod') {
          const pitch = face.pitchAngle ?? 0;
          nodStateRef.current = advanceNodState(nodStateRef.current, pitch);
        }
      } else {
        blinkStateRef.current = initialBlinkState();
        nodStateRef.current = initialNodState();
      }

      const blinkDetected = blinkStateRef.current.phase === 'detected';
      const nodDetected = nodStateRef.current.wentDown;

      const instant = evaluateGate({
        faces: detectedFaces,
        promptId: prompt.id,
        oval: ovalGuide,
        blinkDetected,
        nodDetected,
      });

      // Run plugins
      if (plugins && faces.length === 1 && instant.ok) {
        for (const plugin of plugins) {
          if (plugin.onFrame) {
            const result = plugin.onFrame(faces[0] as DetectedFace, {
              timestamp: now,
              promptId: prompt.id,
            });
            if ('block' in result) {
              primedRef.current = false;
              readySinceRef.current = null;
              if (prevReasonRef.current !== 'pose_mismatch') {
                prevReasonRef.current = 'pose_mismatch';
                setBlockReason('pose_mismatch');
              }
              return;
            }
          }
        }
      }

      // Motion tracking uses position only so action prompts can prime while waiting
      if (faces.length === 1 && positioned.ok) {
        const b = faces[0].bounds;
        motionSamplesRef.current.push({ cx: b.x + b.width / 2, cy: b.y + b.height / 2 });
        while (motionSamplesRef.current.length > MOTION_MAX_SAMPLES) {
          motionSamplesRef.current.shift();
        }
      } else {
        motionSamplesRef.current = [];
        lowMotionSinceRef.current = null;
      }

      let antiStaticReason: GateBlockReason | null = null;

      // Anti-static check until primed for this prompt
      if (!primedRef.current && faces.length === 1 && positioned.ok) {
        const variance = computePositionVariance(motionSamplesRef.current);
        if (variance < STATIC_VARIANCE_MAX) {
          if (lowMotionSinceRef.current == null) lowMotionSinceRef.current = now;
        } else {
          lowMotionSinceRef.current = null;
        }
        if (lowMotionSinceRef.current != null && now - lowMotionSinceRef.current > STATIC_DURATION_MS) {
          antiStaticReason = 'anti_static';
        }
      } else {
        lowMotionSinceRef.current = null;
      }

      const displayReason: GateBlockReason | null =
        !positioned.ok ? positioned.reason : antiStaticReason ?? instant.reason;

      const okForPriming = isActionPrompt
        ? positioned.ok && antiStaticReason === null
        : instant.ok && antiStaticReason === null;

      const okForCapture = instant.ok && antiStaticReason === null;

      if (!primedRef.current && okForPriming) {
        if (readySinceRef.current == null) readySinceRef.current = now;
        if (now - readySinceRef.current >= READY_DEBOUNCE_MS) {
          primedRef.current = true;
        }
      } else if (!okForPriming) {
        readySinceRef.current = null;
        primedRef.current = false;
      }

      // Update positioning hints only — never show capture status
      if (displayReason !== prevReasonRef.current) {
        prevReasonRef.current = displayReason;
        setBlockReason(displayReason);
      } else if (displayReason === null && prevReasonRef.current !== null) {
        prevReasonRef.current = null;
        setBlockReason(null);
      }

      if (primedRef.current && okForCapture) {
        // Filler prompts (e.g. center_face) don't capture — just advance
        const prompt = currentPromptRef.current;
        if (prompt.id === 'center_face') {
          if (phaseRef.current === 'live') {
            phaseRef.current = 'busy';
            setPhase('success');
            Animated.sequence([
              Animated.timing(successOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
              Animated.delay(SUCCESS_DISPLAY_MS - 300),
              Animated.timing(successOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
            ]).start(() => {
              const index = promptIndexRef.current;
              onProgress?.({
                completed: index + 1,
                total: prompts.length,
                currentPrompt: prompt,
              });
              if (index >= prompts.length - 1) {
                onAllCaptured();
                return;
              }
              setPromptIndex(index + 1);
            });
          }
          return;
        }
        captureFrameRef.current();
      }
    },
    [ovalGuide, plugins, successOpacity, prompts.length, onProgress, onAllCaptured],
  );

  // Face detector output
  const faceDetectorOutput = useFaceDetectorOutput({
    onFacesDetected: handleFaces,
    onError: (e) => console.warn('[LivenessSDK FaceDetector]', e),
    performanceMode: 'fast',
    runClassifications: true,
    runLandmarks: false,
    runContours: false,
    minFaceSize: 0.15,
    trackingEnabled: true,
    autoMode: true,
    windowWidth: winW,
    windowHeight: winH,
    cameraFacing: 'front',
  });

  const cameraOutputs = useMemo(
    () => [faceDetectorOutput, photoOutput],
    [faceDetectorOutput, photoOutput],
  );

  // Max brightness
  const savedBrightness = useRef<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const current = await Brightness.getSystemBrightnessAsync();
        if (!cancelled) savedBrightness.current = current;
        await Brightness.setBrightnessAsync(1);
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (savedBrightness.current != null) {
        Brightness.setBrightnessAsync(savedBrightness.current).catch(() => {});
      }
    };
  }, []);

  // Request permission
  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Positioning hints only — hide subtitle once conditions are met
  const hintText = useMemo(() => {
    if (!blockReason) return undefined;
    return DEFAULT_GATE_HINTS[blockReason];
  }, [blockReason]);

  // ─── Non-camera states ───

  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.centeredSafe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={[styles.msgTitle, { color: theme.text }]}>{messages.cameraPermissionRequired}</Text>
          <Text style={[styles.msgSub, { color: theme.textSecondary }]}>{messages.cameraPermissionDescription}</Text>
          <Pressable style={[styles.primaryBtn, { backgroundColor: theme.primary, borderRadius: theme.borderRadius }]} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>{messages.allowCamera}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryBtn, { borderRadius: theme.borderRadius, borderColor: theme.border }]} onPress={onCancel}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{messages.goBack}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={[styles.centeredSafe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={[styles.msgTitle, { color: theme.text }]}>{messages.noCameraFound}</Text>
          <Pressable style={[styles.secondaryBtn, { borderRadius: theme.borderRadius, borderColor: theme.border }]} onPress={onCancel}>
            <Text style={[styles.secondaryBtnText, { color: theme.text }]}>{messages.goBack}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={cameraOutputs}
      />

      <Overlay
        width={winW}
        height={winH}
        ovalCx={cutout.cx}
        ovalCy={cutout.cy}
        ovalWidth={FRAME_W}
        ovalHeight={FRAME_H}
        ringColor="neutral"
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable style={styles.closeBtn} onPress={onCancel}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
          <View style={styles.progressWrap}>
            <Progress total={prompts.length} current={promptIndex} />
          </View>
          <View style={styles.topBarSpacer} />
        </View>

        <PromptDisplay prompt={currentPrompt} subtitle={hintText} />

        <View style={styles.frameWrap}>
          <Animated.View
            style={[
              styles.successBadge,
              { backgroundColor: theme.primary, opacity: successOpacity },
            ]}
            pointerEvents="none"
          >
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 13l4 4L19 7"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>

        <View style={styles.bottomSpacer}>
          <View style={styles.footerRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2L3 7v6c0 5.25 3.83 10.16 9 11 5.17-.84 9-5.75 9-11V7l-9-5z"
                fill={theme.primary}
              />
            </Svg>
            <Text style={styles.footerText}>Powered by Digital Factory</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredSafe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  msgTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  msgSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryBtn: { paddingVertical: 16, paddingHorizontal: 24, width: '100%', maxWidth: 320, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { paddingVertical: 14, width: '100%', maxWidth: 320, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontWeight: '600', fontSize: 16 },

  cameraRoot: { flex: 1, backgroundColor: '#000' },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    zIndex: 2,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  closeBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  progressWrap: { flex: 1, alignItems: 'center' },
  topBarSpacer: { width: 36 },

  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSpacer: { height: 40, alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
});
