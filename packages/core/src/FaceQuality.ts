import type { OvalGuide } from './types';

/** Minimum face width as a fraction of the oval guide width. */
const MIN_FACE_WIDTH_FRAC = 0.17;

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FaceQualityInput {
  bounds: FaceBounds;
  oval: OvalGuide;
}

export interface FaceQualityResult {
  tooSmall: boolean;
  outsideOval: boolean;
}

export function faceCenterInOval(
  center: { cx: number; cy: number },
  oval: OvalGuide,
): boolean {
  const halfW = oval.width / 2 - oval.edgeInsetPx;
  const halfH = oval.height / 2 - oval.edgeInsetPx;
  if (halfW <= 0 || halfH <= 0) return false;
  return (
    center.cx >= oval.cx - halfW &&
    center.cx <= oval.cx + halfW &&
    center.cy >= oval.cy - halfH &&
    center.cy <= oval.cy + halfH
  );
}

export function evaluateFaceQuality(input: FaceQualityInput): FaceQualityResult {
  const { bounds, oval } = input;
  const tooSmall = bounds.width < oval.width * MIN_FACE_WIDTH_FRAC;
  const center = { cx: bounds.x + bounds.width / 2, cy: bounds.y + bounds.height / 2 };
  const outsideOval = !faceCenterInOval(center, oval);
  return { tooSmall, outsideOval };
}

export function computePositionVariance(samples: { cx: number; cy: number }[]): number {
  if (samples.length < 3) return Number.POSITIVE_INFINITY;
  let mx = 0;
  let my = 0;
  for (const s of samples) {
    mx += s.cx;
    my += s.cy;
  }
  mx /= samples.length;
  my /= samples.length;
  let acc = 0;
  for (const s of samples) {
    const dx = s.cx - mx;
    const dy = s.cy - my;
    acc += dx * dx + dy * dy;
  }
  return acc / samples.length;
}
