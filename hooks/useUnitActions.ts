
import { GameState, Unit, UnitType, City, Player, Tile } from '../types';
import { TERRAIN_COST, UNIT_INFO } from '../constants';
import { getDistance, getNeighbors, updateVisibility, checkMeeting, executeUnitAction, getVillageReward } from '../utils/gameUtils';

export const useUnitActions = (gameState: GameState | null, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, addMessage: (text: string, sender: string) => void) => {
    
    const executeMovePath = (unit: Unit, path: {q: number, r: number}[]) => {
        if (!gameState) return;
        let currentUnit = { ...unit };
        let stepsTaken = 0;
        let newTiles = [...gameState.tiles];
        let newPlayers = [...gameState.players];
        
        // Check if we stepped on a village
        const checkVillage = (u: Unit) => {
            const tIndex = newTiles.findIndex(t => t.q === u.q && t.r === u.r);
            if (tIndex !== -1 && newTiles[tIndex].hasVillage) {
                const pIndex = newPlayers.findIndex(p => p.id === u.ownerId);
                if (pIndex !== -1) {
                    const rewardType = getVillageReward(newPlayers[pIndex]);
                    const p = newPlayers[pIndex];
                    let rewardText = "";
                    
                    if (rewardType === "GOLD") {
                        p.gold += 50;
                        rewardText = "골드 50 획득";
                    } else if (rewardType === "TECH_BOOST") {
                        p.science += 50;
                        rewardText = "과학 50 획득";
                    } else if (rewardType === "POPULATION") {
                        // Nearest city gets pop
                        const myCities = gameState.cities.filter(c => c.ownerId === p.id);
                        const nearest = myCities.sort((a, b) => getDistance(a, u) - getDistance(b, u))[0];
                        if (nearest) {
                            nearest.population += 1;
                            rewardText = `${nearest.name} 인구 증가`;
                        } else {
                            rewardText = "주민들이 환대합니다 (효과 없음)";
                        }
                    } else {
                        rewardText = "정찰병 합류";
                        // Logic to spawn scout handled by calling function usually, but here simplified:
                         p.gold += 30; // Fallback
                         rewardText = "골드 30 획득 (유닛 합류 대신)";
                    }

                    newTiles[tIndex] = { ...newTiles[tIndex], hasVillage: false };
                    addMessage(`부족 마을 발견: ${rewardText}`, "System");
                }
            }
        };

        for (const step of path) {
            const tile = newTiles.find(t => t.q === step.q && t.r === step.r);
            if (!tile) break;
            const cost = TERRAIN_COST[tile.terrain];
            if (currentUnit.movesLeft >= cost) {
                currentUnit.q = step.q;
                currentUnit.r = step.r;
                currentUnit.movesLeft -= cost;
                stepsTaken++;
                checkVillage(currentUnit);
            } else {
                break;
            }
        }

        if (stepsTaken > 0) {
            const updatedUnits = gameState.units.map(u => u.id === unit.id ? currentUnit : u);
            const updatedTiles = updateVisibility(newTiles, updatedUnits, gameState.players[0].id, gameState.cities);
            const updatedPlayers = checkMeeting({ ...gameState, units: updatedUnits, tiles: newTiles, players: newPlayers });
            setGameState(prev => ({ ...prev!, units: updatedUnits, tiles: updatedTiles, players: updatedPlayers, selectedUnitId: currentUnit.movesLeft > 0 ? currentUnit.id : null }));
        } else {
            addMessage("이동력이 부족합니다.", "System");
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

    return { executeMovePath, onFoundCity, handleUnitAction };
};
