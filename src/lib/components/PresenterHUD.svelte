<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { formatElapsedSeconds } from './timeHelper';
  import type { TransitionStyle } from '../types';
  import {
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    RotateCcw,
    Layers,
    Crosshair,
    PenTool,
    Grid,
    EyeOff,
    Maximize,
    Minimize,
    HelpCircle,
    ArrowLeft,
    Sparkles,
  } from 'lucide-svelte';

  interface Props {
    currentSlide: number;
    totalSlides: number;
    transitionStyle: TransitionStyle;
    isLaserActive: boolean;
    isPenActive: boolean;
    isBlackout: boolean;
    isFullscreen: boolean;
    isAutoPlaying: boolean;
    elapsedSeconds: number;
    isTimerRunning: boolean;
    onPrev: () => void;
    onNext: () => void;
    onSetTransition: (style: TransitionStyle) => void;
    onToggleLaser: () => void;
    onTogglePen: () => void;
    onToggleBlackout: () => void;
    onToggleGrid: () => void;
    onToggleFullscreen: () => void;
    onToggleAutoPlay: () => void;
    onToggleShortcuts: () => void;
    onStartTimer: () => void;
    onStopTimer: () => void;
    onResetTimer: () => void;
    onExit: () => void;
  }

  let {
    currentSlide,
    totalSlides,
    transitionStyle,
    isLaserActive,
    isPenActive,
    isBlackout,
    isFullscreen,
    isAutoPlaying,
    elapsedSeconds,
    isTimerRunning,
    onPrev,
    onNext,
    onSetTransition,
    onToggleLaser,
    onTogglePen,
    onToggleBlackout,
    onToggleGrid,
    onToggleFullscreen,
    onToggleAutoPlay,
    onToggleShortcuts,
    onStartTimer,
    onStopTimer,
    onResetTimer,
    onExit,
  }: Props = $props();

  let isVisible = $state<boolean>(true);
  let isTransitionDropdownOpen = $state<boolean>(false);
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const transitions: Array<{ id: TransitionStyle; label: string; icon: string }> = [
    { id: 'cube', label: '3D Cube', icon: '🎲' },
    { id: 'zoom', label: 'Keynote Zoom', icon: '🔍' },
    { id: 'slide', label: 'Smooth Slide', icon: '↔️' },
    { id: 'flip', label: '3D Card Flip', icon: '🃏' },
    { id: 'convex', label: 'Convex 3D', icon: '🌐' },
    { id: 'fade', label: 'Minimalist Fade', icon: '✨' },
  ];

  function handleUserActivity() {
    isVisible = true;
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (!isTransitionDropdownOpen) {
        isVisible = false;
      }
    }, 3500);
  }

  onMount(() => {
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    handleUserActivity();
  });

  onDestroy(() => {
    if (hideTimeout) clearTimeout(hideTimeout);
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    }
  });
</script>

<!-- Floating Presenter HUD Toolbar -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 transform select-none {isVisible
    ? 'translate-y-0 opacity-100'
    : 'translate-y-16 opacity-0 pointer-events-none'}"
  onmouseenter={() => (isVisible = true)}
