/**
 * Scene brightness gate.
 * Mean luma is expected in 0–1 (e.g. from a frame processor sampling a downscaled ROI).
 */
const DARK_LUMA_THRESHOLD = 0.12;

export function exposureWouldBlock(meanLuma: number | undefined): boolean {
  if (meanLuma == null || Number.isNaN(meanLuma)) return false;
  return meanLuma < DARK_LUMA_THRESHOLD;
}
