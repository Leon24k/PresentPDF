<script lang="ts">
  import {
    loadPdfDocument,
    extractPdfMetadata,
    generatePageThumbnail,
  } from '../services/pdfEngine';
  import { generateSamplePdfBuffer } from '../services/samplePdf';
  import type { Presentation } from '../types';
  import {
    Upload,
    FileText,
    Sparkles,
    Shield,
    Clock,
    Zap,
    Play,
    CheckCircle2,
    Layers,
  } from 'lucide-svelte';

  interface Props {
    onPresentationLoaded: (pres: Presentation, doc: any) => void;
  }

  let { onPresentationLoaded }: Props = $props();

  let isDragging = $state<boolean>(false);
  let isProcessing = $state<boolean>(false);
  let statusMessage = $state<string>('');
  let errorMessage = $state<string | null>(null);
  let fileInputEl = $state<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      errorMessage = 'Please select a valid PDF file.';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      errorMessage = 'File size exceeds 100 MB limit.';
      return;
    }

    isProcessing = true;
    errorMessage = null;
    statusMessage = 'Reading PDF buffer...';

    try {
      const buffer = await file.arrayBuffer();
      await processPdfBuffer(buffer, file.name, file.size);
    } catch (err: any) {
      console.error('Error processing PDF:', err);
      errorMessage = err?.message || 'Failed to parse PDF document.';
      isProcessing = false;
    }
  }

  async function loadSamplePresentation() {
    isProcessing = true;
    errorMessage = null;
    statusMessage = 'Generating Demo Slides...';

    try {
      const buffer = generateSamplePdfBuffer();
      await processPdfBuffer(buffer, 'PresentPDF Demo Showcase.pdf', buffer.byteLength);
    } catch (err: any) {
      console.error('Error loading sample:', err);
      errorMessage = err?.message || 'Failed to load demo presentation.';
      isProcessing = false;
    }
  }

  async function processPdfBuffer(buffer: ArrayBuffer, title: string, fileSize: number) {
    statusMessage = 'Parsing PDF slides...';
    const presentationBuffer = buffer.slice(0);
    const doc = await loadPdfDocument(buffer.slice(0));

    statusMessage = 'Extracting slide metadata...';
    const meta = await extractPdfMetadata(doc);

    statusMessage = 'Generating slide preview...';
    const thumbnailUrl = await generatePageThumbnail(doc, 1, 320);

    const now = Date.now();
    const presentation: Presentation = {
      id: 'pres-' + now + '-' + Math.random().toString(36).substring(2, 7),
      title: title.replace(/\.pdf$/i, ''),
      fileSize,
      totalPages: meta.totalPages,
      aspectRatio: meta.aspectRatio,
      data: presentationBuffer,
      thumbnailUrl,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24-hour expiration
    };

    isProcessing = false;
    onPresentationLoaded(presentation, doc);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    handleFiles(e.dataTransfer?.files || null);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }
</script>

