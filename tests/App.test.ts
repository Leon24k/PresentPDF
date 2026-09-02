import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { purgeExpiredPresentations } from '../src/lib/services/localDb';

describe('HostPDF End-to-End Baseline Integration', () => {
  it('runs initial cleanup successfully', async () => {
    const count = await purgeExpiredPresentations();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
