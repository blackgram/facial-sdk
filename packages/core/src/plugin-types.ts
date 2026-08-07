import type { DetectedFace } from './Gatekeeper';
import type { CapturedFrame } from './types';

export interface FrameInfo {
  timestamp: number;
  promptId: string;
}

export type PluginResult =
  | { pass: true }
  | { block: string };

export interface LivenessPlugin {
  name: string;

  /** Called on each face detection frame. Can block capture. */
  onFrame?(face: DetectedFace, frame: FrameInfo): PluginResult;

  /** Called after all frames have been captured. */
  onCaptureComplete?(frames: CapturedFrame[]): void;

  /** Called when the plugin is initialized. */
  onInit?(): void;

  /** Called when the plugin is disposed. */
  onDispose?(): void;
}
