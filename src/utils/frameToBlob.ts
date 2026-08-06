import * as FileSystem from 'expo-file-system';

/**
 * Convert a frame image to a Blob for multipart/form-data uploads.
 * Returns an object with the blob data URI and mime type.
 */
export async function frameToBlob(uri: string): Promise<{ uri: string; type: string; name: string }> {
  const filename = uri.split('/').pop() ?? 'frame.jpg';
  const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

  return {
    uri,
    type,
    name: filename,
  };
}
