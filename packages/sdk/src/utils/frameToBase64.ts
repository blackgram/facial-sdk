import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface Base64Options {
  width?: number;
  quality?: number;
}

/**
 * Convert a frame image to a base64-encoded JPEG data URI.
 */
export async function frameToBase64(
  uri: string,
  options: Base64Options = {},
): Promise<string> {
  const { width = 720, quality = 0.7 } = options;
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width });
  const ref = await context.renderAsync();
  const result = await ref.saveAsync({ compress: quality, format: SaveFormat.JPEG, base64: true });
  return `data:image/jpeg;base64,${result.base64}`;
}
