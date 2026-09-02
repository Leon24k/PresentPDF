<script lang="ts">
  import { onMount } from 'svelte';
  import { renderPdfPageToCanvas } from '../services/pdfEngine';
  import type { AspectRatio } from '../types';

  interface Props {
    doc: any;
    pageNumber: number;
    aspectRatio?: AspectRatio;
    maxWidth?: number;
    maxHeight?: number;
  }

  let { doc, pageNumber, aspectRatio = '16:9', maxWidth = 1920, maxHeight = 1080 }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let isLoading = $state<boolean>(true);
  let renderError = $state<string | null>(null);

  // In-memory cache for rendered pages
  const pageCache = new Map<number, string>();

  $effect(() => {
    if (doc && pageNumber && canvasEl) {
      renderSlide();
    }
  });

  async function renderSlide() {
    if (!doc || !canvasEl || pageNumber < 1 || pageNumber > doc.numPages) return;
    isLoading = true;
    renderError = null;

    try {
      await renderPdfPageToCanvas(doc, pageNumber, canvasEl, {
        fitWidth: maxWidth,
        fitHeight: maxHeight,
      });
      isLoading = false;
    } catch (err: any) {
      console.error('Error rendering page:', pageNumber, err);
      renderError = err?.message || 'Failed to render slide';
      isLoading = false;
    }
  }
</script>

<div class="relative w-full h-full flex items-center justify-center overflow-hidden select-none">
  {#if isLoading}
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-dark-card/60 backdrop-blur-sm z-10 animate-fade-in">
      <div class="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      <span class="text-xs text-slate-400 mt-3 font-medium">Rendering Slide {pageNumber}...</span>
    </div>
  {/if}

  {#if renderError}
    <div class="absolute inset-0 flex flex-col items-center justify-center text-rose-400 p-6 text-center z-10">
      <svg class="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="text-sm font-semibold">{renderError}</p>
    </div>
  {/if}

  <canvas
    bind:this={canvasEl}
    class="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-200"
    style="opacity: {isLoading ? 0.3 : 1};"
  ></canvas>
</div>
