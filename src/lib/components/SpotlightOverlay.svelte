<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    isActive: boolean;
    initialRadius?: number;
    onRadiusChange?: (radius: number) => void;
  }

  let { isActive, initialRadius = 140, onRadiusChange }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let mousePos = $state<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
  });
  let radius = $state<number>(140);
  let showHint = $state<boolean>(true);
  let hintTimeout: ReturnType<typeof setTimeout> | null = null;
  let animId: number | null = null;

  function drawSpotlight() {
    if (!canvasEl || !isActive) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const width = canvasEl.width;
    const height = canvasEl.height;

    // Clear whole canvas
    ctx.clearRect(0, 0, width, height);

    // 1. Fill entire screen with modern dark tinted backdrop
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(5, 8, 15, 0.82)';
    ctx.fillRect(0, 0, width, height);

    // 2. Cut out circular aperture with feathered soft edge
    ctx.globalCompositeOperation = 'destination-out';
    const featherRadius = Math.max(10, radius * 0.25);
    const gradient = ctx.createRadialGradient(
      mousePos.x,
      mousePos.y,
      Math.max(0, radius - featherRadius),
      mousePos.x,
      mousePos.y,
      radius
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Draw high-tech subtle luminescent focus ring
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.shadowColor = '#6366F1';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isActive || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    drawSpotlight();
  }

  function handleWheel(e: WheelEvent) {
    if (!isActive) return;
    e.preventDefault();
    // Scroll up increases radius, scroll down decreases
    const delta = e.deltaY < 0 ? 15 : -15;
    const newRadius = Math.max(60, Math.min(350, radius + delta));
    radius = newRadius;
    if (onRadiusChange) onRadiusChange(newRadius);
    drawSpotlight();
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvasEl.parentElement?.clientWidth || window.innerWidth;
    const height = canvasEl.parentElement?.clientHeight || window.innerHeight;
    canvasEl.width = width;
    canvasEl.height = height;
    drawSpotlight();
  }

  $effect(() => {
    if (isActive) {
      showHint = true;
      if (hintTimeout) clearTimeout(hintTimeout);
      hintTimeout = setTimeout(() => {
        showHint = false;
      }, 3500);

      // Trigger initial resize & draw
      setTimeout(() => {
        resizeCanvas();
        drawSpotlight();
      }, 20);
    } else {
      showHint = false;
      if (canvasEl) {
        const ctx = canvasEl.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      }
    }
  });

  onMount(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  });

  onDestroy(() => {
    if (hintTimeout) clearTimeout(hintTimeout);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeCanvas);
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="absolute inset-0 w-full h-full {isActive ? 'pointer-events-auto' : 'pointer-events-none'} z-25">
  <canvas
    bind:this={canvasEl}
    onmousemove={handleMouseMove}
    onwheel={handleWheel}
    class="w-full h-full {isActive ? 'cursor-none' : ''}"
  ></canvas>

  <!-- Instructional Hint Pill (Auto-fades out) -->
  {#if isActive && showHint}
    <div class="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-fade-in">
      <div class="px-4 py-2 rounded-2xl glass-panel text-xs text-slate-300 shadow-2xl flex items-center gap-2 border border-brand-500/30">
        <span class="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
        <span class="font-medium text-white">Spotlight Mode Active</span>
        <span class="text-slate-500">•</span>
        <span class="text-slate-400">Scroll wheel to resize aperture ({radius}px)</span>
        <span class="text-slate-500">•</span>
        <span class="text-slate-400">Press <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-mono font-bold text-white">S</kbd> to exit</span>
      </div>
    </div>
  {/if}
</div>
