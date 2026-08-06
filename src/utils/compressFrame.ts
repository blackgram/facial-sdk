import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface CompressOptions {
  width?: number;
  quality?: number;
}

/**
 * Compress a frame image to JPEG.
 * Returns a local file URI to the compressed image.
 */
export async function compressFrame(
  uri: string,
  options: CompressOptions = {},
): Promise<string> {
  const { width = 720, quality = 0.7 } = options;
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width });
  const ref = await context.renderAsync();
  const result = await ref.saveAsync({ compress: quality, format: SaveFormat.JPEG });
  return result.uri;
}
