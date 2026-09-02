import type { Presentation } from '../types';

/**
 * Cloud Storage / Shareable Link Helper
 * Configured for Supabase Free Tier or Ephemeral File Service
 */
export async function createShareableLink(presentation: Presentation): Promise<{ url: string; shareId: string }> {
  // Generate short alphanumeric code (e.g. "a8f9c2d1")
  const shareId = Math.random().toString(36).substring(2, 10);
  
  // In pure client-side mode, construct deep link / hash or API endpoint
  const url = `${window.location.origin}/#share=${shareId}`;

  return {
    url,
    shareId,
  };
}
