
import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import type { Selection } from '../types';
import { MagicWandIcon } from './Icons';

interface FrameSelectorProps {
  frameSrc: string;
  onSelect: (selection: Selection) => void;
  onProcess: () => void;
  selection: Selection | null;
}

const FrameSelector: React.FC<FrameSelectorProps> = ({ frameSrc, onSelect, onProcess, selection }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const getCoordinates = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return { x: 0, y: 0 };
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    setStartPoint({ x, y });
    onSelect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint) return;
    const { x, y } = getCoordinates(e);
    const newSelection: Selection = {
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
    };
    onSelect(newSelection);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPoint(null);
  };
  
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-4 text-center">Step 1: Select the Object to Remove</h2>
      <p className="text-gray-400 text-center mb-4">Click and drag on the image below to draw a box around the logo or object.</p>
      <div
        ref={imageContainerRef}
        className="relative select-none overflow-hidden rounded-lg shadow-lg cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img src={frameSrc} alt="Video Frame" className="max-w-full max-h-[60vh] object-contain pointer-events-none" />
        {selection && selection.width > 0 && selection.height > 0 && (
          <div
            className="absolute border-2 border-cyan-400 bg-cyan-400/30"
            style={{
              left: `${selection.x}px`,
              top: `${selection.y}px`,
              width: `${selection.width}px`,
              height: `${selection.height}px`,
            }}
          />
        )}
      </div>
      <div className="mt-6 text-center">
        <h2 className="text-2xl font-semibold mb-4 text-center">Step 2: Remove with AI</h2>
         <button
          onClick={onProcess}
          disabled={!selection || selection.width < 5 || selection.height < 5}
          className="flex items-center gap-2 px-8 py-3 bg-cyan-600 text-white font-bold text-lg rounded-lg shadow-md hover:bg-cyan-700 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MagicWandIcon className="w-6 h-6" />
          Remove Object
        </button>
      </div>
    </div>
  );
};

export default FrameSelector;
