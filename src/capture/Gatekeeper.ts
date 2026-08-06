import type { PromptId, GateBlockReason, OvalGuide } from './types';
import { exposureWouldBlock } from './Exposure';
import { evaluateFaceQuality } from './FaceQuality';

// ─── Face data interface (engine-agnostic) ───

export interface DetectedFace {
  bounds: { x: number; y: number; width: number; height: number };
  yawAngle?: number;
  pitchAngle?: number;
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
  smilingProbability?: number;
}

// ─── Thresholds ───

const STRAIGHT_YAW_MAX = 5;
const STRAIGHT_PITCH_MAX = 5;
const STRAIGHT_EYE_OPEN_MIN = 0.85;

const TURN_YAW_MIN = 18;
const TURN_PITCH_MAX = 15;

const NOD_PITCH_DOWN = -12;

const SMILE_MIN = 0.75;

export const BLINK_OPEN_MIN = 0.80;
export const BLINK_CLOSED_MAX = 0.30;
export const BLINK_RECOVERY_MIN = 0.55;
export const BLINK_MAX_DURATION_MS = 1500;

// ─── Blink state machine ───

export type BlinkPhase = 'waiting_open' | 'waiting_closed' | 'waiting_recovery' | 'detected';

export interface BlinkState {
  phase: BlinkPhase;
  openDetectedAt: number | null;
}

export function initialBlinkState(): BlinkState {
  return { phase: 'waiting_open', openDetectedAt: null };
}

export function advanceBlinkState(
  state: BlinkState,
  leftEye: number,
  rightEye: number,
  now: number,
): BlinkState {
  const avgOpen = (leftEye + rightEye) / 2;
  const bothOpen = avgOpen > BLINK_OPEN_MIN;
  const bothClosed = avgOpen < BLINK_CLOSED_MAX;
  const bothRecovered = avgOpen > BLINK_RECOVERY_MIN;

  switch (state.phase) {
    case 'waiting_open':
      if (bothOpen) return { phase: 'waiting_closed', openDetectedAt: now };
      return state;

    case 'waiting_closed':
      if (bothClosed) {
        if (state.openDetectedAt != null && now - state.openDetectedAt > BLINK_MAX_DURATION_MS) {
          return initialBlinkState();
        }
        return { ...state, phase: 'waiting_recovery' };
      }
      if (bothOpen) return state;
      if (state.openDetectedAt != null && now - state.openDetectedAt > BLINK_MAX_DURATION_MS) {
        return initialBlinkState();
      }
      return state;

    case 'waiting_recovery':
      if (bothRecovered) {
        if (state.openDetectedAt != null && now - state.openDetectedAt <= BLINK_MAX_DURATION_MS) {
          return { phase: 'detected', openDetectedAt: state.openDetectedAt };
        }
        return initialBlinkState();
      }
      if (state.openDetectedAt != null && now - state.openDetectedAt > BLINK_MAX_DURATION_MS) {
        return initialBlinkState();
      }
      return state;

    case 'detected':
      return state;
  }
}

// ─── Nod state machine ───

export interface NodState {
  wentDown: boolean;
  recoveredUp: boolean;
}

export function initialNodState(): NodState {
  return { wentDown: false, recoveredUp: false };
}

export function advanceNodState(state: NodState, pitch: number): NodState {
  if (!state.wentDown) {
    if (pitch < NOD_PITCH_DOWN) return { wentDown: true, recoveredUp: false };
    return state;
  }
  if (!state.recoveredUp) {
    if (pitch > -5) return { wentDown: true, recoveredUp: true };
    return state;
  }
  return state;
}

// ─── Gate hints (default English) ───

export const DEFAULT_GATE_HINTS: Record<GateBlockReason, string> = {
  no_face: "We can't see your face. Center yourself in the guide.",
  multi_face: 'Only one face should be visible.',
  too_dark: 'Too dark — move to a brighter spot.',
  face_too_small: 'Move a little closer.',
  face_not_in_oval: 'Align your face inside the circle.',
  pose_mismatch: 'Follow the instruction above.',
  blink_required: 'Blink naturally.',
  smile_required: 'Give a clear, natural smile.',
  nod_required: 'Nod your head gently.',
  anti_static: 'Hold the phone naturally — avoid a flat photo or screen.',
};

// ─── Known prompts with built-in pose logic ───

const KNOWN_PROMPTS = new Set([
  'look_straight',
  'turn_left',
  'turn_right',
  'smile',
  'blink',
  'nod',
]);

// ─── Main gate evaluation ───

export interface GateEvaluationParams {
  faces: DetectedFace[];
  promptId: PromptId;
  oval: OvalGuide;
  sceneMeanLuma?: number;
  blinkDetected?: boolean;
  nodDetected?: boolean;
}

export interface GateResult {
  ok: boolean;
  reason: GateBlockReason | null;
}

export function evaluateGate(params: GateEvaluationParams): GateResult {
  const { faces, promptId, oval, sceneMeanLuma, blinkDetected, nodDetected } = params;

  if (exposureWouldBlock(sceneMeanLuma)) return { ok: false, reason: 'too_dark' };
  if (faces.length === 0) return { ok: false, reason: 'no_face' };
  if (faces.length > 1) return { ok: false, reason: 'multi_face' };

  const face = faces[0];
  const quality = evaluateFaceQuality({ bounds: face.bounds, oval });

  if (quality.tooSmall) return { ok: false, reason: 'face_too_small' };
  if (quality.outsideOval) return { ok: false, reason: 'face_not_in_oval' };

  // Only evaluate pose for known built-in prompts
  if (!KNOWN_PROMPTS.has(promptId)) {
    // Unknown prompt — pass gate if face is in position
    return { ok: true, reason: null };
  }

  const yaw = face.yawAngle ?? 0;
  const pitch = face.pitchAngle ?? 0;
  const leftEye = face.leftEyeOpenProbability ?? 1;
  const rightEye = face.rightEyeOpenProbability ?? 1;
  const smileScore = face.smilingProbability ?? 0;

  switch (promptId) {
    case 'look_straight':
      if (Math.abs(yaw) > STRAIGHT_YAW_MAX) return { ok: false, reason: 'pose_mismatch' };
      if (Math.abs(pitch) > STRAIGHT_PITCH_MAX) return { ok: false, reason: 'pose_mismatch' };
      if (leftEye < STRAIGHT_EYE_OPEN_MIN || rightEye < STRAIGHT_EYE_OPEN_MIN)
        return { ok: false, reason: 'pose_mismatch' };
      break;
    case 'turn_left':
      if (yaw > -TURN_YAW_MIN) return { ok: false, reason: 'pose_mismatch' };
      if (Math.abs(pitch) > TURN_PITCH_MAX) return { ok: false, reason: 'pose_mismatch' };
      break;
    case 'turn_right':
      if (yaw < TURN_YAW_MIN) return { ok: false, reason: 'pose_mismatch' };
      if (Math.abs(pitch) > TURN_PITCH_MAX) return { ok: false, reason: 'pose_mismatch' };
      break;
    case 'nod':
      if (!nodDetected) return { ok: false, reason: 'nod_required' };
      break;
    case 'blink':
      if (!blinkDetected) return { ok: false, reason: 'blink_required' };
      break;
    case 'smile':
      if (smileScore < SMILE_MIN) return { ok: false, reason: 'smile_required' };
      break;
  }

  return { ok: true, reason: null };
}
