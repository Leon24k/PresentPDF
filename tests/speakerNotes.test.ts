import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSpeakerNote,
  saveSpeakerNote,
  getAllNotesForPresentation,
  clearAllNotesForPresentation,
} from '../src/lib/services/speakerNotes';

describe('SpeakerNotes Service', () => {
  const presId = 'demo-pres-notes';

  beforeEach(() => {
    clearAllNotesForPresentation(presId);
  });

  it('saves and retrieves speaker notes for a slide', () => {
    expect(getSpeakerNote(presId, 1)).toBe('');

    saveSpeakerNote(presId, 1, 'Welcome everyone to the demo!');
    expect(getSpeakerNote(presId, 1)).toBe('Welcome everyone to the demo!');

    saveSpeakerNote(presId, 2, 'Key metrics: +45% YoY growth');
    expect(getSpeakerNote(presId, 2)).toBe('Key metrics: +45% YoY growth');
  });

  it('removes note when empty string or whitespace is saved', () => {
    saveSpeakerNote(presId, 1, 'Initial note');
    expect(getSpeakerNote(presId, 1)).toBe('Initial note');

    saveSpeakerNote(presId, 1, '   ');
    expect(getSpeakerNote(presId, 1)).toBe('');
  });

  it('lists all notes for a presentation', () => {
    saveSpeakerNote(presId, 1, 'Intro note');
    saveSpeakerNote(presId, 3, 'Demo part');
    saveSpeakerNote(presId, 5, 'Closing note');

    const all = getAllNotesForPresentation(presId);
    expect(all[1]).toBe('Intro note');
    expect(all[3]).toBe('Demo part');
    expect(all[5]).toBe('Closing note');
    expect(all[2]).toBeUndefined();
  });

  it('clears all notes for a presentation', () => {
    saveSpeakerNote(presId, 1, 'Note 1');
    saveSpeakerNote(presId, 2, 'Note 2');

    clearAllNotesForPresentation(presId);
    expect(getSpeakerNote(presId, 1)).toBe('');
    expect(getSpeakerNote(presId, 2)).toBe('');
  });
});
