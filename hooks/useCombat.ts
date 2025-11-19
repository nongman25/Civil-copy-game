
import { GameState, Unit, UnitType, City } from '../types';
import { UNIT_INFO } from '../constants';
import { getDistance } from '../utils/gameUtils';

export const useCombat = (gameState: GameState | null, setGameState: React.Dispatch<React.SetStateAction<GameState | null>>, addMessage: (text: string, sender: string) => void) => {
    
    const handleCombat = (attacker: Unit, defender: Unit) => {
        if (!gameState) return;
        const isRanged = UNIT_INFO[attacker.type].range > 1;
        const distance = getDistance(attacker, defender);
        
        // Civilian Capture Logic
        if (UNIT_INFO[defender.type].strength === 0 && !isRanged) {
            const updatedUnits = gameState.units.map(u => {
                if (u.id === attacker.id) return { ...u, q: defender.q, r: defender.r, movesLeft: 0 };
                if (u.id === defender.id) return { ...u, ownerId: attacker.ownerId, movesLeft: 0 };
                return u;
            });
            
            const capturedName = UNIT_INFO[defender.type].name;
            setGameState(prev => ({ ...prev!, units: updatedUnits, selectedUnitId: attacker.id }));
            addMessage(`${capturedName} 포획 성공!`, "System");
            return;
        }

        // Combat Calc
        let attDmg = 0;
        let defDmg = 0;

        if (isRanged && distance > 1) {
            const dmg = Math.max(10, attacker.strength * 1.5 - defender.strength * 0.5);
            defDmg = dmg;
        } else {
            defDmg = Math.max(10, attacker.strength - defender.strength * 0.5);
            attDmg = Math.max(10, defender.strength - attacker.strength * 0.5);
        }
        
        // Policy Modifier (Discipline)
        const attackerPlayer = gameState.players.find(p => p.id === attacker.ownerId);
        if (attackerPlayer?.activePolicies.includes("DISCIPLINE") && UNIT_INFO[defender.type].name.includes("야만인")) {
             defDmg += 5;
        }
        if (attackerPlayer?.activePolicies.includes("DEFENSE_OF_MOTHERLAND")) {
             // Check if in own territory logic (omitted for brevity or need tile owner check)
        }

        const newDefHealth = defender.health - defDmg;
        const newAttHealth = attacker.health - attDmg;

        let updatedUnits = gameState.units.map(u => {
            if (u.id === attacker.id) return { ...u, health: newAttHealth, movesLeft: 0 };
            if (u.id === defender.id) return { ...u, health: newDefHealth };
            return u;
        });

        if (newDefHealth <= 0) {
            updatedUnits = updatedUnits.filter(u => u.id !== defender.id);
            if (!isRanged && !gameState.cities.some(c => c.q === defender.q && c.r === defender.r)) {
                updatedUnits = updatedUnits.map(u => u.id === attacker.id ? { ...u, q: defender.q, r: defender.r } : u);
            }
        }
        
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

    return { handleCombat, handleCityCombat };
};
