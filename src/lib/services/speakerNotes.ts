const NOTES_PREFIX = 'presentpdf_notes_';

/**
 * Retrieves speaker note content for a specific presentation slide.
 */
export function getSpeakerNote(presentationId: string, pageNumber: number): string {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return '';
  try {
    const key = `${NOTES_PREFIX}${presentationId}_p${pageNumber}`;
    return localStorage.getItem(key) || '';
  } catch (err) {
    console.warn('Could not read speaker note from localStorage:', err);
    return '';
  }
}

/**
 * Persists speaker note content for a specific presentation slide.
 */
export function saveSpeakerNote(presentationId: string, pageNumber: number, note: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const key = `${NOTES_PREFIX}${presentationId}_p${pageNumber}`;
    if (!note || note.trim() === '') {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, note);
    }
  } catch (err) {
    console.warn('Could not save speaker note to localStorage:', err);
  }
}

/**
 * Retrieves all speaker notes for a given presentation mapped by pageNumber.
 */
export function getAllNotesForPresentation(presentationId: string): Record<number, string> {
  const result: Record<number, string> = {};
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return result;

  try {
    const prefix = `${NOTES_PREFIX}${presentationId}_p`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const pageNumStr = key.replace(prefix, '');
        const pageNum = parseInt(pageNumStr, 10);
        if (!isNaN(pageNum)) {
          result[pageNum] = localStorage.getItem(key) || '';
        }
      }
    }
  } catch (err) {
    console.warn('Could not list speaker notes from localStorage:', err);
  }

  return result;
}

/**
 * Clears all stored speaker notes for a presentation (e.g. on presentation deletion).
 */
export function clearAllNotesForPresentation(presentationId: string): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const prefix = `${NOTES_PREFIX}${presentationId}_p`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('Could not clear speaker notes from localStorage:', err);
  }
}
