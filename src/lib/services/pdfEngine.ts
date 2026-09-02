import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { AspectRatio } from '../types';

// Configure PDF.js worker using Vite's static asset URL resolver in browser
if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

// Track active render tasks per canvas element to cancel ongoing renders cleanly
const activeRenderTasks = new WeakMap<HTMLCanvasElement, any>();

/**
 * Calculates the aspect ratio category of a slide based on width and height
 */
export function calculateAspectRatio(width: number, height: number): AspectRatio {
  if (!width || !height) return '16:9';
  const ratio = width / height;

  if (Math.abs(ratio - 16 / 9) < 0.1 || Math.abs(ratio - 1.777) < 0.1) {
    return '16:9';
  }
  if (Math.abs(ratio - 4 / 3) < 0.1 || Math.abs(ratio - 1.333) < 0.1) {
    return '4:3';
  }
  if (ratio < 0.9) {
    return 'portrait';
  }
  return 'custom';
}

/**
 * Loads a PDF document from an ArrayBuffer or Uint8Array safely without detaching buffers
 */
export async function loadPdfDocument(source: ArrayBuffer | Uint8Array | string): Promise<pdfjsLib.PDFDocumentProxy> {
  let dataParam: Uint8Array | string;

  if (typeof source === 'string') {
    dataParam = source;
  } else if (source instanceof Uint8Array) {
    dataParam = new Uint8Array(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength));
  } else {
    dataParam = new Uint8Array(source.slice(0));
  }

  const loadingTask = pdfjsLib.getDocument(
    typeof dataParam === 'string'
      ? dataParam
      : {
          data: dataParam,
          isEvalSupported: false,
          useSystemFonts: true,
        }
  );

  return await loadingTask.promise;
}

/**
 * Renders a specific PDF page to an HTML5 Canvas with High-DPI support and cancellation safety
 */
export async function renderPdfPageToCanvas(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  options: { scale?: number; fitWidth?: number; fitHeight?: number } = {}
): Promise<{ width: number; height: number; scale: number }> {
  // Cancel previous render on this canvas if still active
  const existingTask = activeRenderTasks.get(canvas);
  if (existingTask) {
    try {
      existingTask.cancel();
    } catch {}
    activeRenderTasks.delete(canvas);
  }

  const page = await doc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });

  let computedScale = options.scale || 1.0;

  if (options.fitWidth && options.fitHeight) {
    const scaleX = options.fitWidth / unscaledViewport.width;
    const scaleY = options.fitHeight / unscaledViewport.height;
    computedScale = Math.min(scaleX, scaleY);
  } else if (options.fitWidth) {
    computedScale = options.fitWidth / unscaledViewport.width;
  } else if (options.fitHeight) {
    computedScale = options.fitHeight / unscaledViewport.height;
  }

  // Device Pixel Ratio for Retina / 4K crisp rendering
  const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
  const viewport = page.getViewport({ scale: computedScale * dpr });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
  canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Clear canvas before render
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  const renderTask = page.render(renderContext);
  activeRenderTasks.set(canvas, renderTask);

  try {
    await renderTask.promise;
    activeRenderTasks.delete(canvas);
  } catch (err: any) {
    activeRenderTasks.delete(canvas);
    if (err?.name === 'RenderingCancelledException') {
      return {
        width: viewport.width / dpr,
        height: viewport.height / dpr,
        scale: computedScale,
      };
    }
    throw err;
  }

  return {
    width: viewport.width / dpr,
    height: viewport.height / dpr,
    scale: computedScale,
  };
}

/**
 * Generates a base64 image thumbnail for a given page
 */
export async function generatePageThumbnail(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number = 1,
  maxWidth: number = 320
): Promise<string> {
  if (typeof document === 'undefined') return '';
  const page = await doc.getPage(pageNumber);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = maxWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = Math.floor(viewport.width);
  offscreenCanvas.height = Math.floor(viewport.height);

  const ctx = offscreenCanvas.getContext('2d');
  if (!ctx) return '';

  await page.render({
    canvasContext: ctx,
    viewport: viewport,
  }).promise;

  return offscreenCanvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Extracts metadata (page count, aspect ratio, dimensions) from a PDF document
 */
export async function extractPdfMetadata(doc: pdfjsLib.PDFDocumentProxy): Promise<{
  totalPages: number;
  aspectRatio: AspectRatio;
  firstPageWidth: number;
  firstPageHeight: number;
}> {
  const totalPages = doc.numPages;
  const firstPage = await doc.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1.0 });
  const aspectRatio = calculateAspectRatio(viewport.width, viewport.height);

  return {
    totalPages,
    aspectRatio,
    firstPageWidth: viewport.width,
    firstPageHeight: viewport.height,
  };
}
