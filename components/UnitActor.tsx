
import React from 'react';
import { Unit, UnitType, Player } from '../types';
import { axialToPixel } from '../utils/gameUtils';
import { HEX_WIDTH, HEX_HEIGHT, UNIT_INFO } from '../constants';

interface UnitActorProps {
  unit: Unit;
  owner: Player | undefined;
  isSelected: boolean;
  onClick: (unit: Unit) => void;
}

const UnitActor: React.FC<UnitActorProps> = ({ unit, owner, isSelected, onClick }) => {
  const { x, y } = axialToPixel(unit.q, unit.r);
  
  const TOP_Y_OFFSET = -12; 
  const OFFSET_Y = -30; 
  
  const color = owner?.color || '#999';
  
  const getVisual = (type: UnitType) => {
      switch(type) {
          case UnitType.SETTLER: return { icon: '🚩', size: 'text-2xl' };
          case UnitType.WARRIOR: return { icon: '🛡️', size: 'text-2xl' };
          case UnitType.ARCHER: return { icon: '🏹', size: 'text-2xl' };
          case UnitType.BUILDER: return { icon: '🔨', size: 'text-2xl' };
          case UnitType.SWORDSMAN: return { icon: '⚔️', size: 'text-2xl' };
          case UnitType.CATAPULT: return { icon: '☄️', size: 'text-2xl' };
          case UnitType.GALLEY: return { icon: '⛵', size: 'text-2xl' };
          case UnitType.FISHING_BOAT: return { icon: '🚣', size: 'text-2xl' };
          case UnitType.BARBARIAN_WARRIOR: return { icon: '👹', size: 'text-2xl' };
          default: return { icon: '♟️', size: 'text-xl' };
      }
  };

  const visual = getVisual(unit.type);

  const style: React.CSSProperties = {
    transform: `translate(${x + HEX_WIDTH/2 - 20}px, ${y + TOP_Y_OFFSET + OFFSET_Y}px)`,
    transition: 'transform 0.3s ease-out', 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    zIndex: (unit.r * 100) + 50, 
    pointerEvents: 'none' // Wrapper should not block
  };

  return (
    <div style={style} className="will-change-transform">
       {/* Shadow */}
       <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-10 h-4 bg-black/40 rounded-[100%] blur-[2px]"></div>

       {/* Body */}
       <div 
         className={`pointer-events-auto cursor-pointer group relative flex flex-col items-center
            ${unit.movesLeft === 0 ? 'brightness-75' : ''}
            transition-transform hover:scale-110 hover:-translate-y-2 duration-200
         `}
         onClick={(e) => { e.stopPropagation(); onClick(unit); }}
       >
           {isSelected && (
             <div className="absolute -top-6 animate-bounce text-amber-400 font-bold text-lg">▼</div>
           )}

           <div 
             className="w-10 h-12 rounded-lg shadow-[0_4px_4px_rgba(0,0,0,0.4)] flex items-center justify-center border-2 border-white/80 bg-gradient-to-b from-white/10 to-black/10 backdrop-blur-sm"
             style={{ backgroundColor: color }}
           >
               <span className={`${visual.size} drop-shadow-md filter`}>{visual.icon}</span>
           </div>
           
           <div className="mt-1 w-8 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/30 shadow">
              <div 
                 className={`h-full ${unit.health > 50 ? 'bg-green-500' : 'bg-red-500'}`} 
                 style={{ width: `${unit.health}%` }}
              />
           </div>

           {/* Tooltip */}
           <div className="absolute bottom-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/95 text-white text-xs p-2 rounded w-32 z-50 border border-amber-500/50 shadow-2xl pointer-events-none">
               <div className="font-bold text-amber-400 border-b border-slate-700 mb-1 pb-1">{UNIT_INFO[unit.type].name}</div>
               <div className="flex justify-between text-slate-300"><span>소속:</span> <span style={{color}}>{owner?.name || "야만인"}</span></div>
               <div className="flex justify-between"><span>HP:</span> <span>{Math.floor(unit.health)}</span></div>
               <div className="flex justify-between"><span>공격력:</span> <span>{unit.strength}</span></div>
           </div>
       </div>
    </div>
  );
};

export default UnitActor;
