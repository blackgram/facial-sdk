// ─── Camera engine interface (purely functional) ───

export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
}

export interface CaptureEngine {
  /** Initialize engine resources (permissions, etc). */
  initialize(): Promise<void>;

  /** Start the camera preview. */
  start(): Promise<void>;

  /** Stop the camera preview. */
  stop(): Promise<void>;

  /** Capture a single photo. Returns local file URI + dimensions. */
  capture(): Promise<CapturedPhoto>;

  /**
   * Platform-specific preview handle.
   * On React Native with Vision Camera, this returns the camera ref.
   */
  getPreviewRef(): unknown;

  /** Release resources. */
  dispose(): void;
}
