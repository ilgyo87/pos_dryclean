import { remove, getUrl } from 'aws-amplify/storage';

/**
 * Deletes an image from S3 given its key (e.g. public/products/filename.jpg)
 * @param key S3 object key
 * @returns Promise<void>
 */
/**
 * Gets a signed URL for an image stored in S3 using Amplify Gen 2 Storage API.
 * @param key S3 object key
 * @returns Promise<string | undefined> - Signed URL or undefined if error
 */
export async function getS3ImageUrl(key: string): Promise<string | undefined> {
  if (!key) return undefined;
  try {
    const { url } = await getUrl({ key });
    return url.toString();
  } catch (error) {
    console.error("Failed to get S3 image URL", error);
    return undefined;
  }
}

export async function deleteS3Image(key: string): Promise<void> {
  if (!key || typeof key !== 'string') return;
  try {
    await remove({ key });
    console.log(`Deleted image from S3: ${key}`);
  } catch (error) {
    console.error(`Failed to delete image from S3: ${key}`, error);
  }
}
