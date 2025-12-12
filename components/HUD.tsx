

import React from 'react';
import { HUDState } from '../types';

interface HUDProps {
  state: HUDState;
  rotationSpeed?: number;
}

const HUD: React.FC<HUDProps> = ({ state, rotationSpeed = 1 }) => {
  const animationsEnabled = rotationSpeed > 0;
  // Determine colors and animations based on state
  let primaryColor = "text-nexa-cyan";
  let borderColor = "border-nexa-cyan";
  let shadowColor = "shadow-nexa-cyan";
  let bgGlow = "bg-nexa-cyan";
  let animationSpeedMultiplier = 1;

  if (state === HUDState.LISTENING) {
    primaryColor = "text-nexa-red";
    borderColor = "border-nexa-red";
    shadowColor = "shadow-nexa-red";
    bgGlow = "bg-nexa-red";
  } else if (state === HUDState.THINKING) {
    primaryColor = "text-nexa-yellow";
    borderColor = "border-nexa-yellow";
    shadowColor = "shadow-nexa-yellow";
    bgGlow = "bg-nexa-yellow";
  } else if (state === HUDState.ANGRY) {
    primaryColor = "text-nexa-red";
    borderColor = "border-nexa-red";
    shadowColor = "shadow-nexa-red";
    bgGlow = "bg-nexa-red";
    animationSpeedMultiplier = 2.5; // Faster, more erratic animations
  }

  // Common glow classes
  const glowClass = `shadow-[0_0_15px_rgba(var(--tw-shadow-color),0.5)] ${shadowColor}`;
  const intenseGlow = `shadow-[0_0_30px_rgba(var(--tw-shadow-color),0.8)] ${shadowColor}`;

  return (
    <div className={`relative flex items-center justify-center transition-all duration-500 ${state === HUDState.SPEAKING || state === HUDState.ANGRY ? 'scale-105' : 'scale-100'}`}>
      
      {/* --- LEFT SIDE HOLOGRAM (Mini Rings) --- */}
      <div className={`hidden xs:flex flex-col items-end mr-3 opacity-80 transition-opacity duration-500`}>
        <div className="flex items-center">
           {/* Mini Rotating Rings */}
           <div className={`relative w-10 h-10 rounded-full border ${borderColor} flex items-center justify-center ${animationsEnabled ? 'animate-spin-reverse-slow' : ''}`} style={{ animationDuration: `${10 / (rotationSpeed * animationSpeedMultiplier)}s` }}>
              <div className={`w-6 h-6 rounded-full border border-dashed ${borderColor} opacity-60 ${animationsEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: `${8 / (rotationSpeed * animationSpeedMultiplier)}s` }}></div>
              <div className={`absolute top-0 w-1 h-1 ${bgGlow} rounded-full shadow-[0_0_5px_currentColor]`}></div>
           </div>
           {/* Connecting Line to Main HUD */}
           <div className={`w-4 h-[1px] ${bgGlow} opacity-50 ml-2`}></div>
        </div>
        {/* Decorative bits */}
        <div className="flex mt-1 gap-1 mr-6">
            <div className={`w-1 h-1 ${bgGlow} rounded-full ${animationsEnabled ? 'animate-pulse' : ''}`}></div>
            <div className={`w-4 h-[1px] ${bgGlow} opacity-30`}></div>
        </div>
      </div>


      {/* --- CENTER MAIN HUD (RESIZED SMALLER) --- */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        
        {/* 1. Outer Glow Container */}
        <div className={`absolute inset-0 rounded-full ${intenseGlow} ${state === HUDState.ANGRY ? 'opacity-40' : 'opacity-20'} blur-xl transition-all duration-500`}></div>

        {/* 2. Outer Ring - Thick Dashed with Gap */}
        <div 
          className={`absolute w-full h-full rounded-full border-2 border-dashed ${borderColor} opacity-60 ${animationsEnabled ? 'animate-spin-slow' : ''} transition-colors duration-500 mask-radial`}
          style={{ animationDuration: `${12 / (rotationSpeed * animationSpeedMultiplier)}s` }}
        ></div>

        {/* 3. Middle Orbit Ring (Thin) */}
        <div 
          className={`absolute w-[88%] h-[88%] rounded-full border-[0.5px] ${borderColor} opacity-40 ${animationsEnabled ? 'animate-spin' : ''} transition-colors duration-500`}
          style={{ animationDuration: `${20 / (rotationSpeed * animationSpeedMultiplier)}s` }}
        >
          {/* Orbiting Dot */}
          <div className={`absolute top-1/2 -right-1 w-1.5 h-1.5 ${bgGlow} rounded-full shadow-[0_0_10px_currentColor]`}></div>
        </div>

        {/* 4. Inner Tech Ring (Counter Rotate) */}
        <div 
          className={`absolute w-[78%] h-[78%] rounded-full border-2 ${borderColor} border-t-transparent border-l-transparent opacity-80 ${animationsEnabled ? 'animate-spin-reverse-slow' : ''} transition-colors duration-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]`}
          style={{ animationDuration: `${8 / (rotationSpeed * animationSpeedMultiplier)}s` }}
        ></div>

        {/* 5. Innermost Dashed Ring */}
        <div 
          className={`absolute w-[60%] h-[60%] rounded-full border border-dashed ${borderColor} opacity-50 ${animationsEnabled ? 'animate-spin' : ''}`}
          style={{ animationDuration: `${15 / (rotationSpeed * animationSpeedMultiplier)}s` }}
        ></div>

        {/* 6. Static/Pulsing Core */}
        <div className={`absolute w-[45%] h-[45%] rounded-full border ${borderColor} transition-all duration-500 ${state === HUDState.SPEAKING ? `${animationsEnabled ? 'animate-pulse-fast' : ''} bg-white/5 opacity-50` : 'opacity-30'} ${state === HUDState.IDLE && animationsEnabled ? 'animate-breathing' : ''} ${state === HUDState.ANGRY ? `${animationsEnabled ? 'animate-pulse-fast' : ''} bg-red-500/10` : ''}`}></div>

        {/* 7. Center Text */}
        <div className={`relative z-10 text-3xl sm:text-4xl font-light tracking-[0.15em] ${primaryColor} font-mono transition-colors duration-500 drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]`}>
          NEXA
        </div>

        {/* 7b. STATUS TEXT */}
        <div className={`absolute mt-20 text-[9px] sm:text-[10px] tracking-[0.3em] font-mono ${primaryColor} ${animationsEnabled ? 'animate-pulse' : ''} uppercase opacity-80`}>
           {state}
        </div>
        
        {/* 8. Micro-ornaments (Top/Bottom) */}
        <div className={`absolute top-1 w-[1px] h-3 ${bgGlow} opacity-50`}></div>
        <div className={`absolute bottom-1 w-[1px] h-3 ${bgGlow} opacity-50`}></div>

        {/* Waveform Visualization (Speaking & Angry) */}
        {(state === HUDState.SPEAKING || state === HUDState.ANGRY) && animationsEnabled && (
           <>
             <div className={`absolute inset-0 rounded-full border-2 ${borderColor} opacity-40 animate-ping`}></div>
             <div className={`absolute inset-4 rounded-full border ${borderColor} opacity-20 animate-ping delay-75`}></div>
           </>
        )}
      </div>


      {/* --- RIGHT SIDE HOLOGRAM (Triangle + Nodes) --- */}
      <div className={`hidden xs:flex flex-col items-start ml-3 opacity-80 transition-opacity duration-500`}>
        <div className="flex items-center">
           {/* Connecting Line from Main HUD */}
           <div className={`w-4 h-[1px] ${bgGlow} opacity-50 mr-2`}></div>
           
           {/* Rotating Triangle Container */}
           <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Triangle (SVG) */}
              <svg className={`w-8 h-8 ${primaryColor} ${animationsEnabled ? 'animate-spin-slow' : ''} opacity-80`} style={{ animationDuration: `${12 / (rotationSpeed * animationSpeedMultiplier)}s` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                 <path d="M12 2L2 22h20L12 2z" />
              </svg>
              {/* Center Dot */}
              <div className={`absolute w-1 h-1 ${bgGlow} rounded-full ${animationsEnabled ? 'animate-ping' : ''}`}></div>
           </div>
        </div>
        {/* Blinking Nodes Data Stream */}
        <div className="flex flex-col ml-8 -mt-1 space-y-1">
             <div className="flex space-x-1">
               <div className={`w-1 h-1 ${bgGlow} opacity-80`}></div>
               <div className={`w-3 h-[1px] ${bgGlow} opacity-50`}></div>
             </div>
             <div className="flex space-x-1 ml-2">
               <div className={`w-1 h-1 ${bgGlow} opacity-60 ${animationsEnabled ? 'animate-blink' : ''}`}></div>
               <div className={`w-4 h-[1px] ${bgGlow} opacity-40`}></div>
             </div>
        </div>
      </div>

    </div>
  );
};

export default HUD;