<div class="max-w-4xl w-full mx-auto px-4 py-8">
  <!-- Hero Header -->
  <div class="text-center mb-10 space-y-4">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide uppercase shadow-sm">
      <Sparkles class="w-3.5 h-3.5 text-brand-400 animate-pulse" />
      <span>Next-Gen PDF Presentation Platform</span>
    </div>

    <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
      Present Your PDF with <br />
      <span class="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
        Cinematic 3D Slide Animations
      </span>
    </h1>

    <p class="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
      Easily present PDF slides exported from <strong>Canva</strong>, <strong>Gamma AI</strong>, <strong>Tome</strong>, or <strong>PowerPoint</strong>.
      Enjoy 3D transitions, laser pointer, and automatic 24-hour file cleanup.
    </p>

    <!-- Source Compatibility Tags -->
    <div class="flex flex-wrap items-center justify-center gap-2 pt-2">
      {#each ['Canva Export', 'Gamma AI', 'Google Slides', 'PowerPoint', 'Figma', 'Keynote'] as tool}
        <span class="px-2.5 py-1 rounded-lg bg-dark-card border border-white/5 text-xs text-slate-400 font-medium">
          {tool}
        </span>
      {/each}
    </div>
  </div>

  <!-- Drag & Drop Uploader Area -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    role="region"
    aria-label="PDF Presentation Uploader"
    ondrop={handleDrop}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    class="relative rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 border-2 border-dashed {isDragging
      ? 'border-brand-400 bg-brand-500/10 shadow-2xl shadow-brand-500/20 scale-[1.01]'
      : 'border-white/15 hover:border-brand-500/50 bg-dark-card/50 glass-panel'} overflow-hidden"
  >
    <!-- Background Ambient Glow -->
    <div class="absolute -top-24 -left-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <input
      type="file"
      accept="application/pdf"
      bind:this={fileInputEl}
      onchange={(e) => handleFiles(e.currentTarget.files)}
      class="hidden"
    />

    {#if isProcessing}
      <div class="py-12 flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <div class="relative w-16 h-16">
          <div class="w-16 h-16 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <Layers class="w-6 h-6 text-brand-400 animate-pulse" />
          </div>
        </div>
        <p class="text-base font-semibold text-white font-display">{statusMessage}</p>
        <p class="text-xs text-slate-400">Rendering high-resolution vector canvases...</p>
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center space-y-5">
        <div class="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 shadow-inner group-hover:scale-110 transition-transform">
          <Upload class="w-8 h-8" />
        </div>

        <div class="space-y-1.5">
          <h3 class="text-xl font-bold text-white font-display">
            Drag and drop your PDF presentation here
          </h3>
          <p class="text-sm text-slate-400">
            or <button onclick={() => fileInputEl?.click()} class="text-brand-400 hover:text-brand-300 font-semibold underline underline-offset-4">browse from computer</button>
          </p>
        </div>

        <!-- Limits and Security Info -->
        <div class="flex items-center gap-4 text-xs text-slate-500 pt-2">
          <span class="flex items-center gap-1">
            <FileText class="w-3.5 h-3.5" /> Up to 100 MB
          </span>
          <span>•</span>
          <span class="flex items-center gap-1">
            <Clock class="w-3.5 h-3.5 text-emerald-400" /> Auto-purged in 24 Hours
          </span>
          <span>•</span>
          <span class="flex items-center gap-1">
            <Shield class="w-3.5 h-3.5 text-indigo-400" /> 100% Private Client Mode
          </span>
        </div>

        <!-- Sample Deck Demo Button -->
        <div class="pt-4 border-t border-white/10 w-full max-w-sm flex items-center justify-center">
          <button
            onclick={loadSamplePresentation}
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow hover:shadow-brand-500/10"
          >
            <Play class="w-3.5 h-3.5 text-brand-400" />
            <span>Try with Instant Sample Presentation</span>
          </button>
        </div>
      </div>
    {/if}

    {#if errorMessage}
      <div class="mt-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
        {errorMessage}
      </div>
    {/if}
  </div>

  <!-- Feature Highlights Grid -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
    <div class="p-5 rounded-2xl bg-dark-card/40 border border-white/5 space-y-2">
      <div class="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 mb-3">
        <Zap class="w-4 h-4" />
      </div>
      <h4 class="text-sm font-bold text-white font-display">6 Hardware-Accelerated 3D Transitions</h4>
      <p class="text-xs text-slate-400 leading-relaxed">
        3D Cube rotation, Keynote Zoom, Smooth Slide, 3D Card Flip, Convex, and Fade effects running at smooth 60–120 FPS.
      </p>
    </div>

    <div class="p-5 rounded-2xl bg-dark-card/40 border border-white/5 space-y-2">
      <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
        <Clock class="w-4 h-4" />
      </div>
      <h4 class="text-sm font-bold text-white font-display">24-Hour Ephemeral Auto-Cleanup</h4>
      <p class="text-xs text-slate-400 leading-relaxed">
        Files are automatically pruned from memory and storage after 24 hours. Zero risk of disk overflow on free hosting.
      </p>
    </div>

    <div class="p-5 rounded-2xl bg-dark-card/40 border border-white/5 space-y-2">
      <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
        <Sparkles class="w-4 h-4" />
      </div>
      <h4 class="text-sm font-bold text-white font-display">Professional Presenter Toolkit</h4>
      <p class="text-xs text-slate-400 leading-relaxed">
        Virtual glowing laser pointer, live pen annotation, thumbnail overview grid (`G`), stopwatch timer, and blackout screen.
      </p>
    </div>
  </div>
</div>