>
  <div class="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-2xl glass-panel text-white shadow-2xl border border-white/10">
    <!-- Back to Dashboard -->
    <button
      onclick={onExit}
      class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      title="Exit Presentation"
    >
      <ArrowLeft class="w-4 h-4" />
    </button>

    <div class="h-5 w-px bg-white/10 mx-0.5"></div>

    <!-- Slide Navigation (Prev / Counter / Next) -->
    <button
      onclick={onPrev}
      disabled={currentSlide <= 1}
      class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      title="Previous Slide (← / PageUp)"
    >
      <ChevronLeft class="w-4 h-4" />
    </button>

    <button
      onclick={onToggleGrid}
      class="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold tracking-wider text-slate-200 transition-colors flex items-center gap-1.5"
      title="Slide Grid Overview (G)"
    >
      <span>{currentSlide}</span>
      <span class="text-slate-500">/</span>
      <span class="text-slate-400">{totalSlides}</span>
    </button>

    <button
      onclick={onNext}
      disabled={currentSlide >= totalSlides}
      class="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      title="Next Slide (→ / Space / Enter)"
    >
      <ChevronRight class="w-4 h-4" />
    </button>

    <div class="h-5 w-px bg-white/10 mx-0.5"></div>

    <!-- Timer Widget -->
    <div class="flex items-center gap-1 px-2 py-1 rounded-xl bg-dark-card/80 border border-white/5 text-xs font-mono text-slate-300">
      <span>{formatElapsedSeconds(elapsedSeconds)}</span>
      <button
        onclick={isTimerRunning ? onStopTimer : onStartTimer}
        class="p-1 rounded text-slate-400 hover:text-white transition-colors"
        title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
      >
        {#if isTimerRunning}
          <Pause class="w-3 h-3 text-amber-400" />
        {:else}
          <Play class="w-3 h-3 text-emerald-400" />
        {/if}
      </button>
    </div>

    <div class="h-5 w-px bg-white/10 mx-0.5"></div>

    <!-- Transition Style Selector -->
    <div class="relative">
      <button
        onclick={() => (isTransitionDropdownOpen = !isTransitionDropdownOpen)}
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-brand-300 hover:text-white transition-colors"
        title="Change 3D Slide Transition Style"
      >
        <Sparkles class="w-3.5 h-3.5 text-brand-400" />
        <span class="hidden sm:inline capitalize">{transitionStyle}</span>
      </button>

      {#if isTransitionDropdownOpen}
        <div
          class="absolute bottom-full mb-3 left-0 w-44 rounded-2xl glass-panel p-1.5 shadow-2xl border border-white/15 animate-scale-in z-50 flex flex-col gap-1"
        >
          <div class="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Slide Transition
          </div>
          {#each transitions as t}
            <button
              onclick={() => {
                onSetTransition(t.id);
                isTransitionDropdownOpen = false;
              }}
              class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors {transitionStyle ===
              t.id
                ? 'bg-brand-500 text-white font-semibold'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'}"
            >
              <span class="flex items-center gap-2">
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Laser Pointer Tool -->
    <button
      onclick={onToggleLaser}
      class="p-2 rounded-xl transition-all duration-200 {isLaserActive
        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg shadow-rose-500/30'
        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
      title="Toggle Virtual Laser Pointer (L)"
    >
      <Crosshair class="w-4 h-4" />
    </button>

    <!-- Pen Annotator Tool -->
    <button
      onclick={onTogglePen}
      class="p-2 rounded-xl transition-all duration-200 {isPenActive
        ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50 shadow-lg shadow-brand-500/30'
        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
      title="Toggle Pen Annotator (A / P)"
    >
      <PenTool class="w-4 h-4" />
    </button>

    <!-- Blackout Screen Tool -->
    <button
      onclick={onToggleBlackout}
      class="p-2 rounded-xl transition-colors {isBlackout
        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
      title="Blackout Screen (B)"
    >
      <EyeOff class="w-4 h-4" />
    </button>

    <!-- Autoplay Slideshow -->
    <button
      onclick={onToggleAutoPlay}
      class="p-2 rounded-xl transition-colors {isAutoPlaying
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
        : 'text-slate-400 hover:text-white hover:bg-white/10'}"
      title={isAutoPlaying ? 'Stop Auto-Play' : 'Start Auto-Play (5s / slide)'}
    >
      <Play class="w-4 h-4" />
    </button>

    <!-- Shortcuts Dialog -->
    <button
      onclick={onToggleShortcuts}
      class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      title="Keyboard Shortcuts (?)"
    >
      <HelpCircle class="w-4 h-4" />
    </button>

    <!-- Fullscreen Toggle -->
    <button
      onclick={onToggleFullscreen}
      class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      title="Toggle Fullscreen (F)"
    >
      {#if isFullscreen}
        <Minimize class="w-4 h-4" />
      {:else}
        <Maximize class="w-4 h-4" />
      {/if}
    </button>
  </div>
</div>
