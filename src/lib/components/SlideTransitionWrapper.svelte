<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getTransitionClass } from './transitionHelper';
  import SlideCanvas from './SlideCanvas.svelte';
  import type { TransitionStyle, AspectRatio } from '../types';

  interface Props {
    doc: any;
    currentSlide: number;
    transitionStyle: TransitionStyle;
    transitionDirection: 'next' | 'prev';
    aspectRatio?: AspectRatio;
    maxWidth?: number;
    maxHeight?: number;
  }

  let {
    doc,
    currentSlide,
    transitionStyle,
    transitionDirection,
    aspectRatio = '16:9',
    maxWidth = 1920,
    maxHeight = 1080,
  }: Props = $props();

  let displayedSlide = $state<number>(1);
  let outgoingSlide = $state<number | null>(null);
  let isTransitioning = $state<boolean>(false);
  let transitionTimer: ReturnType<typeof setTimeout> | null = null;
  let isInitial = true;

  $effect(() => {
    if (isInitial) {
      displayedSlide = currentSlide;
      isInitial = false;
      return;
    }

    if (currentSlide !== displayedSlide) {
      if (transitionTimer) clearTimeout(transitionTimer);
      outgoingSlide = displayedSlide;
      displayedSlide = currentSlide;
      isTransitioning = true;

      transitionTimer = setTimeout(() => {
        isTransitioning = false;
        outgoingSlide = null;
      }, 650);
    }
  });

  onDestroy(() => {
    if (transitionTimer) clearTimeout(transitionTimer);
  });
</script>

<div class="relative w-full h-full perspective-container flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
  <!-- Outgoing Slide Layer (Only during transition) -->
  {#if isTransitioning && outgoingSlide !== null}
    <div
      class="absolute inset-0 flex items-center justify-center pointer-events-none {getTransitionClass(
        transitionStyle,
        transitionDirection,
        'out'
      )}"
    >
      <SlideCanvas
        {doc}
        pageNumber={outgoingSlide}
        {aspectRatio}
        {maxWidth}
        {maxHeight}
      />
    </div>
  {/if}

  <!-- Current / Incoming Slide Layer -->
  <div
    class="relative w-full h-full flex items-center justify-center {isTransitioning
      ? getTransitionClass(transitionStyle, transitionDirection, 'in')
      : ''}"
  >
    <SlideCanvas
      {doc}
      pageNumber={displayedSlide}
      {aspectRatio}
      {maxWidth}
      {maxHeight}
    />
  </div>
</div>
