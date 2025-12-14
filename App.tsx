import React, { useState, useEffect, useCallback, useRef } from 'react';
import PianoKey from './components/PianoKey';
import GameVisualization from './components/GameVisualization';
import PerformanceGraph from './components/PerformanceGraph';
import { PIANO_NOTES, TWINKLE_TWINKLE, HIT_WINDOW } from './constants';
import { NoteType, GameState, Song, PerformanceStats, SongNote } from './types';
import { audioService } from './services/audio';
import { generateSong } from './services/geminiService';
import { Music, Play, RefreshCw, Trophy, Award, Disc } from 'lucide-react';

export default function App() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentSong, setCurrentSong] = useState<Song>(TWINKLE_TWINKLE);
  
  // Game Loop State
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [scoreStats, setScoreStats] = useState<PerformanceStats>({
    score: 0, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0
  });
  const [scoreHistory, setScoreHistory] = useState<{ time: number; score: number }[]>([]);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTopic, setGenerationTopic] = useState("Pop hits");

  const requestRef = useRef<number>();

  // --- Audio & Input Handling ---

  const playNote = useCallback((note: string) => {
    if (activeNotes.has(note)) return;

    // Visual
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.add(note);
      return newSet;
    });

    // Audio
    const noteDef = PIANO_NOTES.find(n => n.note === note);
    if (noteDef) {
      audioService.playNote(noteDef.frequency);
    }

    // Game Logic: Check Hit
    if (gameState === GameState.PLAYING) {
      handleGameHit(note);
    }
  }, [activeNotes, gameState]);

  const stopNote = useCallback((note: string) => {
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const noteDef = PIANO_NOTES.find(n => n.keyboardKey === e.key.toLowerCase());
    if (noteDef) playNote(noteDef.note);
  }, [playNote]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const noteDef = PIANO_NOTES.find(n => n.keyboardKey === e.key.toLowerCase());
    if (noteDef) stopNote(noteDef.note);
  }, [stopNote]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // --- Game Loop ---

  const handleGameHit = (playedNote: string) => {
    // Find the closest unhit note matching the played note in the song
    // that is within the hit window relative to current time
    
    // We modify the current song state to mark hit, so we need a deep check or ref
    // For React simplicity, we'll iterate the state 'currentSong.notes'
    
    let hitFound = false;
    let newStats = { ...scoreStats };

    const noteIndex = currentSong.notes.findIndex(target => {
      if (target.hit || target.noteName !== playedNote) return false;
      const timeDiff = Math.abs(target.startTime - currentTime);
      return timeDiff <= HIT_WINDOW;
    });

    if (noteIndex !== -1) {
        // HIT!
        hitFound = true;
        const target = currentSong.notes[noteIndex];
        const timeDiff = Math.abs(target.startTime - currentTime);
        
        // Mark as hit in local song state
        const updatedNotes = [...currentSong.notes];
        updatedNotes[noteIndex] = { ...target, hit: true };
        setCurrentSong({ ...currentSong, notes: updatedNotes });

        // Scoring
        if (timeDiff < 100) {
            newStats.score += 100 + (newStats.combo * 10);
            newStats.perfect++;
            newStats.combo++;
        } else {
            newStats.score += 50 + (newStats.combo * 5);
            newStats.good++;
            newStats.combo++;
        }
        
        if (newStats.combo > newStats.maxCombo) newStats.maxCombo = newStats.combo;

        setScoreStats(newStats);
    } else {
        // MISSED (Pressed wrong note or wrong time)
        // Only penalize if playing actively
        if (gameState === GameState.PLAYING) {
           newStats.combo = 0;
           setScoreStats(newStats);
        }
    }
  };

  const startGame = () => {
    setGameState(GameState.PLAYING);
    setStartTime(performance.now());
    setScoreStats({ score: 0, perfect: 0, good: 0, miss: 0, combo: 0, maxCombo: 0 });
    setScoreHistory([]);
    
    // Reset song hit states
    const resetNotes = currentSong.notes.map(n => ({ ...n, hit: false }));
    setCurrentSong({ ...currentSong, notes: resetNotes });
  };

  const stopGame = () => {
    setGameState(GameState.FINISHED);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const updateLoop = (time: number) => {
    if (gameState !== GameState.PLAYING) return;

    const rawTime = time - startTime;
    // Add a delay so notes start from top and reach bottom at startTime
    // If the visualization says "hit at bottom", the song time is rawTime.
    setCurrentTime(rawTime);

    // Check for missed notes (passed without being hit)
    // This is simple logic: if a note passed logic window + buffer and wasn't hit
    // We won't mutate state in the loop constantly, just conceptually.
    // In a real robust game, we'd check misses here and break combo.

    // Record history every ~500ms
    if (Math.floor(rawTime) % 50 === 0) {
       setScoreHistory(prev => [...prev, { time: rawTime, score: scoreStats.score }]);
    }

    // End condition
    const lastNoteTime = currentSong.notes[currentSong.notes.length - 1].startTime + 2000;
    if (rawTime > lastNoteTime) {
      stopGame();
    } else {
      requestRef.current = requestAnimationFrame(updateLoop);
    }
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(updateLoop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, startTime, scoreStats]); // Dependencies need care to avoid jitter, using refs usually better for Loop

  // --- Gemini Integration ---

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const newSong = await generateSong(generationTopic, "Easy");
      setCurrentSong(newSong);
      setGameState(GameState.MENU);
    } catch (e) {
      alert("AI was busy composing! Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-between text-white relative">
      
      {/* 3D Environment Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black z-0"></div>

      {/* Header & Score */}
      <div className="z-10 w-full max-w-5xl p-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center gap-2">
            <Music className="text-cyan-400" /> Virtuoso AI
          </h1>
          <p className="text-slate-400 text-sm mt-1">{currentSong.title}</p>
        </div>
        
        {gameState === GameState.PLAYING && (
          <div className="flex gap-8 items-center bg-slate-800/80 p-3 rounded-lg border border-slate-700 backdrop-blur">
             <div className="text-center">
                <span className="block text-xs text-slate-400 uppercase">Score</span>
                <span className="text-2xl font-mono text-cyan-400">{scoreStats.score}</span>
             </div>
             <div className="text-center">
                <span className="block text-xs text-slate-400 uppercase">Combo</span>
                <span className={`text-2xl font-mono ${scoreStats.combo > 10 ? 'text-yellow-400 animate-pulse' : 'text-white'}`}>x{scoreStats.combo}</span>
             </div>
          </div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="z-10 flex-1 w-full max-w-5xl relative flex flex-col justify-end pb-12">
        
        {/* Visualization Area (Falling Notes) */}
        <div className="relative h-64 sm:h-96 w-full mb-4 border-b-4 border-white/10 overflow-hidden mask-linear">
           <GameVisualization 
             notes={currentSong.notes} 
             currentTime={currentTime} 
             noteMap={PIANO_NOTES}
             height={384} // match h-96
           />
        </div>

        {/* Piano Keys */}
        <div className="relative flex justify-center items-end px-4 sm:px-10 perspective-[1000px] group">
          <div className="relative flex justify-center shadow-2xl rounded-b-xl transform-style-3d rotate-x-12 transition-transform duration-500 origin-top">
            {/* Render Naturals first to establish layout */}
            {PIANO_NOTES.filter(n => n.type === NoteType.NATURAL).map((noteDef) => (
                <PianoKey 
                  key={noteDef.note}
                  note={noteDef.note}
                  type={noteDef.type}
                  isActive={activeNotes.has(noteDef.note)}
                  isGuideActive={
                    gameState === GameState.PLAYING && 
                    currentSong.notes.some(n => !n.hit && n.noteName === noteDef.note && Math.abs(n.startTime - currentTime) < 200)
                  }
                  keyboardKey={noteDef.keyboardKey}
                  onMouseDown={playNote}
                  onMouseUp={stopNote}
                />
            ))}
            
            {/* Render Sharps Absolutely positioned over gaps */}
            {/* We cheat slightly by mapping the known sharp positions relative to naturals manually in CSS or just rendering them in flow if we structured differently. 
                However, for a clean look, let's render them as children of the container, absolutely positioned.
                
                Actually, the PianoKey component handles Sharp logic via absolute positioning. 
                We need to interleave them in the JSX to ensure they sit on top, OR render them after. 
                Tailwind grid or Flex is hard for precise piano layouts.
                
                Correction: The previous PianoKey code assumed relative positioning for naturals and absolute for sharps.
                We need to render all of them in a specific order or render sharps separately.
                Let's render Sharps inside the flow but with negative margins.
            */}
             <div className="absolute top-0 left-0 w-full h-full flex justify-center pointer-events-none">
                 {/* This wrapper is just to calculate offsets if we used percentages. 
                     Better strategy: Render them in the main map but Naturals have position relative, Sharps absolute.
                     Wait, the map above only rendered Naturals.
                     Let's re-render the whole PIANO_NOTES array but handle layout carefully.
                 */}
             </div>
          </div>
          
          {/* Re-implementing the key render to work with the specific layout logic required for a piano */}
          <div className="flex relative bg-slate-800 p-2 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t border-slate-700">
             {PIANO_NOTES.map((note, index) => {
                 // We only render Naturals in the flex flow. 
                 // If the NEXT note in the list is a sharp, we render it as a child of the current natural (or positioned relative to it).
                 if (note.type === NoteType.SHARP) return null; // Skip sharps in main flow

                 const nextNote = PIANO_NOTES[index + 1];
                 const hasSharp = nextNote && nextNote.type === NoteType.SHARP;

                 return (
                     <div key={note.note} className="relative group">
                         <PianoKey
                             note={note.note}
                             type={NoteType.NATURAL}
                             isActive={activeNotes.has(note.note)}
                             keyboardKey={note.keyboardKey}
                             onMouseDown={playNote}
                             onMouseUp={stopNote}
                             isGuideActive={gameState === GameState.PLAYING && currentSong.notes.some(n => !n.hit && n.noteName === note.note && Math.abs(n.startTime - currentTime) < 200)}
                         />
                         {hasSharp && (
                             <div className="absolute -right-3 sm:-right-5 top-0 z-20" style={{ width: 0 }}> {/* Zero width container to not affect flex flow */}
                                 <div className="relative left-1/2 -translate-x-1/2">
                                     <PianoKey
                                         note={nextNote.note}
                                         type={NoteType.SHARP}
                                         isActive={activeNotes.has(nextNote.note)}
                                         keyboardKey={nextNote.keyboardKey}
                                         onMouseDown={playNote}
                                         onMouseUp={stopNote}
                                         isGuideActive={gameState === GameState.PLAYING && currentSong.notes.some(n => !n.hit && n.noteName === nextNote.note && Math.abs(n.startTime - currentTime) < 200)}
                                     />
                                 </div>
                             </div>
                         )}
                     </div>
                 );
             })}
          </div>
        </div>
      </div>

      {/* Menus and Overlays */}
      
      {/* Menu / Start Screen */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ready to Play?</h2>
            <p className="text-slate-400 mb-6">Select a song or generate a new one with AI.</p>
            
            <button 
              onClick={startGame}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mb-4"
            >
              <Play fill="currentColor" /> Play {currentSong.title}
            </button>

            <div className="border-t border-slate-700 pt-4 mt-4">
              <label className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-2 block">AI Song Generator</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={generationTopic}
                  onChange={(e) => setGenerationTopic(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="e.g. Spooky melody, Happy walk..."
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded border border-slate-600 transition-colors"
                >
                  {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Award className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.FINISHED && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl shadow-2xl max-w-lg w-full">
            <h2 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-500">
              Performance Report
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
               <div className="bg-slate-900/50 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-green-400">{scoreStats.perfect}</div>
                 <div className="text-xs text-slate-500 uppercase">Perfect</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-blue-400">{scoreStats.good}</div>
                 <div className="text-xs text-slate-500 uppercase">Good</div>
               </div>
               <div className="bg-slate-900/50 p-4 rounded-lg">
                 <div className="text-2xl font-bold text-red-400">{scoreStats.miss}</div>
                 <div className="text-xs text-slate-500 uppercase">Miss</div>
               </div>
            </div>

            <div className="mb-6">
               <PerformanceGraph history={scoreHistory} />
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setGameState(GameState.MENU)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-colors"
              >
                Back to Menu
              </button>
              <button 
                onClick={startGame}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Replay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer / Controls Legend */}
      <div className="w-full text-center p-2 text-xs text-slate-600">
         Use your keyboard (A - L) or click/touch to play.
      </div>
    </div>
  );
}