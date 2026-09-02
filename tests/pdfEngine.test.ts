import { describe, it, expect } from 'vitest';
import { calculateAspectRatio } from '../src/lib/services/pdfEngine';

describe('PDF Engine Service', () => {
  it('calculates aspect ratios correctly for standard presentation slides', () => {
    expect(calculateAspectRatio(1920, 1080)).toBe('16:9');
    expect(calculateAspectRatio(1024, 768)).toBe('4:3');
    expect(calculateAspectRatio(595, 842)).toBe('portrait');
    expect(calculateAspectRatio(1200, 1200)).toBe('custom');
  });
});
