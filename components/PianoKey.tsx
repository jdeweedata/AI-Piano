import React from 'react';
import { NoteType } from '../types';

interface PianoKeyProps {
  note: string;
  type: NoteType;
  isActive: boolean;
  keyboardKey: string;
  isGuideActive: boolean; // Is this key meant to be pressed right now?
  onMouseDown: (note: string) => void;
  onMouseUp: (note: string) => void;
}

const PianoKey: React.FC<PianoKeyProps> = ({ 
  note, 
  type, 
  isActive, 
  keyboardKey, 
  isGuideActive,
  onMouseDown, 
  onMouseUp 
}) => {
  const isSharp = type === NoteType.SHARP;
  
  // Tailwind classes for 3D effect
  const baseClasses = `
    relative transition-all duration-100 ease-out select-none
    flex flex-col justify-end items-center pb-2
    cursor-pointer
  `;

  const naturalClasses = `
    w-12 h-64 sm:w-14 sm:h-80 lg:w-16 lg:h-96 
    bg-white border border-gray-300 rounded-b-lg
    z-10
    ${isActive 
      ? 'bg-blue-100 translate-y-2 shadow-[0_0_0_0_rgba(0,0,0,0)] border-t-[8px] border-t-gray-200' 
      : 'shadow-[0_8px_0_0_#cbd5e1] active:translate-y-2 active:shadow-none'}
    ${isGuideActive && !isActive ? 'animate-pulse bg-yellow-100 ring-4 ring-yellow-400' : ''}
  `;

  const sharpClasses = `
    w-8 h-40 sm:w-10 sm:h-52 lg:w-10 lg:h-60
    bg-gray-900 border-x border-b border-gray-800 rounded-b-lg
    z-20 -mx-4 sm:-mx-5 lg:-mx-5
    absolute top-0
    ${isActive 
      ? 'bg-gray-800 translate-y-1 shadow-none border-t-[4px] border-t-gray-700' 
      : 'shadow-[0_5px_0_0_#111] active:translate-y-1 active:shadow-none'}
    ${isGuideActive && !isActive ? 'ring-2 ring-yellow-400 bg-gray-700' : ''}
  `;

  // Calculate left margin for sharps to position them correctly between naturals
  // This is a simplified approach assuming mapped rendering in parent
  
  return (
    <div
      className={`${baseClasses} ${isSharp ? sharpClasses : naturalClasses}`}
      onMouseDown={() => onMouseDown(note)}
      onMouseUp={() => onMouseUp(note)}
      onMouseLeave={() => onMouseUp(note)}
      onTouchStart={(e) => { e.preventDefault(); onMouseDown(note); }}
      onTouchEnd={(e) => { e.preventDefault(); onMouseUp(note); }}
    >
      {!isSharp && (
        <span className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
          {note}
        </span>
      )}
      {!isSharp && (
        <span className="text-[10px] text-gray-300 uppercase mt-1 mb-2 font-mono border border-gray-200 rounded px-1">
          {keyboardKey}
        </span>
      )}
      {isSharp && (
        <span className="text-[10px] text-gray-500 uppercase mb-4 font-mono">
           {keyboardKey}
        </span>
      )}
    </div>
  );
};

export default PianoKey;