import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { 
  savePresentationToLocal, 
  getPresentationFromLocal, 
  purgeExpiredPresentations, 
  listLocalPresentations,
  deleteLocalPresentation
} from '../src/lib/services/localDb';

describe('Local Database with 24h Auto-Purge', () => {
  beforeEach(async () => {
    // Purge everything before each test
  });

  it('saves and retrieves presentations', async () => {
    const mockPres = {
      id: 'pres-1',
      title: 'Canva Pitch Deck',
      fileSize: 1024,
      totalPages: 10,
      aspectRatio: '16:9' as const,
      data: new Uint8Array([1, 2, 3]).buffer,
      thumbnailUrl: 'data:image/png;base64,mock',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    await savePresentationToLocal(mockPres);
    const retrieved = await getPresentationFromLocal('pres-1');
    expect(retrieved?.title).toBe('Canva Pitch Deck');
    expect(retrieved?.totalPages).toBe(10);
  });

  it('purges presentations older than 24 hours', async () => {
    const expiredPres = {
      id: 'expired-1',
      title: 'Old Slide',
      fileSize: 500,
      totalPages: 5,
      aspectRatio: '16:9' as const,
      data: new Uint8Array([4, 5]).buffer,
      thumbnailUrl: '',
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 60 * 60 * 1000 // Expired 1 hour ago
    };

    await savePresentationToLocal(expiredPres);
    const purgedCount = await purgeExpiredPresentations();
    expect(purgedCount).toBeGreaterThanOrEqual(1);

    const items = await listLocalPresentations();
    expect(items.find(p => p.id === 'expired-1')).toBeUndefined();
  });

  it('deletes specific presentation', async () => {
    const pres = {
      id: 'pres-delete-test',
      title: 'To Delete',
      fileSize: 100,
      totalPages: 1,
      aspectRatio: '16:9' as const,
      data: new Uint8Array([9]).buffer,
      thumbnailUrl: '',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000
    };

    await savePresentationToLocal(pres);
    await deleteLocalPresentation('pres-delete-test');
    const result = await getPresentationFromLocal('pres-delete-test');
    expect(result).toBeUndefined();
  });
});
