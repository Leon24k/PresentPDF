import { describe, it, expect } from 'vitest';
import { calculateAspectRatio, loadPdfDocument, extractPdfMetadata } from '../src/lib/services/pdfEngine';
import { generateSamplePdfBuffer } from '../src/lib/services/samplePdf';

describe('PDF Engine Service', () => {
  it('calculates aspect ratios correctly for standard presentation slides', () => {
    expect(calculateAspectRatio(1920, 1080)).toBe('16:9');
    expect(calculateAspectRatio(1024, 768)).toBe('4:3');
    expect(calculateAspectRatio(595, 842)).toBe('portrait');
    expect(calculateAspectRatio(1200, 1200)).toBe('custom');
  });

  it('successfully loads and extracts metadata from the sample PDF buffer', async () => {
    const buffer = generateSamplePdfBuffer();
    const doc = await loadPdfDocument(buffer);
    expect(doc.numPages).toBe(4);
    const meta = await extractPdfMetadata(doc);
    expect(meta.totalPages).toBe(4);
  });
});
