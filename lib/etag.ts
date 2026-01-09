import crypto from 'crypto';

/**
 * Generate an ETag for response data
 * Used for conditional requests (If-None-Match header)
 * Returns 304 Not Modified if content hasn't changed
 */
export function generateETag(data: any): string {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex');
  return `"${hash}"`;
}

/**
 * Check if the client's ETag matches the current data
 * Returns true if data hasn't changed (can return 304)
 */
export function checkETag(clientETag: string | null, serverETag: string): boolean {
  if (!clientETag) return false;
  return clientETag === serverETag;
}
