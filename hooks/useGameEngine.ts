
import { useState, useCallback } from 'react';
import { GameState, GameSettings, Player, PlayerType, Tile, Unit, UnitType, City, DiplomaticRelation, BuildingType } from '../types';
import { MAP_SIZES, PLAYER_COLORS, AI_LEADERS, UNIT_INFO, TERRAIN_COST } from '../constants';
import { generateMap, getDistance, getNeighbors, axialToPixel, canMoveTo, findPath, processTurn, updateVisibility, checkMeeting, purchaseItem, executeUnitAction } from '../utils/gameUtils';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<'SETUP' | 'GAME'>('SETUP');
  const [confirmWar, setConfirmWar] = useState<{attacker: Unit, defender: Unit} | null>(null);

  const addMessage = useCallback((text: string, sender: string) => {
      setGameState(prev => prev ? ({ ...prev, messages: [...prev.messages, { id: `m-${Date.now()}`, text, sender, timestamp: Date.now() }] }) : null);
  }, []);

  const startGame = (settings: GameSettings) => {
    const size = MAP_SIZES[settings.mapSize];
    const mapTiles = generateMap(size.width, size.height);
    
    const human: Player = {
      id: 'p1-human', name: settings.playerName, type: PlayerType.HUMAN, color: PLAYER_COLORS.HUMAN,
      gold: 100, science: 0, culture: 0, scienceYield: 0, cultureYield: 0, isAlive: true, leaderName: settings.playerName,
      currentTechId: null, currentCivicId: null, researchedTechs: [], researchedCivics: [],
      activePolicies: { borderExpansion: false }, diplomacy: {}, metPlayers: []
    };

    const ais: Player[] = Array.from({ length: settings.playerCount - 1 }).map((_, i) => ({
      id: `p${i+2}-ai`, name: AI_LEADERS[i].name, type: PlayerType.AI, color: AI_LEADERS[i].color,
      gold: 50, science: 0, culture: 0, scienceYield: 0, cultureYield: 0, isAlive: true, leaderName: AI_LEADERS[i].name,
      currentTechId: null, currentCivicId: null, researchedTechs: [], researchedCivics: [],
      activePolicies: { borderExpansion: false }, diplomacy: {}, metPlayers: []
    }));
    
    const barbPlayer: Player = {
        id: 'barbarians', name: '야만인', type: PlayerType.BARBARIAN, color: PLAYER_COLORS.BARBARIAN,
        gold: 0, science: 0, culture: 0, scienceYield: 0, cultureYield: 0, isAlive: true, leaderName: '야만인',
        currentTechId: null, currentCivicId: null, researchedTechs: [], researchedCivics: [],
        activePolicies: { borderExpansion: false }, diplomacy: {}, metPlayers: []
    };

    const allPlayers = [human, ...ais, barbPlayer];
    allPlayers.forEach(p1 => {
        allPlayers.forEach(p2 => {
            if (p1.id !== p2.id) {
                p1.diplomacy[p2.id] = {
                    status: (p1.type === 'BARBARIAN' || p2.type === 'BARBARIAN') ? 'WAR' : 'PEACE',
                    relationship: 50,
                    isOpenBorders: false
                };
            }
        });
    });

    const units: Unit[] = [];
    const spawnPlayers = [human, ...ais];
    const radius = Math.min(size.width, size.height) / 2 - 4;
    
    spawnPlayers.forEach((player, idx) => {
       const angle = idx * (2 * Math.PI / spawnPlayers.length);
       const q = Math.floor(radius * Math.cos(angle));
       const r = Math.floor(radius * Math.sin(angle));
       const spawnTile = mapTiles
          .filter(t => t.terrain !== 'WATER' && t.terrain !== 'MOUNTAIN' && t.terrain !== 'SNOW')
          .sort((a, b) => getDistance(a, {q, r}) - getDistance(b, {q, r}))[0];

       if (spawnTile) {
           units.push({ id: `u-${player.id}-settler`, ownerId: player.id, type: UnitType.SETTLER, domain: 'LAND', q: spawnTile.q, r: spawnTile.r, health: 100, movesLeft: 2, maxMoves: 2, strength: 0, attackRange: 0 });
           const n = getNeighbors(spawnTile.q, spawnTile.r).find(n => mapTiles.find(t => t.q === n.q && t.r === n.r && t.terrain !== 'WATER' && t.terrain !== 'MOUNTAIN'));
           if (n) units.push({ id: `u-${player.id}-warrior`, ownerId: player.id, type: UnitType.WARRIOR, domain: 'LAND', q: n.q, r: n.r, health: 100, movesLeft: 2, maxMoves: 2, strength: 20, attackRange: 1 });
       }
    });

    const initialTiles = updateVisibility(mapTiles, units, human.id);
    
    setGameState({
      turn: 1, tiles: initialTiles, units, cities: [], players: allPlayers,
      currentPlayerIndex: 0, selectedUnitId: null, selectedCityId: null, selectedTileId: null,
      messages: [{ id: 'msg-0', text: "역사의 여명이 밝았습니다!", sender: "System", timestamp: Date.now() }],
      gameOver: false, showDiplomacy: false
    });
    setPhase('GAME');
    
    return { humanSettler: units.find(u => u.ownerId === human.id && u.type === UnitType.SETTLER) };
  };

  const moveUnit = (unit: Unit, tile: Tile) => {
      if (!gameState) return;
      const cost = TERRAIN_COST[tile.terrain];
      const updatedUnits = gameState.units.map(u => u.id === unit.id ? { ...u, q: tile.q, r: tile.r, movesLeft: u.movesLeft - cost } : u);
      const updatedTiles = updateVisibility(gameState.tiles, updatedUnits, gameState.players[0].id, gameState.cities);
      
      // Update Meeting Logic
      const updatedPlayers = checkMeeting({ ...gameState, units: updatedUnits });

      setGameState(prev => ({ ...prev!, units: updatedUnits, tiles: updatedTiles, players: updatedPlayers, selectedUnitId: unit.movesLeft - cost > 0 ? unit.id : null }));
  };

  const executeMovePath = (unit: Unit, path: {q: number, r: number}[]) => {
     if (!gameState) return;
     let currentUnit = { ...unit };
     let stepsTaken = 0;
     for (const step of path) {
         const tile = gameState.tiles.find(t => t.q === step.q && t.r === step.r);
         if (!tile) break;
         const cost = TERRAIN_COST[tile.terrain];
         if (currentUnit.movesLeft >= cost) {
             currentUnit.q = step.q;
             currentUnit.r = step.r;
             currentUnit.movesLeft -= cost;
             stepsTaken++;
         } else {
             break;
         }
     }
     if (stepsTaken > 0) {
         const updatedUnits = gameState.units.map(u => u.id === unit.id ? currentUnit : u);
         const updatedTiles = updateVisibility(gameState.tiles, updatedUnits, gameState.players[0].id, gameState.cities);
         const updatedPlayers = checkMeeting({ ...gameState, units: updatedUnits });
         setGameState(prev => ({ ...prev!, units: updatedUnits, tiles: updatedTiles, players: updatedPlayers, selectedUnitId: currentUnit.movesLeft > 0 ? currentUnit.id : null }));
     } else {
         addMessage("이동력이 부족합니다.", "System");
     }
  };

  const handleCombat = (attacker: Unit, defender: Unit) => {
     if (!gameState) return;
     const isRanged = UNIT_INFO[attacker.type].range > 1;
     const distance = getDistance(attacker, defender);
     
     let attDmg = 0;
     let defDmg = 0;

     if (isRanged && distance > 1) {
         const dmg = Math.max(10, attacker.strength * 1.5 - defender.strength * 0.5);
         defDmg = dmg;
     } else {
         defDmg = Math.max(10, attacker.strength - defender.strength * 0.5);
         attDmg = Math.max(10, defender.strength - attacker.strength * 0.5);
     }
     
     const newDefHealth = defender.health - defDmg;
     const newAttHealth = attacker.health - attDmg;

     let updatedUnits = gameState.units.map(u => {
         if (u.id === attacker.id) return { ...u, health: newAttHealth, movesLeft: 0 };
         if (u.id === defender.id) return { ...u, health: newDefHealth };
         return u;
     });

     if (newDefHealth <= 0) updatedUnits = updatedUnits.filter(u => u.id !== defender.id);
     if (newAttHealth <= 0) updatedUnits = updatedUnits.filter(u => u.id !== attacker.id);

     setGameState(prev => ({ ...prev!, units: updatedUnits, selectedUnitId: newAttHealth > 0 ? attacker.id : null }));
     addMessage(`전투 결과: 적 ${Math.floor(defDmg)} 피해, 아군 ${Math.floor(attDmg)} 피해`, "System");
  };

  const handleCityCombat = (attacker: Unit, city: City) => {
      if (!gameState) return;
      let dmg = Math.max(5, attacker.strength - 10);
      if (city.health - dmg <= 0) {
          const updatedCities = gameState.cities.map(c => c.id === city.id ? { ...c, ownerId: attacker.ownerId, health: 50 } : c);
          const updatedTiles = gameState.tiles.map(t => {
              if (getDistance(t, city) <= 1) return { ...t, ownerId: attacker.ownerId };
              return t;
          });
          setGameState(prev => ({ ...prev!, cities: updatedCities, tiles: updatedTiles, selectedUnitId: null }));
          addMessage(`${city.name} 점령!`, "System");
      } else {
          const updatedCities = gameState.cities.map(c => c.id === city.id ? { ...c, health: c.health - dmg } : c);
          const updatedUnits = gameState.units.map(u => u.id === attacker.id ? { ...u, movesLeft: 0 } : u);
          setGameState(prev => ({ ...prev!, cities: updatedCities, units: updatedUnits }));
      }
  };

  const onFoundCity = () => {
      if (!gameState || !gameState.selectedUnitId) return;
      const unit = gameState.units.find(u => u.id === gameState.selectedUnitId);
      if (!unit || unit.type !== UnitType.SETTLER || unit.movesLeft <= 0) return;
      const player = gameState.players.find(p => p.id === unit.ownerId);
      if (!player) return;

      if (gameState.cities.some(c => getDistance(c, unit) < 3)) {
          addMessage("다른 도시와 너무 가깝습니다.", "System");
          return;
      }

      const newCity: City = {
          id: `city-${Date.now()}`,
          ownerId: unit.ownerId,
          name: `${player.leaderName}의 도시 ${gameState.cities.filter(c => c.ownerId === player.id).length + 1}`,
          q: unit.q, r: unit.r,
          health: 200, maxHealth: 200,
          production: 0, food: 0, population: 1,
          currentProductionTarget: UnitType.WARRIOR,
          workedTiles: [], 
          buildings: [], cultureStored: 0, cultureThreshold: 50
      };

      const updatedUnits = gameState.units.filter(u => u.id !== unit.id);
      const updatedCities = [...gameState.cities, newCity];
      
      const updatedTiles = gameState.tiles.map(t => {
          if (getDistance(t, unit) <= 1) return { ...t, ownerId: player.id };
          return t;
      });
      
      const visibleTiles = updateVisibility(updatedTiles, updatedUnits, player.id, updatedCities);

      setGameState(prev => ({
          ...prev!,
          units: updatedUnits,
          cities: updatedCities,
          tiles: visibleTiles,
          selectedUnitId: null,
          selectedCityId: newCity.id
      }));
      addMessage(`${newCity.name} 건설됨!`, "System");
  };

  const handleUnitAction = (action: 'BUILD_FARM' | 'BUILD_MINE' | 'BUILD_PASTURE') => {
      if (!gameState || !gameState.selectedUnitId) return;
      const newState = executeUnitAction(gameState, gameState.selectedUnitId, action);
      setGameState(newState);
  };

  const handlePurchase = (item: UnitType | BuildingType) => {
      if (!gameState || !gameState.selectedCityId) return;
      const newState = purchaseItem(gameState, gameState.selectedCityId, item);
      setGameState(newState);
  };

  const handleTileClick = (tile: Tile) => {
      if (!gameState || gameState.gameOver) return;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (currentPlayer.type !== PlayerType.HUMAN) return;

      if (gameState.selectedCityId) {
          const city = gameState.cities.find(c => c.id === gameState.selectedCityId);
          if (city && city.ownerId === currentPlayer.id) {
              const dist = getDistance(city, tile);
              if (dist <= 3 && tile.ownerId === city.ownerId) {
                  if (city.q === tile.q && city.r === tile.r) {
                      setGameState(prev => ({ ...prev!, selectedTileId: tile.id }));
                      return;
                  }
                  const isWorked = city.workedTiles.some(wt => wt.q === tile.q && wt.r === tile.r);
                  if (isWorked) {
                      const newWorked = city.workedTiles.filter(wt => !(wt.q === tile.q && wt.r === tile.r));
                      const updatedCities = gameState.cities.map(c => c.id === city.id ? { ...c, workedTiles: newWorked } : c);
                      setGameState(prev => ({ ...prev!, cities: updatedCities, selectedTileId: tile.id }));
                  } else {
                      if (city.workedTiles.length < city.population) {
                          const newWorked = [...city.workedTiles, { q: tile.q, r: tile.r }];
                          const updatedCities = gameState.cities.map(c => c.id === city.id ? { ...c, workedTiles: newWorked } : c);
                          setGameState(prev => ({ ...prev!, cities: updatedCities, selectedTileId: tile.id }));
                      } else {
                          addMessage("시민 부족 (인구 증가 필요)", "System");
                      }
                  }
                  return;
              }
          }
      }

      if (gameState.selectedUnitId) {
          const unit = gameState.units.find(u => u.id === gameState.selectedUnitId);
          if (unit && unit.ownerId === currentPlayer.id) {
              if (unit.q === tile.q && unit.r === tile.r) {
                  setGameState(prev => ({ ...prev!, selectedUnitId: null, selectedTileId: tile.id }));
                  return;
              }
              
              const targetUnit = gameState.units.find(u => u.q === tile.q && u.r === tile.r);
              if (targetUnit && targetUnit.ownerId !== currentPlayer.id) {
                  if (getDistance(unit, targetUnit) <= unit.attackRange && unit.movesLeft > 0) {
                      if (currentPlayer.diplomacy[targetUnit.ownerId]?.status === 'PEACE') {
                          setConfirmWar({ attacker: unit, defender: targetUnit });
                      } else {
                          handleCombat(unit, targetUnit);
                      }
                      return;
                  }
              }
              
              if (!targetUnit && unit.movesLeft > 0) {
                  const path = findPath(unit, tile, gameState.units, gameState.cities, gameState.tiles, unit);
                  if (path && path.length > 0) {
                      executeMovePath(unit, path);
                      return;
                  }
              }
          }
      }

      const unitOnTile = gameState.units.find(u => u.q === tile.q && u.r === tile.r);
      if (unitOnTile && unitOnTile.ownerId === currentPlayer.id) {
           setGameState(prev => ({ ...prev!, selectedUnitId: unitOnTile.id, selectedCityId: null, selectedTileId: tile.id }));
           return;
      }
      
      const cityOnTile = gameState.cities.find(c => c.q === tile.q && c.r === tile.r);
      if (cityOnTile && cityOnTile.ownerId === currentPlayer.id) {
          setGameState(prev => ({ ...prev!, selectedCityId: cityOnTile.id, selectedUnitId: null, selectedTileId: tile.id }));
          return;
      }

      setGameState(prev => ({ ...prev!, selectedTileId: tile.id, selectedCityId: null, selectedUnitId: null }));
  };

  const nextTurn = () => {
      if (!gameState) return;
      const newState = processTurn(gameState);
      setGameState(newState);
  };

  return {
      gameState, setGameState, phase, confirmWar, setConfirmWar,
      startGame, handleTileClick, nextTurn, handleCityCombat, handleCombat, onFoundCity, handleUnitAction, handlePurchase, addMessage
  };
};
