
import React from 'react';
import { GameState, Player, UnitType, BuildingType } from '../types';
import { UNIT_INFO, TECH_TREE, CIVICS_TREE } from '../constants';
import ResearchPanel from './ResearchPanel';

interface GameControlsProps {
  gameState: GameState;
  humanPlayer: Player;
  onNextTurn: () => void;
  onUnitAction: (action: 'SKIP' | 'FORTIFY' | 'FOUND_CITY' | 'BUILD_FARM' | 'BUILD_MINE' | 'BUILD_PASTURE') => void;
  onCityProduce: (item: UnitType | BuildingType) => void;
  advisorMessage: string | null;
  onAskAdvisor: () => void;
  onSelectResearch: (id: string, type: 'SCIENCE' | 'CULTURE') => void;
  onTogglePolicy: () => void;
  onZoom: (direction: 'IN' | 'OUT') => void;
  onOpenDiplomacy: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  gameState, 
  humanPlayer, 
  onNextTurn, 
  onUnitAction,
  onCityProduce,
  advisorMessage,
  onAskAdvisor,
  onSelectResearch,
  onTogglePolicy,
  onZoom,
  onOpenDiplomacy
}) => {
  const [showResearch, setShowResearch] = React.useState<'SCIENCE' | 'CULTURE' | null>(null);

  const selectedUnit = gameState.selectedUnitId ? gameState.units.find(u => u.id === gameState.selectedUnitId) : null;
  const isMyTurn = gameState.players[gameState.currentPlayerIndex].id === humanPlayer.id;

  const currentTech = TECH_TREE.find(t => t.id === humanPlayer.currentTechId);
  const currentCivic = CIVICS_TREE.find(c => c.id === humanPlayer.currentCivicId);
  const unitOwner = selectedUnit ? gameState.players.find(p => p.id === selectedUnit.ownerId) : null;

  return (
    <>
      {showResearch && (
        <ResearchPanel 
          player={humanPlayer} 
          type={showResearch} 
          onClose={() => setShowResearch(null)}
          onSelect={(id, type) => { onSelectResearch(id, type); setShowResearch(null); }}
          onTogglePolicy={onTogglePolicy}
        />
      )}

      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-0">
        {/* TOP BAR */}
        <div className="pointer-events-auto w-full bg-slate-900/95 border-b border-amber-600/30 text-white p-2 px-6 flex justify-between items-center shadow-xl backdrop-blur-md">
          <div className="flex gap-6 items-center">
             <div className="flex items-center gap-2">
                <span className="text-2xl drop-shadow-md">🪙</span>
                <div className="flex flex-col leading-none">
                    <span className="text-[10px] text-amber-500 font-bold uppercase">Gold</span>
                    <span className="font-mono text-lg font-bold">{Math.floor(humanPlayer.gold)}</span>
                </div>
             </div>
             
             <button onClick={() => setShowResearch('SCIENCE')} className="flex items-center gap-2 hover:bg-blue-900/30 px-3 py-1 rounded transition border border-transparent hover:border-blue-500/30">
                <span className="text-2xl drop-shadow-md">🧪</span>
                <div className="flex flex-col leading-none text-left">
                    <span className="text-[10px] text-blue-400 font-bold uppercase">Science +{humanPlayer.scienceYield}/t</span>
                    <span className="font-mono text-sm truncate w-24 font-medium">{currentTech ? currentTech.name : "연구 선택"}</span>
                </div>
             </button>

             <button onClick={() => setShowResearch('CULTURE')} className="flex items-center gap-2 hover:bg-purple-900/30 px-3 py-1 rounded transition border border-transparent hover:border-purple-500/30">
                <span className="text-2xl drop-shadow-md">🎭</span>
                <div className="flex flex-col leading-none text-left">
                    <span className="text-[10px] text-purple-400 font-bold uppercase">Culture +{humanPlayer.cultureYield}/t</span>
                    <span className="font-mono text-sm truncate w-24 font-medium">{currentCivic ? currentCivic.name : "제도 선택"}</span>
                </div>
             </button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 bg-slate-800 px-8 py-2 rounded-b-2xl border-b border-x border-amber-600/50 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
             <span className="text-amber-100 font-serif italic text-2xl font-bold drop-shadow-lg">Turn {gameState.turn}</span>
          </div>

          <div className="flex items-center gap-4">
              <button onClick={onOpenDiplomacy} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-slate-500">
                 🌐 외교
              </button>
              <button onClick={onAskAdvisor} className="bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-purple-400/50 transition hover:scale-105">
                🔮 조언
              </button>
          </div>
        </div>

        <div className="pointer-events-auto absolute right-6 top-24 flex flex-col gap-2">
           <button onClick={() => onZoom('IN')} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-600 font-bold text-xl">+</button>
           <button onClick={() => onZoom('OUT')} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full shadow-lg border border-slate-600 font-bold text-xl">-</button>
        </div>

        <div className="absolute left-6 top-28 bottom-64 w-80 pointer-events-none flex flex-col justify-end gap-2 opacity-90">
          {gameState.messages.slice(-6).map(msg => (
            <div key={msg.id} className="bg-black/70 text-slate-200 p-3 rounded-lg text-xs backdrop-blur-sm border-l-4 border-amber-500 animate-fade-in shadow-md">
              <span className="font-bold text-amber-400 block mb-0.5 text-sm">{msg.sender}</span>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="pointer-events-auto flex items-end justify-between w-full px-8 pb-8 mt-auto">
          <div className="flex items-end gap-4">
            {selectedUnit ? (
               <div className="bg-slate-900/90 border border-slate-500 rounded-xl p-5 shadow-2xl backdrop-blur-lg min-w-[340px] animate-slide-up">
                  <div className="flex items-center gap-4 mb-4 border-b border-slate-700 pb-3">
                      <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: unitOwner?.color || '#555' }}>
                         {selectedUnit.type === 'WARRIOR' ? '⚔️' : '🏹'}
                      </div>
                      <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{UNIT_INFO[selectedUnit.type].name}</h3>
                          <div className="text-xs text-slate-300 mb-1 font-bold">{unitOwner?.name}</div>
                          <div className="flex gap-4 text-xs mt-1">
                              <span className="text-green-400 font-mono">HP {Math.round(selectedUnit.health)}</span>
                              <span className="text-blue-400 font-mono">MV {selectedUnit.movesLeft}/{selectedUnit.maxMoves}</span>
                              <span className="text-red-400 font-mono">ATK {selectedUnit.strength}</span>
                          </div>
                      </div>
                  </div>
                  
                  {selectedUnit.ownerId === humanPlayer.id && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedUnit.movesLeft > 0 && selectedUnit.type === UnitType.SETTLER && (
                        <button onClick={() => onUnitAction('FOUND_CITY')} className="col-span-3 bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded font-bold text-sm border border-emerald-500">🏰 도시 건설</button>
                      )}
                      {selectedUnit.movesLeft > 0 && selectedUnit.type === UnitType.BUILDER && (
                        <>
                           <button onClick={() => onUnitAction('BUILD_FARM')} className="bg-amber-700 text-white py-2 rounded text-sm font-bold border border-amber-500">🏡 농장</button>
                           <button onClick={() => onUnitAction('BUILD_MINE')} className="bg-slate-600 text-white py-2 rounded text-sm font-bold border border-slate-400">⚒️ 광산</button>
                           <button onClick={() => onUnitAction('BUILD_PASTURE')} className="bg-green-700 text-white py-2 rounded text-sm font-bold border border-green-500">🐄 목장</button>
                        </>
                      )}
                      <button onClick={() => onUnitAction('FORTIFY')} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium">🛡️ 방어</button>
                      <button onClick={() => onUnitAction('SKIP')} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium">💤 대기</button>
                    </div>
                  )}
               </div>
            ) : ( <div className="w-1 h-1" /> )}
          </div>

          <button 
            onClick={onNextTurn}
            disabled={!isMyTurn}
            className={`relative group w-28 h-28 rounded-full border-4 shadow-[0_0_50px_rgba(0,0,0,0.7)] flex flex-col items-center justify-center text-center transition-all transform hover:scale-105 active:scale-95 ${isMyTurn ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-300 text-slate-900 cursor-pointer hover:shadow-[0_0_60px_rgba(245,158,11,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-500 cursor-not-allowed grayscale'}`}
          >
            <span className="z-10 block text-xs font-bold uppercase tracking-widest mb-1">Next Turn</span>
            <span className="z-10 block text-3xl font-black leading-none">{isMyTurn ? "GO" : "..."}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default GameControls;
