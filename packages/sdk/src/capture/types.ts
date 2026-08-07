// ─── Prompt types ───

export type PromptId = string;

export interface PromptConfig {
  id: PromptId;
  instruction: string;
  timeout?: number;
}

// ─── Capture result ───

export interface CapturedFrame {
  prompt: PromptConfig;
  uri: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface CaptureResult {
  version: 1;
  frames: CapturedFrame[];
  durationMs: number;
  deviceOrientation: 'portrait' | 'landscape';
  metadata: {
    sdkVersion: string;
  };
}

// ─── State machine ───

export type CapturePhase = 'instructions' | 'capturing' | 'processing' | 'complete' | 'error';

// ─── Gatekeeper ───

export type GateBlockReason =
  | 'no_face'
  | 'multi_face'
  | 'too_dark'
  | 'face_too_small'
  | 'face_not_in_oval'
  | 'pose_mismatch'
  | 'blink_required'
  | 'smile_required'
  | 'nod_required'
  | 'anti_static';

export interface OvalGuide {
  cx: number;
  cy: number;
  width: number;
  height: number;
  edgeInsetPx: number;
}

// ─── Events ───

export interface ProgressEvent {
  completed: number;
  total: number;
  currentPrompt: PromptConfig;
}

// ─── Errors ───

export class LivenessError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'LivenessError';
    this.code = code;
  }
}
