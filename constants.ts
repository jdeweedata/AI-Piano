import { NoteType, NoteDefinition, Song } from './types';

export const PIANO_NOTES: NoteDefinition[] = [
  { note: "C4", frequency: 261.63, type: NoteType.NATURAL, keyboardKey: "a" },
  { note: "C#4", frequency: 277.18, type: NoteType.SHARP, keyboardKey: "w" },
  { note: "D4", frequency: 293.66, type: NoteType.NATURAL, keyboardKey: "s" },
  { note: "D#4", frequency: 311.13, type: NoteType.SHARP, keyboardKey: "e" },
  { note: "E4", frequency: 329.63, type: NoteType.NATURAL, keyboardKey: "d" },
  { note: "F4", frequency: 349.23, type: NoteType.NATURAL, keyboardKey: "f" },
  { note: "F#4", frequency: 369.99, type: NoteType.SHARP, keyboardKey: "t" },
  { note: "G4", frequency: 392.00, type: NoteType.NATURAL, keyboardKey: "g" },
  { note: "G#4", frequency: 415.30, type: NoteType.SHARP, keyboardKey: "y" },
  { note: "A4", frequency: 440.00, type: NoteType.NATURAL, keyboardKey: "h" },
  { note: "A#4", frequency: 466.16, type: NoteType.SHARP, keyboardKey: "u" },
  { note: "B4", frequency: 493.88, type: NoteType.NATURAL, keyboardKey: "j" },
  { note: "C5", frequency: 523.25, type: NoteType.NATURAL, keyboardKey: "k" },
  { note: "C#5", frequency: 554.37, type: NoteType.SHARP, keyboardKey: "o" },
  { note: "D5", frequency: 587.33, type: NoteType.NATURAL, keyboardKey: "l" },
];

export const TWINKLE_TWINKLE: Song = {
  title: "Twinkle Twinkle Little Star",
  description: "A classic beginner nursery rhyme.",
  bpm: 100,
  difficulty: "Easy",
  notes: [
    { id: '1', noteName: "C4", startTime: 0, duration: 500 },
    { id: '2', noteName: "C4", startTime: 600, duration: 500 },
    { id: '3', noteName: "G4", startTime: 1200, duration: 500 },
    { id: '4', noteName: "G4", startTime: 1800, duration: 500 },
    { id: '5', noteName: "A4", startTime: 2400, duration: 500 },
    { id: '6', noteName: "A4", startTime: 3000, duration: 500 },
    { id: '7', noteName: "G4", startTime: 3600, duration: 1000 },
    
    { id: '8', noteName: "F4", startTime: 4800, duration: 500 },
    { id: '9', noteName: "F4", startTime: 5400, duration: 500 },
    { id: '10', noteName: "E4", startTime: 6000, duration: 500 },
    { id: '11', noteName: "E4", startTime: 6600, duration: 500 },
    { id: '12', noteName: "D4", startTime: 7200, duration: 500 },
    { id: '13', noteName: "D4", startTime: 7800, duration: 500 },
    { id: '14', noteName: "C4", startTime: 8400, duration: 1000 },
  ]
};

export const FALL_SPEED = 0.2; // pixels per ms
export const HIT_WINDOW = 300; // ms tolerance
