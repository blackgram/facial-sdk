// ─── Types ───
export type {
  PromptId,
  PromptConfig,
  CapturedFrame,
  CaptureResult,
  CapturePhase,
  ProgressEvent,
  GateBlockReason,
  OvalGuide,
} from './types';
export { LivenessError } from './types';

// ─── Gatekeeper ───
export {
  evaluateGate,
  advanceBlinkState,
  advanceNodState,
  initialBlinkState,
  initialNodState,
  DEFAULT_GATE_HINTS,
  BLINK_OPEN_MIN,
  BLINK_CLOSED_MAX,
  BLINK_RECOVERY_MIN,
  BLINK_MAX_DURATION_MS,
  type BlinkState,
  type BlinkPhase,
  type NodState,
  type DetectedFace,
  type GateEvaluationParams,
  type GateResult,
} from './Gatekeeper';

// ─── Face Quality ───
export {
  evaluateFaceQuality,
  faceCenterInOval,
  computePositionVariance,
  type FaceBounds,
  type FaceQualityInput,
  type FaceQualityResult,
} from './FaceQuality';

// ─── State Machine ───
export {
  initialState,
  transition,
  type StateMachineEvent,
  type StateMachineState,
} from './StateMachine';

// ─── Exposure ───
export { exposureWouldBlock } from './Exposure';

// ─── Plugin types ───
export type { LivenessPlugin } from './plugin-types';
