// ─── Main component ───
export { LivenessCapture, type LivenessCaptureProps } from './capture/LivenessCapture';

// ─── Types ───
export type {
  PromptConfig,
  PromptId,
  CapturedFrame,
  CaptureResult,
  CapturePhase,
  ProgressEvent,
  GateBlockReason,
  OvalGuide,
} from './capture/types';
export { LivenessError } from './capture/types';

// ─── Theme ───
export type { LivenessTheme } from './theme/types';
export { defaultTheme } from './theme/defaults';

// ─── Localization ───
export type { LivenessMessages } from './localization/types';
export { en as defaultMessages } from './localization/en';

// ─── Plugins ───
export type { LivenessPlugin, PluginResult, FrameInfo } from './plugins/types';

// ─── Camera engine ───
export type { CaptureEngine, CapturedPhoto } from './camera/types';
export { createVisionCameraEngine } from './camera/VisionCameraEngine';
