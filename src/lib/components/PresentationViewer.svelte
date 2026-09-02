<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Presentation } from '../types';
  import { createPresentationStore } from '../stores/presentationStore.svelte';
  import SlideTransitionWrapper from './SlideTransitionWrapper.svelte';
  import LaserPointer from './LaserPointer.svelte';
  import PenAnnotator from './PenAnnotator.svelte';
  import PresenterHUD from './PresenterHUD.svelte';
  import ThumbnailGrid from './ThumbnailGrid.svelte';
  import ShortcutsModal from './ShortcutsModal.svelte';

  interface Props {
    presentation: Presentation;
    pdfDoc: any;
    onExit: () => void;
  }

  let { presentation, pdfDoc, onExit }: Props = $props();

  const store = createPresentationStore();

  let touchStartX = 0;
  let touchStartY = 0;

  onMount(() => {
    store.init(presentation, pdfDoc);

    const onKeyDown = (e: KeyboardEvent) => store.handleKeydown(e);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
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
  <!-- Top Minimal Floating Header (Fade out with mouse idle) -->
  <div class="absolute top-4 left-4 right-4 flex items-center justify-between z-30 pointer-events-none">
    <div class="flex items-center gap-3 pointer-events-auto">
      <div class="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-slate-300 max-w-xs truncate shadow">
        {presentation.title}
      </div>
    </div>
  </div>

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
