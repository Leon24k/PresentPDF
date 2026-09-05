<script lang="ts">
  import { onMount } from 'svelte';
  import type { Presentation } from './lib/types';
  import {
    savePresentationToLocal,
    getPresentationFromLocal,
    listLocalPresentations,
    deleteLocalPresentation,
    purgeExpiredPresentations,
  } from './lib/services/localDb';
  import { loadPdfDocument } from './lib/services/pdfEngine';
  import { createShareableLink } from './lib/services/cloudStorage';
  import Dropzone from './lib/components/Dropzone.svelte';
  import PresentationViewer from './lib/components/PresentationViewer.svelte';
  import PresenterConsole from './lib/components/PresenterConsole.svelte';
  import ExpirationBadge from './lib/components/ExpirationBadge.svelte';
  import {
    Play,
    Trash2,
    Share2,
    Clock,
    FileText,
    Sparkles,
    Github,
    Layers,
    Check,
  } from 'lucide-svelte';

  let activePresentation = $state<Presentation | null>(null);
  let activePdfDoc = $state<any>(null);
  let isPresenterMode = $state<boolean>(false);
  let recentPresentations = $state<Presentation[]>([]);
  let copiedId = $state<string | null>(null);

  async function checkUrlHash() {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.startsWith('#presenter=')) {
      const presId = hash.replace('#presenter=', '');
      const item = await getPresentationFromLocal(presId);
      if (item) {
        await resumePresentation(item, true);
      }
    } else if (hash.startsWith('#pres=')) {
      const presId = hash.replace('#pres=', '');
      const item = await getPresentationFromLocal(presId);
      if (item) {
        await resumePresentation(item, false);
      }
    }
  }

  onMount(async () => {
    // Purge expired presentations older than 24h
    await purgeExpiredPresentations();
    await refreshRecentList();

    // Deep-link support: auto-resume presentation if #pres=ID or #presenter=ID exists in URL
    await checkUrlHash();

    const onHashChange = async () => {
      await checkUrlHash();
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  });

  async function refreshRecentList() {
    recentPresentations = await listLocalPresentations();
  }

  async function handlePresentationLoaded(pres: Presentation, doc: any) {
    activePresentation = pres;
    activePdfDoc = doc;
    isPresenterMode = false;
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', `#pres=${pres.id}`);
    }
    try {
      await savePresentationToLocal(pres);
      await refreshRecentList();
    } catch (err) {
      console.warn('Could not save to local IndexedDB:', err);
    }
  }

  async function resumePresentation(pres: Presentation, asPresenter = false) {
    if (!pres.data) return;
    try {
      const doc = await loadPdfDocument(pres.data);
      activePresentation = pres;
      activePdfDoc = doc;
      isPresenterMode = asPresenter;
      if (typeof window !== 'undefined') {
        const hashTag = asPresenter ? `#presenter=${pres.id}` : `#pres=${pres.id}`;
        history.replaceState(null, '', hashTag);
      }
    } catch (e) {
      console.error('Error reloading presentation document', e);
    }
  }

  function handleExitPresentation() {
    activePresentation = null;
    activePdfDoc = null;
    isPresenterMode = false;
    if (typeof window !== 'undefined' && window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
    refreshRecentList();
  }

  async function handleDelete(id: string, e: MouseEvent) {
    e.stopPropagation();
    await deleteLocalPresentation(id);
    await refreshRecentList();
  }

  async function handleShare(pres: Presentation, e: MouseEvent) {
    e.stopPropagation();
    const result = await createShareableLink(pres);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(result.url);
      copiedId = pres.id;
      setTimeout(() => {
        copiedId = null;
      }, 2500);
    }
  }
</script>

{#if activePresentation && activePdfDoc}
  {#if isPresenterMode}
    <PresenterConsole
      presentation={activePresentation}
      pdfDoc={activePdfDoc}
      onExit={handleExitPresentation}
    />
  {:else}
    <PresentationViewer
      presentation={activePresentation}
      pdfDoc={activePdfDoc}
      onExit={handleExitPresentation}
    />
  {/if}
{:else}
  <div class="min-h-screen flex flex-col justify-between bg-dark-bg text-slate-100 selection:bg-brand-500 selection:text-white">
    <!-- Navbar Header -->
    <header class="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-bg/80 backdrop-blur-xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 border border-white/20">
            <Layers class="w-5 h-5 text-white" />
          </div>
          <div>
            <span class="text-lg font-bold tracking-tight text-white font-display">Present<span class="text-brand-400">PDF</span></span>
            <span class="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
              v1.0 • 24h Purge
            </span>
          </div>
        </div>

        <!-- Right Action Links -->
        <div class="flex items-center gap-3">
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-dark-card border border-white/5 text-xs text-slate-400">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Free Tier Storage Active</span>
          </div>

          <a
            href="https://github.com/Leon24k/PresentPDF"
            target="_blank"
            rel="noopener noreferrer"
            class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="View on GitHub"
          >
            <Github class="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 py-6 sm:py-10">
      <Dropzone onPresentationLoaded={handlePresentationLoaded} />

      <!-- Active / Recent Presentations List -->
      {#if recentPresentations.length > 0}
        <section class="max-w-4xl w-full mx-auto px-4 mt-12 mb-8 animate-fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div class="flex items-center gap-2.5">
              <div class="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
                <Clock class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-lg font-bold text-white font-display">Active Presentations</h3>
                <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>100% Private to this device & browser • Auto-purged in 24 hours</span>
                </p>
              </div>
            </div>
            
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium w-fit">
              <span>🔒 Only visible to you</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each recentPresentations as pres}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <div
                role="button"
                tabindex="0"
                onclick={() => resumePresentation(pres)}
                class="group relative p-4 rounded-2xl bg-dark-card border border-white/10 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-200 cursor-pointer flex gap-4 text-left"
              >
                <!-- Thumbnail Cover -->
                <div class="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-dark-surface border border-white/10 flex-shrink-0 relative">
                  {#if pres.thumbnailUrl}
                    <img src={pres.thumbnailUrl} alt={pres.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-slate-600">
                      <FileText class="w-6 h-6" />
                    </div>
                  {/if}

                  <div class="absolute inset-0 bg-dark-bg/30 group-hover:opacity-0 transition-opacity flex items-center justify-center">
                    <Play class="w-5 h-5 text-white/80 fill-white/80" />
                  </div>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 class="text-sm font-bold text-white truncate group-hover:text-brand-300 transition-colors font-display">
                      {pres.title}
                    </h4>
                    <div class="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{pres.totalPages} Slides</span>
                      <span>•</span>
                      <span>{(pres.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <ExpirationBadge expiresAt={pres.expiresAt} />

                    <div class="flex items-center gap-1">
                      <button
                        onclick={(e) => handleShare(pres, e)}
                        class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Copy Share Link"
                      >
                        {#if copiedId === pres.id}
                          <Check class="w-3.5 h-3.5 text-emerald-400" />
                        {:else}
                          <Share2 class="w-3.5 h-3.5" />
                        {/if}
                      </button>

                      <button
                        onclick={(e) => handleDelete(pres.id, e)}
                        class="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                        title="Delete Presentation"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/if}
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-6 bg-dark-bg/60 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© 2026 PresentPDF • Built for high-speed Canva, Gamma & AI presentation workflows.</p>
        <p class="text-slate-400 flex items-center gap-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
          <span>Zero Server Storage • Ephemeral 24h Auto-Purge</span>
        </p>
      </div>
    </footer>
  </div>
{/if}
