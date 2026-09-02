<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    isActive: boolean;
    color?: string; // default red #EF4444 or neon green #22C55E
  }

  let { isActive, color = '#EF4444' }: Props = $props();

  let canvasEl = $state<HTMLCanvasElement | null>(null);
  let mousePos = $state<{ x: number; y: number } | null>(null);
  let trail: Array<{ x: number; y: number; alpha: number; radius: number }> = [];
  let animId: number | null = null;

  function handleMouseMove(e: MouseEvent) {
    if (!isActive || !canvasEl) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePos = { x, y };

    // Add trailing particles
    trail.push({
      x,
      y,
      alpha: 1.0,
      radius: 6,
    });
  }

  function handleMouseLeave() {
    mousePos = null;
  }

  function renderLoop() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    if (isActive && mousePos) {
      // Draw trails
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.alpha -= 0.08;
        p.radius = Math.max(1, p.radius - 0.2);

        if (p.alpha <= 0) {
          trail.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha * 0.5})`;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      // Draw Main Laser Glow Aura
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;

      // Outer glow
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.fill();

      // Middle bright core
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Center white-hot spark
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.restore();
    } else {
      trail = [];
    }

    animId = requestAnimationFrame(renderLoop);
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    canvasEl.width = canvasEl.parentElement?.clientWidth || window.innerWidth;
    canvasEl.height = canvasEl.parentElement?.clientHeight || window.innerHeight;
  }

  onMount(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animId = requestAnimationFrame(renderLoop);
  });

  onDestroy(() => {
    if (animId) cancelAnimationFrame(animId);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeCanvas);
    }
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<canvas
  bind:this={canvasEl}
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
  class="absolute inset-0 w-full h-full z-30 pointer-events-auto {isActive
    ? 'cursor-none'
    : 'pointer-events-none'}"
></canvas>
