import React, { useMemo } from 'react';
import { SongNote, NoteDefinition } from '../types';

interface GameVisualizationProps {
  notes: SongNote[];
  currentTime: number;
  noteMap: NoteDefinition[];
  height: number;
}

const NOTE_WIDTH_PERCENT = 100 / 15; // 15 naturals approximate width logic
const LOOKAHEAD_TIME = 2000; // ms to see ahead

const GameVisualization: React.FC<GameVisualizationProps> = ({ notes, currentTime, noteMap, height }) => {
  
  // Filter visible notes
  const visibleNotes = useMemo(() => {
    return notes.filter(note => 
      note.startTime < currentTime + LOOKAHEAD_TIME && 
      note.startTime + note.duration > currentTime - 500
    );
  }, [notes, currentTime]);

  const getNoteX = (noteName: string): number => {
    const index = noteMap.findIndex(n => n.note === noteName);
    if (index === -1) return 0;
    // Simple distribution for visualization purposes
    // We need to align these with the CSS flex layout of the keys.
    // There are 15 keys total in our constant map.
    return (index * (100 / noteMap.length)) + (100 / noteMap.length / 2);
  };

  const getNoteColor = (noteName: string) => {
    return noteName.includes('#') ? '#ef4444' : '#3b82f6'; // Red for sharp, Blue for natural
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full pointer-events-none overflow-hidden"
      style={{ height: `${height}px`, zIndex: 0 }}
    >
        {/* Background Guide Lines */}
        <div className="w-full h-full flex opacity-10">
            {noteMap.map((_, i) => (
                <div key={i} className="flex-1 border-r border-gray-400 h-full"></div>
            ))}
        </div>

      {visibleNotes.map((note) => {
        // Calculate vertical position
        // 0% is top (future), 100% is bottom (now/hit line)
        // note.startTime - currentTime = time until hit.
        // If time until hit is LOOKAHEAD_TIME, it should be at 0%.
        // If time until hit is 0, it should be at 100% (minus note height).
        
        const timeUntilHit = note.startTime - currentTime;
        const topPercent = 100 - ((timeUntilHit / LOOKAHEAD_TIME) * 100);
        
        // Height of the note bar based on duration relative to lookahead window
        // But capped visually so short notes are visible
        const heightPercent = (note.duration / LOOKAHEAD_TIME) * 100;
        
        const isHit = note.hit;

        return (
          <div
            key={note.id}
            className={`absolute rounded-md shadow-lg transition-opacity duration-200 ${isHit ? 'opacity-0 scale-150' : 'opacity-90'}`}
            style={{
              left: `${getNoteX(note.noteName)}%`,
              top: `${topPercent - heightPercent}%`, // Position bottom of block at the target time
              height: `${Math.max(heightPercent, 2)}%`,
              width: '4%', // Slightly narrower than key slot
              marginLeft: '-2%', // Center it
              backgroundColor: getNoteColor(note.noteName),
              boxShadow: `0 0 10px ${getNoteColor(note.noteName)}`
            }}
          />
        );
      })}

      {/* Hit Line */}
      <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50 blur-sm"></div>
    </div>
  );
};

export default GameVisualization;