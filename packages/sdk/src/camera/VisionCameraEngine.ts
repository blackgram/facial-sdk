import type { CaptureEngine, CapturedPhoto } from './types';

/**
 * Default capture engine using react-native-vision-camera v5.
 *
 * This engine manages camera lifecycle and photo capture.
 * Face detection is handled separately via useFaceDetectorOutput.
 */
export function createVisionCameraEngine(): CaptureEngine {
  let cameraRef: any = null;
  let photoOutput: any = null;

  return {
    async initialize() {
      // Camera permission and device selection handled by the UI layer
    },

    async start() {
      // Camera activation handled by the Camera component's isActive prop
    },

    async stop() {
      // Camera deactivation handled by the Camera component's isActive prop
    },

    async capture(): Promise<CapturedPhoto> {
      if (!photoOutput) {
        throw new Error('Photo output not initialized');
      }

      const photoFile = await photoOutput.capturePhotoToFile(
        { flashMode: 'off', enableShutterSound: false },
        {},
      );

      const uri = photoFile.filePath.startsWith('file://')
        ? photoFile.filePath
        : `file://${photoFile.filePath}`;

      return {
        uri,
        width: photoFile.width ?? 0,
        height: photoFile.height ?? 0,
      };
    },

    getPreviewRef() {
      return cameraRef;
    },

    dispose() {
      cameraRef = null;
      photoOutput = null;
    },

    // Internal setters used by CaptureView
    set _cameraRef(ref: any) {
      cameraRef = ref;
    },

    set _photoOutput(output: any) {
      photoOutput = output;
    },
  } as CaptureEngine & { _cameraRef: any; _photoOutput: any };
}

export type VisionCameraEngine = ReturnType<typeof createVisionCameraEngine>;
