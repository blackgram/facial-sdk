/**
 * MediaPipe Face Landmarker wrapper.
 * Uses @mediapipe/tasks-vision FaceLandmarker for full 478-point mesh,
 * blendshapes (smile, blink), and face transformation matrix (head pose).
 */

import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface FaceLandmarkResult {
  faces: Array<{
    /** Bounding box derived from landmarks */
    boundingBox: { originX: number; originY: number; width: number; height: number };
    /** Blendshape scores */
    blendshapes: Record<string, number>;
    /** Head rotation in degrees: yaw, pitch, roll */
    headRotation: { yaw: number; pitch: number; roll: number };
  }>;
}

let landmarker: FaceLandmarker | null = null;

export async function initFaceDetector(): Promise<{ detect: (video: HTMLVideoElement) => FaceLandmarkResult }> {
  if (!landmarker) {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );
    landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 2,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });
  }

  return {
    detect(video: HTMLVideoElement): FaceLandmarkResult {
      const now = performance.now();
      const result = landmarker!.detectForVideo(video, now);
      const faces: FaceLandmarkResult['faces'] = [];

      const landmarks = result.faceLandmarks || [];
      const blendshapes = result.faceBlendshapes || [];
      const matrices = result.facialTransformationMatrixes || [];

      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];

        // Compute bounding box from landmarks (normalized 0-1)
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        for (const p of lm) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const boundingBox = {
          originX: minX * vw,
          originY: minY * vh,
          width: (maxX - minX) * vw,
          height: (maxY - minY) * vh,
        };

        // Extract blendshapes as a map
        const bsMap: Record<string, number> = {};
        if (blendshapes[i]) {
          for (const cat of blendshapes[i].categories) {
            bsMap[cat.categoryName] = cat.score;
          }
        }

        // Extract head rotation from transformation matrix
        let yaw = 0, pitch = 0, roll = 0;
        if (matrices[i]) {
          const m = matrices[i].data;
          // Rotation matrix → Euler angles (YXZ order)
          // m is a 4x4 column-major matrix stored as Float32Array
          pitch = Math.asin(-m[6]) * (180 / Math.PI);
          yaw = Math.atan2(m[2], m[10]) * (180 / Math.PI);
          roll = Math.atan2(m[4], m[5]) * (180 / Math.PI);
        }

        faces.push({ boundingBox, blendshapes: bsMap, headRotation: { yaw, pitch, roll } });
      }

      return { faces };
    },
  };
}

