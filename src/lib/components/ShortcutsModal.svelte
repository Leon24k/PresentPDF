<script lang="ts">
  import { X, Command } from 'lucide-svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  const shortcuts = [
    { key: '→ / ↓ / Space', desc: 'Next slide' },
    { key: '← / ↑ / Backspace', desc: 'Previous slide' },
    { key: 'G', desc: 'Toggle Slide Grid Overview' },
    { key: 'L', desc: 'Toggle Virtual Laser Pointer' },
    { key: 'S', desc: 'Toggle Spotlight Focus Mode (Scroll to resize)' },
    { key: 'A / P', desc: 'Toggle Drawing Pen / Annotator' },
    { key: 'B / .', desc: 'Blackout screen (Focus attention)' },
    { key: 'W / ,', desc: 'Whiteout screen' },
    { key: 'Alt + P', desc: 'Dual-Screen Presenter View (Canva-style)' },
    { key: 'F', desc: 'Toggle Fullscreen Mode' },
    { key: 'H', desc: 'Toggle / Hide Toolbars (Zen Mode)' },
    { key: 'Home / End', desc: 'Jump to First / Last slide' },
    { key: '?', desc: 'Open this Shortcuts Guide' },
    { key: 'ESC', desc: 'Exit presentation / Close overlay' },
  ];
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 bg-dark-bg/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in select-none"
    onclick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
  >
    <div class="max-w-md w-full rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 animate-scale-in">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            <Command class="w-4 h-4" />
          </div>
          <h3 class="text-lg font-bold text-white font-display">Keyboard Shortcuts</h3>
        </div>
        <button
          onclick={onClose}
          class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {#each shortcuts as item}
          <div class="flex items-center justify-between py-1.5 px-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm">
            <span class="text-slate-300">{item.desc}</span>
            <kbd class="px-2 py-0.5 rounded-lg bg-dark-card border border-white/10 text-xs font-mono text-brand-300 font-semibold shadow">
              {item.key}
            </kbd>
          </div>
        {/each}
      </div>

      <div class="mt-6 pt-4 border-t border-white/10 text-center">
        <p class="text-xs text-slate-400">
          Tip: Move your mouse anywhere to reveal the presentation toolbar dock.
        </p>
      </div>
    </div>
  </div>
{/if}
