export enum NoteType {
  NATURAL = 'NATURAL',
  SHARP = 'SHARP'
}

export interface NoteDefinition {
  note: string; // e.g., "C4"
  frequency: number;
  type: NoteType;
  keyboardKey: string; // The computer keyboard key to press
  midi?: number;
}

export interface SongNote {
  noteName: string;
  startTime: number; // ms
  duration: number; // ms
  id: string;
  hit?: boolean; // If the user successfully hit this note
}

export interface Song {
  title: string;
  description: string;
  notes: SongNote[];
  bpm: number;
  difficulty: string;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface PerformanceStats {
  score: number;
  perfect: number;
  good: number;
  miss: number;
  combo: number;
  maxCombo: number;
}