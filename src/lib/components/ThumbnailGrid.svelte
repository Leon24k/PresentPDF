<script lang="ts">
  import { onMount } from 'svelte';
  import { generatePageThumbnail } from '../services/pdfEngine';
  import { X, Grid, Check } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    doc: any;
    totalPages: number;
    currentSlide: number;
    onSelectSlide: (page: number) => void;
    onClose: () => void;
  }

  let {
    isOpen,
    doc,
    totalPages,
    currentSlide,
    onSelectSlide,
    onClose,
  }: Props = $props();

  let thumbnails = $state<Record<number, string>>({});
  let loadingPages = $state<Record<number, boolean>>({});

  $effect(() => {
    if (isOpen && doc && totalPages > 0) {
      loadThumbnails();
    }
  });

  async function loadThumbnails() {
    for (let page = 1; page <= totalPages; page++) {
      if (!thumbnails[page] && !loadingPages[page]) {
        loadingPages[page] = true;
        try {
          const url = await generatePageThumbnail(doc, page, 240);
          thumbnails[page] = url;
        } catch (e) {
          console.error('Error generating thumbnail for page', page, e);
        } finally {
          loadingPages[page] = false;
        }
      }
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 bg-dark-bg/90 backdrop-blur-xl z-50 flex flex-col animate-fade-in p-6 sm:p-10 select-none overflow-y-auto"
    onclick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between max-w-7xl w-full mx-auto mb-8">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <Grid class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-white font-display">Slide Overview</h2>
          <p class="text-xs text-slate-400">Select any slide to jump directly (or press <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">G</kbd> / <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">ESC</kbd> to close)</p>
        </div>
      </div>

      <button
        onclick={onClose}
        class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
        title="Close Grid (ESC)"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Grid of Slides -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 max-w-7xl w-full mx-auto">
      {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          role="button"
          tabindex="0"
          onclick={() => onSelectSlide(page)}
          class="group relative aspect-video rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer text-left bg-dark-card {currentSlide ===
          page
            ? 'ring-2 ring-brand-500 border-brand-500 shadow-lg shadow-brand-500/20 scale-[1.02]'
            : 'border-white/10 hover:border-brand-500/50 hover:scale-[1.02]'}"
        >
          <!-- Thumbnail Image -->
          {#if thumbnails[page]}
            <img
              src={thumbnails[page]}
              alt="Slide {page}"
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full flex flex-col items-center justify-center bg-dark-card text-slate-500">
              <div class="w-5 h-5 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-2"></div>
              <span class="text-[10px]">Page {page}</span>
            </div>
          {/if}

          <!-- Slide Number Badge -->
          <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-dark-bg/80 backdrop-blur-md text-[11px] font-semibold text-slate-200 border border-white/10">
            {page}
          </div>

          <!-- Active Slide Indicator -->
          {#if currentSlide === page}
            <div class="absolute top-2 right-2 p-1 rounded-full bg-brand-500 text-white shadow">
              <Check class="w-3 h-3" />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
