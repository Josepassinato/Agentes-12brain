import React, { useEffect, useState } from 'react';
import { VoiceState } from '../types';

interface VoiceInterfaceProps {
  voiceState: VoiceState;
  onClose: () => void;
  agentName: string;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ voiceState, onClose, agentName }) => {
  const [circles, setCircles] = useState<number[]>([1, 1, 1]);

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      const baseScale = 1 + (voiceState.volumeLevel / 200);
      
      setCircles([
        baseScale,
        baseScale * 0.8 + Math.sin(Date.now() / 200) * 0.1,
        baseScale * 0.6 + Math.cos(Date.now() / 200) * 0.1
      ]);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [voiceState.volumeLevel]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Pulsing Circles */}
        <div 
          className="absolute bg-purple-500/30 rounded-full transition-transform duration-75"
          style={{ width: '100%', height: '100%', transform: `scale(${circles[0]})` }}
        />
        <div 
          className="absolute bg-purple-400/40 rounded-full transition-transform duration-75"
          style={{ width: '80%', height: '80%', transform: `scale(${circles[1]})` }}
        />
        <div 
          className="absolute bg-white/10 rounded-full transition-transform duration-75"
          style={{ width: '60%', height: '60%', transform: `scale(${circles[2]})` }}
        />
        
        {/* Icon */}
        <div className="relative z-10 text-4xl">
           {voiceState.isSpeaking ? '🤖' : '🎙️'}
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <h3 className="text-2xl font-bold tracking-tight">{agentName}</h3>
        <p className="text-purple-300">
            {voiceState.isSpeaking ? "Speaking..." : "Listening..."}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="mt-12 bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform hover:scale-105 transition-all"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <p className="mt-4 text-xs text-slate-500 uppercase tracking-widest">Live Connection Active</p>
    </div>
  );
};

export default VoiceInterface;
