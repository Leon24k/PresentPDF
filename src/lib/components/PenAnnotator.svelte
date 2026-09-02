<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { DrawingStroke, Point } from '../types';
  import { Eraser, RotateCcw, Trash2, Highlighter, Pen } from 'lucide-svelte';

  interface Props {
    isActive: boolean;
    pageNumber: number;
    strokes: DrawingStroke[];
    onAddStroke: (stroke: DrawingStroke) => void;
    onUndo: () => void;
    onClear: () => void;
  }

  let {
    isActive,
    pageNumber,
    strokes,
    onAddStroke,
    onUndo,
    onClear,
  }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let isDrawing = $state<boolean>(false);
  let isHighlighter = $state<boolean>(false);
  let selectedColor = $state<string>('#EF4444');
  let selectedSize = $state<number>(3);
  let currentPoints: Point[] = [];

  const colors = [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#FFFFFF', // White
  ];

  $effect(() => {
    // Redraw whenever strokes or pageNumber changes
    if (canvasEl && pageNumber) {
      redrawAll();
    }
  });

  function startDrawing(e: PointerEvent) {
    if (!isActive || !canvasEl) return;
    isDrawing = true;
    canvasEl.setPointerCapture(e.pointerId);

    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    currentPoints = [{ x, y }];
  }

  function draw(e: PointerEvent) {
    if (!isDrawing || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentPoints.push({ x, y });

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    // Draw active segment
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isHighlighter) {
      ctx.strokeStyle = selectedColor + '44'; // 25% opacity
      ctx.lineWidth = selectedSize * 4;
    } else {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = selectedSize;
    }

    if (currentPoints.length > 1) {
      const prev = currentPoints[currentPoints.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }

  function stopDrawing(e: PointerEvent) {
    if (!isDrawing || !canvasEl) return;
    isDrawing = false;
    canvasEl.releasePointerCapture(e.pointerId);

    if (currentPoints.length > 0) {
      const newStroke: DrawingStroke = {
        id: 'stroke-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        pageNumber,
        color: selectedColor,
        size: isHighlighter ? selectedSize * 4 : selectedSize,
        isHighlighter,
        points: [...currentPoints],
      };
      onAddStroke(newStroke);
      currentPoints = [];
    }
  }

  function redrawAll() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const pageStrokes = strokes.filter((s) => s.pageNumber === pageNumber);

    for (const stroke of pageStrokes) {
      if (stroke.points.length < 2) continue;

      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.isHighlighter) {
        ctx.strokeStyle = stroke.color + '44';
        ctx.lineWidth = stroke.size;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    canvasEl.width = canvasEl.parentElement?.clientWidth || window.innerWidth;
    canvasEl.height = canvasEl.parentElement?.clientHeight || window.innerHeight;
    redrawAll();
  }

  onMount(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeCanvas);
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="absolute inset-0 w-full h-full {isActive ? 'pointer-events-auto' : 'pointer-events-none'} z-25">
  <canvas
    bind:this={canvasEl}
    onpointerdown={startDrawing}
    onpointermove={draw}
    onpointerup={stopDrawing}
    onpointercancel={stopDrawing}
    class="w-full h-full {isActive ? 'cursor-crosshair' : ''}"
  ></canvas>

  <!-- Pen Floating Sub-Toolbar -->
  {#if isActive}
    <div
      class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-2xl glass-panel text-white shadow-2xl z-40 animate-fade-in"
    >
      <!-- Mode Toggle: Pen vs Highlighter -->
      <button
        onclick={() => (isHighlighter = false)}
        class="p-1.5 rounded-lg transition-colors {!isHighlighter
          ? 'bg-brand-500 text-white shadow'
          : 'text-slate-400 hover:text-white'}"
        title="Fine Pen"
      >
        <Pen class="w-4 h-4" />
      </button>
      <button
        onclick={() => (isHighlighter = true)}
        class="p-1.5 rounded-lg transition-colors {isHighlighter
          ? 'bg-brand-500 text-white shadow'
          : 'text-slate-400 hover:text-white'}"
        title="Highlighter"
      >
        <Highlighter class="w-4 h-4" />
      </button>

      <div class="h-4 w-px bg-white/10 mx-1"></div>

      <!-- Colors -->
      <div class="flex items-center gap-1.5">
        {#each colors as color}
          <button
            onclick={() => (selectedColor = color)}
            title="Select {color} color"
            aria-label="Color {color}"
            class="w-5 h-5 rounded-full transition-transform hover:scale-110 {selectedColor ===
            color
              ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-bg scale-110'
              : ''}"
            style="background-color: {color};"
          ></button>
        {/each}
      </div>

      <div class="h-4 w-px bg-white/10 mx-1"></div>

      <!-- Undo / Clear -->
      <button
        onclick={onUndo}
        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Undo Stroke"
      >
        <RotateCcw class="w-4 h-4" />
      </button>
      <button
        onclick={onClear}
        class="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        title="Clear Page Annotations"
      >
        <Trash2 class="w-4 h-4" />
      </button>
    </div>
  {/if}
</div>
