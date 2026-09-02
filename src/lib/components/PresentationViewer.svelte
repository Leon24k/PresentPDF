<script lang="ts">
  import { onMount } from 'svelte';
  import type { Presentation } from '../types';
  import { createPresentationStore } from '../stores/presentationStore.svelte';
  import SlideTransitionWrapper from './SlideTransitionWrapper.svelte';
  import LaserPointer from './LaserPointer.svelte';
  import PenAnnotator from './PenAnnotator.svelte';
  import PresenterHUD from './PresenterHUD.svelte';
  import ThumbnailGrid from './ThumbnailGrid.svelte';
  import ShortcutsModal from './ShortcutsModal.svelte';
  import { ArrowLeft, ChevronUp, ChevronDown } from 'lucide-svelte';

  interface Props {
    presentation: Presentation;
    pdfDoc: any;
    onExit: () => void;
  }

  let { presentation, pdfDoc, onExit }: Props = $props();

  const store = createPresentationStore();

  let isTopBarPinned = $state<boolean>(true);
  let isMouseActive = $state<boolean>(true);
  let mouseIdleTimeout: ReturnType<typeof setTimeout> | null = null;
  let touchStartX = 0;
  let touchStartY = 0;

  function handleUserActivity() {
    isMouseActive = true;
    if (mouseIdleTimeout) clearTimeout(mouseIdleTimeout);
    mouseIdleTimeout = setTimeout(() => {
      isMouseActive = false;
    }, 3500);
  }

  onMount(() => {
    store.init(presentation, pdfDoc);

    const onKeyDown = (e: KeyboardEvent) => {
      handleUserActivity();

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      // 'H' toggles the top header bar
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        isTopBarPinned = !isTopBarPinned;
        return;
      }

      if (e.key === 'Escape') {
        if (store.isGridOpen) {
          store.isGridOpen = false;
        } else if (store.isShortcutsOpen) {
          store.toggleShortcuts();
        } else if (store.isBlackout) {
          store.toggleBlackout();
        } else if (store.isWhiteout) {
          store.toggleWhiteout();
        } else if (store.isLaserActive) {
          store.toggleLaser();
        } else if (store.isPenActive) {
          store.togglePen();
        } else {
          // ESC exits presentation back to dashboard!
          onExit();
        }
        return;
      }

      store.handleKeydown(e);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', handleUserActivity);
    handleUserActivity();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', handleUserActivity);
      if (mouseIdleTimeout) clearTimeout(mouseIdleTimeout);
      store.stopTimer();
    };
  });

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;

      // Check if it's primarily a horizontal swipe (> 50px)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          store.nextSlide();
        } else {
          store.prevSlide();
        }
      }
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 w-screen h-screen bg-dark-bg text-slate-100 flex flex-col justify-between overflow-hidden select-none"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <!-- Top Floating Header Bar -->
  <div
    class="absolute top-4 left-4 right-4 flex items-center justify-between z-30 transition-all duration-300 transform {isTopBarPinned && isMouseActive
      ? 'translate-y-0 opacity-100'
      : '-translate-y-16 opacity-0 pointer-events-none'}"
  >
    <div class="flex items-center gap-2 pointer-events-auto">
      <button
        onclick={onExit}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow"
        title="Exit Presentation (ESC)"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Exit (ESC)</span>
      </button>

      <div class="px-3 py-1.5 rounded-xl glass-pill text-xs font-medium text-slate-400 max-w-xs truncate shadow hidden sm:block">
        {presentation.title}
      </div>

      <!-- Hide Topbar Button -->
      <button
        onclick={() => (isTopBarPinned = false)}
        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-colors shadow"
        title="Hide Top Bar (H)"
      >
        <ChevronUp class="w-3.5 h-3.5" />
        <span class="hidden md:inline">Hide Header</span>
      </button>
    </div>
  </div>

  <!-- Unhide Button (Revealed when topbar is hidden) -->
  {#if !isTopBarPinned}
    <div class="absolute top-3 left-4 z-30 animate-fade-in pointer-events-auto">
      <button
        onclick={() => (isTopBarPinned = true)}
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-lg hover:scale-105"
        title="Show Top Bar (H)"
      >
        <ChevronDown class="w-3.5 h-3.5 text-brand-400" />
        <span>Show Header (H)</span>
      </button>
    </div>
  {/if}

  <!-- Main Slide Presentation Stage -->
  <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
    {#if store.pdfDoc}
      <SlideTransitionWrapper
        doc={store.pdfDoc}
        currentSlide={store.currentSlide}
        transitionStyle={store.transitionStyle}
        transitionDirection={store.transitionDirection}
        aspectRatio={presentation.aspectRatio}
      />
    {/if}

    <!-- Laser Pointer Canvas Overlay -->
    <LaserPointer isActive={store.isLaserActive} />

    <!-- Pen Annotation Canvas Overlay -->
    <PenAnnotator
      isActive={store.isPenActive}
      pageNumber={store.currentSlide}
      strokes={store.drawingStrokes}
      onAddStroke={(s) => store.addStroke(s)}
      onUndo={() => store.undoStroke()}
      onClear={() => store.clearCurrentSlideStrokes()}
    />

    <!-- Blackout Focus Overlay Screen (B) -->
    {#if store.isBlackout}
      <div class="absolute inset-0 bg-black z-40 flex items-center justify-center animate-fade-in">
        <span class="text-xs text-slate-700 tracking-widest uppercase">Screen Blackout (Press B or . to restore)</span>
      </div>
    {/if}

    <!-- Whiteout Focus Overlay Screen (W) -->
    {#if store.isWhiteout}
      <div class="absolute inset-0 bg-white z-40 flex items-center justify-center animate-fade-in">
        <span class="text-xs text-slate-300 tracking-widest uppercase">Screen Whiteout (Press W or , to restore)</span>
      </div>
    {/if}
  </div>

  <!-- Bottom Floating Presenter HUD Toolbar -->
  <PresenterHUD
    currentSlide={store.currentSlide}
    totalSlides={store.totalSlides}
    transitionStyle={store.transitionStyle}
    isLaserActive={store.isLaserActive}
    isPenActive={store.isPenActive}
    isBlackout={store.isBlackout}
    isFullscreen={store.isFullscreen}
    isAutoPlaying={store.isAutoPlaying}
    elapsedSeconds={store.elapsedSeconds}
    isTimerRunning={store.isTimerRunning}
    onPrev={() => store.prevSlide()}
    onNext={() => store.nextSlide()}
    onSetTransition={(style) => store.setTransition(style)}
    onToggleLaser={() => store.toggleLaser()}
    onTogglePen={() => store.togglePen()}
    onToggleBlackout={() => store.toggleBlackout()}
    onToggleGrid={() => store.toggleGrid()}
    onToggleFullscreen={() => store.toggleFullscreen()}
    onToggleAutoPlay={() => store.toggleAutoPlay(5)}
    onToggleShortcuts={() => store.toggleShortcuts()}
    onStartTimer={() => store.startTimer()}
    onStopTimer={() => store.stopTimer()}
    onResetTimer={() => store.resetTimer()}
    onExit={onExit}
  />

  <!-- Slide Grid Overview Drawer (G) -->
  <ThumbnailGrid
    isOpen={store.isGridOpen}
    doc={store.pdfDoc}
    totalPages={store.totalSlides}
    currentSlide={store.currentSlide}
    onSelectSlide={(page) => store.goToSlide(page)}
    onClose={() => (store.isGridOpen = false)}
  />

  <!-- Keyboard Shortcuts Modal (?) -->
  <ShortcutsModal
    isOpen={store.isShortcutsOpen}
    onClose={() => store.toggleShortcuts()}
  />
</div>
