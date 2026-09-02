<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { formatTimeRemaining } from './timeHelper';
  import { Clock, ShieldAlert } from 'lucide-svelte';

  interface Props {
    expiresAt: number;
    className?: string;
  }

  let { expiresAt, className = '' }: Props = $props();

  let timeString = $state<string>(formatTimeRemaining(expiresAt));
  let isExpired = $state<boolean>(Date.now() >= expiresAt);
  let interval: ReturnType<typeof setInterval> | null = null;

  onMount(() => {
    interval = setInterval(() => {
      timeString = formatTimeRemaining(expiresAt);
      isExpired = Date.now() >= expiresAt;
    }, 1000);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<div
  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md border transition-colors {isExpired
    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'} {className}"
  title="All uploaded PDF files are automatically deleted after 24 hours to preserve free storage"
>
  {#if isExpired}
    <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
    <span>Expired</span>
  {:else}
    <Clock class="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
    <span>Expires in: <strong>{timeString}</strong></span>
  {/if}
</div>
