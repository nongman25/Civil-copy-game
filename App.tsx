
import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { UnitType, BuildingType, DiplomaticRelation } from './types';
import { axialToPixel, getDistance } from './utils/gameUtils';
import { POLICY_CARDS } from './constants';
import HexTile from './components/HexTile';
import UnitActor from './components/UnitActor';
import GameControls from './components/GameControls';
import SetupScreen from './components/SetupScreen';
import CityPanel from './components/CityPanel';
import DiplomacyPanel from './components/DiplomacyPanel';
import TileInfoPanel from './components/TileInfoPanel';
import PolicyPanel from './components/PolicyPanel';
import { getAdvisorTip } from './services/geminiService';

const App: React.FC = () => {
  const { 
      gameState, setGameState, phase, confirmWar, setConfirmWar, 
      startGame, handleTileClick, handleUnitClick, deselectAll, nextTurn, handleCityCombat, handleCombat, onFoundCity, handleUnitAction, handlePurchase, addMessage, handleCityRename
  } = useGameEngine();

  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [advisorMessage, setAdvisorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDiplomacy, setShowDiplomacy] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        deselectAll();
        setShowDiplomacy(false);
        setShowPolicies(false);
        setConfirmWar(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deselectAll]);

  const handleStartGame = (settings: any) => {
      const { humanSettler } = startGame(settings);
      if (humanSettler) {
        const startPx = axialToPixel(humanSettler.q, humanSettler.r);
        setCamera({ x: -startPx.x, y: -startPx.y });
      }
  };

  const handleDeclareWar = () => {
      if(confirmWar && gameState) {
          const attackerPlayer = gameState.players[0];
          const targetUnit = confirmWar.defender;
          
          const newPlayers = gameState.players.map(p => {
              if (p.id === attackerPlayer.id) {
                  const newDiplomacy = { ...p.diplomacy };
                  newDiplomacy[targetUnit.ownerId] = { 
                      ...newDiplomacy[targetUnit.ownerId], 
                      status: 'WAR' as const, 
                      relationship: 0 
                  };
                  return { ...p, diplomacy: newDiplomacy };
              }
              if (p.id === targetUnit.ownerId) {
                  const newDiplomacy = { ...p.diplomacy };
                  newDiplomacy[attackerPlayer.id] = { 
                      ...newDiplomacy[attackerPlayer.id], 
                      status: 'WAR' as const, 
                      relationship: 0 
                  };
                  return { ...p, diplomacy: newDiplomacy };
              }
              return p;
          });
          
          const updatedState = { ...gameState, players: newPlayers };
          setGameState(updatedState); 

          if (targetUnit.strength === 0 && targetUnit.type === UnitType.WARRIOR) {
               const city = gameState.cities.find(c => c.q === targetUnit.q && c.r === targetUnit.r);
               if (city) handleCityCombat(confirmWar.attacker, city);
          } else {
              handleCombat(confirmWar.attacker, targetUnit);
          }
          setConfirmWar(null);
      }
  };

  const handleDiplomacyAction = (action: 'WAR' | 'PEACE' | 'GIFT', targetId: string) => {
     if (!gameState) return;
     const human = gameState.players[0];
     const target = gameState.players.find(p => p.id === targetId);
     if (!target) return;

     let newHuman = { ...human };
     let newTarget = { ...target };

     if (action === 'WAR') {
         newHuman.diplomacy[targetId] = { status: 'WAR', relationship: 0, isOpenBorders: false };
         newTarget.diplomacy[human.id] = { status: 'WAR', relationship: 0, isOpenBorders: false };
         addMessage(`${target.leaderName}에게 전쟁을 선포했습니다.`, "System");
     } else if (action === 'PEACE') {
         if (Math.random() > 0.5) {
             newHuman.diplomacy[targetId] = { status: 'PEACE', relationship: 50, isOpenBorders: false };
             newTarget.diplomacy[human.id] = { status: 'PEACE', relationship: 50, isOpenBorders: false };
             addMessage(`${target.leaderName}와 평화 협정을 맺었습니다.`, "System");
         } else {
             addMessage(`${target.leaderName}: "거절한다!"`, target.leaderName);
             return; // No change
         }
     } else if (action === 'GIFT') {
         if (human.gold >= 50) {
             newHuman.gold -= 50;
             newHuman.diplomacy[targetId] = { 
                 ...newHuman.diplomacy[targetId], 
                 relationship: Math.min(100, newHuman.diplomacy[targetId].relationship + 10) 
             };
             newTarget.diplomacy[human.id] = { 
                ...newTarget.diplomacy[human.id], 
                relationship: Math.min(100, newTarget.diplomacy[human.id].relationship + 10) 
            };
             addMessage(`${target.leaderName}에게 선물을 보냈습니다. (관계도 +10)`, "System");
         }
     }
     
     const updatedPlayers = gameState.players.map(p => p.id === human.id ? newHuman : p.id === target.id ? newTarget : p);
     setGameState({ ...gameState, players: updatedPlayers });
  };

  const handleTogglePolicy = (id: string) => {
     if (!gameState) return;
     const p = gameState.players[0];
     const card = POLICY_CARDS.find(c => c.id === id);
     if (!card) return;

     const isActive = p.activePolicies.includes(id);
     
     // Hardcoded limits for now (Simple Chiefdom)
     const SLOTS = { MILITARY: 2, ECONOMIC: 2, DIPLOMATIC: 2, WILDCARD: 1 };
     
     if (!isActive) {
         const currentCount = p.activePolicies.filter(pid => POLICY_CARDS.find(c => c.id === pid)?.type === card.type).length;
         if (currentCount >= (SLOTS as any)[card.type]) {
             addMessage(`${card.type} 정책 슬롯이 가득 찼습니다.`, "System");
             return;
         }
     }

     const newPolicies = isActive
        ? p.activePolicies.filter(p => p !== id)
        : [...p.activePolicies, id];
        
     const updatedPlayers = gameState.players.map(pl => pl.id === p.id ? { ...pl, activePolicies: newPolicies } : pl);
     setGameState({...gameState, players: updatedPlayers});
  };

  if (phase === 'SETUP') return <SetupScreen onStart={handleStartGame} />;
  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden relative select-none"
      onMouseDown={(e) => { setIsDragging(true); setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y }); }}
      onMouseMove={(e) => { if (isDragging) setCamera({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}
      onMouseUp={() => setIsDragging(false)} onWheel={(e) => setZoom(z => Math.max(0.5, Math.min(2, z - e.deltaY * 0.001)))}
    >
       <svg width="0" height="0" className="absolute">
        <defs>
            <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope="0.1" /></feComponentTransfer></filter>
            <linearGradient id="terrain-WATER" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient>
            <linearGradient id="terrain-PLAINS" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#eab308" /><stop offset="100%" stopColor="#a16207" /></linearGradient>
            <linearGradient id="terrain-GRASSLAND" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#15803d" /></linearGradient>
            <linearGradient id="terrain-FOREST" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#166534" /><stop offset="100%" stopColor="#14532d" /></linearGradient>
            <linearGradient id="terrain-MOUNTAIN" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#94a3b8" /><stop offset="100%" stopColor="#475569" /></linearGradient>
            <linearGradient id="terrain-DESERT" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fdba74" /><stop offset="100%" stopColor="#ea580c" /></linearGradient>
            <linearGradient id="terrain-SNOW" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f1f5f9" /><stop offset="100%" stopColor="#cbd5e1" /></linearGradient>
            <linearGradient id="terrain-TUNDRA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a8a29e" /><stop offset="100%" stopColor="#78716c" /></linearGradient>
        </defs>
      </svg>

      <div style={{ transform: `translate(${camera.x + window.innerWidth/2}px, ${camera.y + window.innerHeight/2}px) scale(${zoom})`, width: 0, height: 0, overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
         <svg width="1" height="1" overflow="visible" style={{ zIndex: 10 }}>
             {[...gameState.tiles].sort((a, b) => a.r - b.r || a.q - b.q).map(tile => (
                 <HexTile key={tile.id} tile={tile} 
                   player={gameState.players[0]}
                   city={gameState.cities.find(c => c.q === tile.q && c.r === tile.r)} 
                   isBorder={tile.ownerId ? gameState.players.find(p => p.id === tile.ownerId)?.color : undefined}
                   ownerColor={tile.ownerId ? gameState.players.find(p => p.id === tile.ownerId)?.color : undefined}
                   isSelected={gameState.selectedCityId === gameState.cities.find(c => c.q === tile.q && c.r === tile.r)?.id && !!gameState.cities.find(c => c.q === tile.q && c.r === tile.r)}
                   isInRange={gameState.selectedUnitId ? getDistance(gameState.units.find(u => u.id === gameState.selectedUnitId)!, tile) <= gameState.units.find(u => u.id === gameState.selectedUnitId)!.attackRange : false} 
                   isWorked={gameState.selectedCityId ? gameState.cities.find(c => c.id === gameState.selectedCityId)?.workedTiles.some(wt => wt.q === tile.q && wt.r === tile.r) : false}
                   onClick={handleTileClick}
                 />
             ))}
         </svg>
         <div className="absolute top-0 left-0 w-0 h-0 pointer-events-none" style={{ zIndex: 50 }}>
            {[...gameState.units].sort((a, b) => a.r - b.r || a.q - b.q).map(unit => (
                 gameState.tiles.find(t => t.q === unit.q && t.r === unit.r)?.isVisible &&
                 <UnitActor 
                    key={unit.id} 
                    unit={unit} 
                    owner={gameState.players.find(p => p.id === unit.ownerId)} 
                    isSelected={gameState.selectedUnitId === unit.id} 
                    onClick={(u) => handleUnitClick(u)} 
                 />
            ))}
         </div>
      </div>

      <GameControls 
         gameState={gameState} humanPlayer={gameState.players[0]} onNextTurn={nextTurn}
         onUnitAction={(action) => { 
            if (action === 'FOUND_CITY') onFoundCity(); 
            else if (['BUILD_FARM', 'BUILD_MINE', 'BUILD_PASTURE'].includes(action)) handleUnitAction(action as any);
         }}
         onCityProduce={(t) => setGameState(prev => ({...prev!, cities: prev!.cities.map(c => c.id === prev!.selectedCityId ? {...c, currentProductionTarget: t} : c)}))}
         advisorMessage={advisorMessage} onAskAdvisor={() => getAdvisorTip(gameState).then(setAdvisorMessage)}
         onSelectResearch={(id, type) => {
             const p = gameState.players[0];
             if(type === 'SCIENCE') p.currentTechId = id; else p.currentCivicId = id;
             setGameState({...gameState});
         }} 
         onTogglePolicy={() => {
             // Legacy toggle kept for ResearchPanel compatibility if needed
         }} 
         onZoom={(d) => setZoom(z => d === 'IN' ? z + 0.2 : z - 0.2)}
         onOpenDiplomacy={() => setShowDiplomacy(true)}
         onOpenPolicies={() => setShowPolicies(true)}
      />

      {gameState.selectedTileId && !gameState.selectedUnitId && !gameState.selectedCityId && (
         <TileInfoPanel 
            tile={gameState.tiles.find(t => t.id === gameState.selectedTileId) || null} 
            player={gameState.players[0]} 
         />
      )}

      {showDiplomacy && (
          <DiplomacyPanel 
            humanPlayer={gameState.players[0]} 
            players={gameState.players} 
            onClose={() => setShowDiplomacy(false)}
            onDeclareWar={(id) => handleDiplomacyAction('WAR', id)}
            onMakePeace={(id) => handleDiplomacyAction('PEACE', id)}
            onGift={(id, gold) => handleDiplomacyAction('GIFT', id)}
          />
      )}

      {showPolicies && (
          <PolicyPanel
             player={gameState.players[0]}
             onClose={() => setShowPolicies(false)}
             onTogglePolicy={handleTogglePolicy}
          />
      )}

      {confirmWar && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-slate-800 border border-red-600 p-6 rounded-xl shadow-2xl max-w-md text-center animate-bounce-in">
                  <h2 className="text-2xl font-bold text-red-500 mb-4">⚠️ 선전포고</h2>
                  <p className="text-slate-300 mb-6">상대와 전쟁 상태가 됩니다. 공격하시겠습니까?</p>
                  <div className="flex justify-center gap-4">
                      <button onClick={handleDeclareWar} className="bg-red-600 text-white px-6 py-2 rounded font-bold">공격</button>
                      <button onClick={() => setConfirmWar(null)} className="bg-slate-600 text-white px-6 py-2 rounded">취소</button>
                  </div>
              </div>
          </div>
      )}

      {gameState.selectedCityId && gameState.cities.find(c => c.id === gameState.selectedCityId)?.ownerId === gameState.players[0].id && (
          <CityPanel 
            city={gameState.cities.find(c => c.id === gameState.selectedCityId)!} 
            player={gameState.players[0]} 
            tiles={gameState.tiles}
            onClose={() => setGameState(prev => ({...prev!, selectedCityId: null}))} 
            onProduce={(t) => setGameState(prev => ({...prev!, cities: prev!.cities.map(c => c.id === prev!.selectedCityId ? {...c, currentProductionTarget: t} : c)}))}
            onPurchase={handlePurchase}
            onRename={handleCityRename}
          />
      )}
    </div>
  );
};

export default App;
