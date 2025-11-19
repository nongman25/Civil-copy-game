
import { useState, useCallback } from 'react';
import { GameState, GameSettings, Player, PlayerType, Tile, Unit, UnitType, City, DiplomaticRelation, BuildingType } from '../types';
import { MAP_SIZES, PLAYER_COLORS, AI_LEADERS, UNIT_INFO, TERRAIN_COST } from '../constants';
import { generateMap, getDistance, getNeighbors, axialToPixel, canMoveTo, findPath, processTurn, updateVisibility, purchaseItem } from '../utils/gameUtils';
import { useCombat } from './useCombat';
import { useUnitActions } from './useUnitActions';

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [phase, setPhase] = useState<'SETUP' | 'GAME'>('SETUP');
  const [confirmWar, setConfirmWar] = useState<{attacker: Unit, defender: Unit} | null>(null);

  const addMessage = useCallback((text: string, sender: string) => {
      setGameState(prev => prev ? ({ ...prev, messages: [...prev.messages, { id: `m-${Date.now()}`, text, sender, timestamp: Date.now() }] }) : null);
  }, []);

  const { handleCombat, handleCityCombat } = useCombat(gameState, setGameState, addMessage);
  const { executeMovePath, onFoundCity, handleUnitAction } = useUnitActions(gameState, setGameState, addMessage);

  const startGame = (settings: GameSettings) => {
    const size = MAP_SIZES[settings.mapSize];
    const mapTiles = generateMap(size.width, size.height);
    
    const human: Player = {
      id: 'p1-human', name: settings.playerName, type: PlayerType.HUMAN, color: PLAYER_COLORS.HUMAN,
      gold: 100, science: 0, culture: 0, scienceYield: 0, cultureYield: 0, isAlive: true, leaderName: settings.playerName,
      currentTechId: null, currentCivicId: null, researchedTechs: [], researchedCivics: [],
      activePolicies: [], unlockedPolicies: [], diplomacy: {}, metPlayers: []
    };

    const ais: Player[] = Array.from({ length: settings.playerCount - 1 }).map((_, i) => ({
      id: `p${i+2}-ai`, name: AI_LEADERS[i].name, type: PlayerType.AI, color: AI_LEADERS[i].color,
      gold: 50, science: 0, culture: 0, scienceYield: 0, cultureYield: 0, isAlive: true, leaderName: AI_LEADERS[i].name,
      currentTechId: null, currentCivicId: null, researchedTechs: [], researchedCivics: [],
      activePolicies: [], unlockedPolicies: [], diplomacy: {}, metPlayers: []
    }));
    
    const barbPlayer: Player = {
        id: 'barbarians', name: '야만인', type: PlayerType.BARBARIAN, color: PLAYER_COLORS.BARBARIAN,
        gold: 0, science: 0, culture: 0, scienceYield: 0, cultureYield: 0, isAlive: true, leaderName: '야만인',
        currentTechId: null, currentCivicId: null, researchedTechs: [], researchedCivics: [],
        activePolicies: [], unlockedPolicies: [], diplomacy: {}, metPlayers: []
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
      gameOver: false, showDiplomacy: false, showPolicies: false
    });
    setPhase('GAME');
    
    return { humanSettler: units.find(u => u.ownerId === human.id && u.type === UnitType.SETTLER) };
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

      // 1. City Selection
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

      // 2. Unit Actions
      if (gameState.selectedUnitId) {
          const unit = gameState.units.find(u => u.id === gameState.selectedUnitId);
          if (unit && unit.ownerId === currentPlayer.id) {
              if (unit.q === tile.q && unit.r === tile.r) {
                  // Click self
              } else {
                  const targetUnit = gameState.units.find(u => u.q === tile.q && u.r === tile.r && u.ownerId !== currentPlayer.id);
                  
                  if (targetUnit) {
                      if (getDistance(unit, targetUnit) <= unit.attackRange && unit.movesLeft > 0) {
                          if (currentPlayer.diplomacy[targetUnit.ownerId]?.status === 'PEACE') {
                              setConfirmWar({ attacker: unit, defender: targetUnit });
                          } else {
                              handleCombat(unit, targetUnit);
                          }
                          return;
                      }
                  }
                  
                  if (!targetUnit || (targetUnit && UNIT_INFO[targetUnit.type].strength === 0)) { 
                      const path = findPath(unit, tile, gameState.units, gameState.cities, gameState.tiles, unit);
                      if (path && path.length > 0) {
                          executeMovePath(unit, path);
                          return;
                      }
                  }
              }
          }
      }

      // 3. Selection Logic (Cycling)
      const unitsOnTile = gameState.units.filter(u => u.q === tile.q && u.r === tile.r && u.ownerId === currentPlayer.id);
      if (unitsOnTile.length > 0) {
          if (gameState.selectedUnitId && unitsOnTile.some(u => u.id === gameState.selectedUnitId)) {
              const currentIndex = unitsOnTile.findIndex(u => u.id === gameState.selectedUnitId);
              const nextIndex = (currentIndex + 1) % unitsOnTile.length;
              const nextUnit = unitsOnTile[nextIndex];
              setGameState(prev => ({ ...prev!, selectedUnitId: nextUnit.id, selectedCityId: null, selectedTileId: tile.id }));
          } else {
              setGameState(prev => ({ ...prev!, selectedUnitId: unitsOnTile[0].id, selectedCityId: null, selectedTileId: tile.id }));
          }
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
