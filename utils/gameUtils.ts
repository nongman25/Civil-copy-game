
import { Coordinates, Tile, TerrainType, Unit, UnitType, GameState, Player, City, PlayerType, TileYields, BuildingType, DiplomaticRelation } from "../types";
import { HEX_HEIGHT, HEX_WIDTH, TERRAIN_COST, UNIT_INFO, TERRAIN_YIELDS, RESOURCE_YIELDS, IMPROVEMENT_YIELDS, BUILDING_INFO, TECH_TREE } from "../constants";

// --- Hex Math ---

export function cubeToAxial(x: number, y: number, z: number): Coordinates {
  return { q: x, r: z };
}

export function axialToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_WIDTH * (q + r / 2);
  const y = HEX_HEIGHT * (r * 0.75);
  return { x, y };
}

export function getDistance(a: Coordinates, b: Coordinates): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

// Visual Directions: 0:NW, 1:NE, 2:E, 3:SE, 4:SW, 5:W
const NEIGHBOR_OFFSETS = [
    { q: 0, r: -1, edgeIdx: 0 }, // NW
    { q: 1, r: -1, edgeIdx: 1 }, // NE
    { q: 1, r: 0, edgeIdx: 2 },  // E
    { q: 0, r: 1, edgeIdx: 3 },  // SE
    { q: -1, r: 1, edgeIdx: 4 }, // SW
    { q: -1, r: 0, edgeIdx: 5 }  // W
];

export function getNeighbors(q: number, r: number): Coordinates[] {
  return NEIGHBOR_OFFSETS.map(d => ({ q: q + d.q, r: r + d.r }));
}

// --- Visibility Logic ---

export function isResourceVisible(resourceName: string | undefined, player: Player): boolean {
    if (!resourceName) return false;
    const revealingTech = TECH_TREE.find(t => t.revealResource === resourceName);
    if (revealingTech) {
        return player.researchedTechs.includes(revealingTech.id);
    }
    return true; // Visible by default if no tech requirement
}

export function getTileYields(tile: Tile, player?: Player): TileYields {
    let base = { ...TERRAIN_YIELDS[tile.terrain] } || { food: 0, production: 0, gold: 0, science: 0, culture: 0 };
    
    // Hill Bonuses
    if (tile.isHill) {
        base.production += 1;
        base.science += 1;
    }

    // River Bonuses
    if (tile.rivers && tile.rivers.some(r => r)) {
        base.food += 1;
    }

    let resYields: Partial<TileYields> = {};
    if (tile.resource) {
        if (player && isResourceVisible(tile.resource, player)) {
            resYields = RESOURCE_YIELDS[tile.resource] || {};
        }
    }

    const imp = tile.improvement ? (IMPROVEMENT_YIELDS[tile.improvement] || {}) : {};

    let total = {
        food: base.food + (resYields.food || 0) + (imp.food || 0),
        production: base.production + (resYields.production || 0) + (imp.production || 0),
        gold: base.gold + (resYields.gold || 0) + (imp.gold || 0),
        science: base.science + (resYields.science || 0) + (imp.science || 0),
        culture: base.culture + (resYields.culture || 0) + (imp.culture || 0)
    };

    // Policy Effects (Tile Based)
    if (player) {
        if (player.activePolicies.includes("FEUDALISM") && tile.improvement === 'FARM') {
             // Feudalism: Farms adjacent to other farms? (Simplified: just +1 food for now per farm)
             total.food += 1; 
        }
        // Add more tile specific policy logic here
    }

    return total;
}

// --- Map Generation ---

function fbm(x: number, y: number, seed: number): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 0.4; 
    for (let i = 0; i < 3; i++) {
        value += (Math.sin(x * frequency + seed) * Math.cos(y * frequency + seed) + 1) / 2 * amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }
    return value; 
}

export function generateMap(width: number, height: number): Tile[] {
  const tiles: Tile[] = [];
  const seed = Math.random() * 1000;

  // 1. Base Terrain
  for (let r = -Math.floor(height/2); r < height/2; r++) {
    const rOffset = Math.floor(r / 2);
    for (let q = -Math.floor(width/2) - rOffset; q < width/2 - rOffset; q++) {
      const id = `${q},${r}`;
      const elevation = fbm(q, r, seed);
      const moisture = fbm(q + 100, r + 100, seed + 50);
      const latitude = Math.abs(r) / (height / 2); 
      const hillNoise = fbm(q + 200, r + 200, seed + 100);
      
      let terrain: TerrainType = TerrainType.WATER;
      if (elevation < 0.35) terrain = TerrainType.WATER;
      else if (elevation > 0.85) terrain = TerrainType.MOUNTAIN;
      else {
          if (latitude > 0.8) terrain = TerrainType.SNOW;
          else if (latitude > 0.6) terrain = TerrainType.TUNDRA;
          else {
              if (moisture > 0.65) terrain = TerrainType.FOREST;
              else if (moisture < 0.2) terrain = TerrainType.DESERT;
              else if (elevation > 0.6) terrain = TerrainType.PLAINS;
              else terrain = TerrainType.GRASSLAND;
          }
      }
      if (latitude > 0.92) terrain = TerrainType.SNOW;

      // Hills Logic: Hills appear on land, not on mountains, random noise
      let isHill = false;
      if (terrain !== TerrainType.WATER && terrain !== TerrainType.MOUNTAIN && hillNoise > 0.6) {
          isHill = true;
      }
      
      let resource: Tile['resource'] = undefined;
      if (terrain !== TerrainType.WATER && terrain !== TerrainType.SNOW && terrain !== TerrainType.MOUNTAIN) {
          const rRand = Math.random();
          if (rRand > 0.97) resource = 'URANIUM';
          else if (rRand > 0.95) resource = 'ALUMINUM';
          else if (rRand > 0.92) resource = 'OIL';
          else if (rRand > 0.89) resource = 'COAL';
          else if (rRand > 0.85) resource = 'IRON';
          else if (rRand > 0.82) resource = 'HORSES';
          else if (rRand > 0.79) resource = 'GOLD';
          else if (rRand > 0.75) resource = 'WHEAT';
          else if (rRand > 0.72) resource = 'CATTLE';
          else if (rRand > 0.70) resource = 'RICE';
      } else if (terrain === TerrainType.WATER) {
           const isCoast = (elevation > 0.2 && elevation < 0.35);
           if (isCoast && Math.random() > 0.80) resource = 'FISH';
           if (!isCoast && Math.random() > 0.90) resource = 'WHALES';
      }

      // Tribal Village Logic
      let hasVillage = false;
      if (terrain !== TerrainType.WATER && terrain !== TerrainType.MOUNTAIN && !resource && Math.random() > 0.97) {
          hasVillage = true;
      }

      tiles.push({
        id, q, r, terrain, resource, isHill, hasVillage,
        ownerId: null, isVisible: false, isDiscovered: false,
        rivers: [false, false, false, false, false, false]
      });
    }
  }

  // 2. River Generation
  const potentialSources = tiles.filter(t => t.terrain === TerrainType.MOUNTAIN || t.terrain === TerrainType.SNOW);
  const RIVER_CHANCE = 0.6;

  potentialSources.forEach(source => {
      if (Math.random() > RIVER_CHANCE) return;

      let current = source;
      let steps = 0;
      
      while (steps < 25) {
          let lowestNeighbor: Tile | null = null;
          let minElev = fbm(current.q, current.r, seed);
          let chosenEdgeIdx = -1;

          const neighbors = NEIGHBOR_OFFSETS.map(o => ({
              t: tiles.find(t => t.q === current.q + o.q && t.r === current.r + o.r),
              idx: o.edgeIdx
          })).filter(n => n.t);

          for (const n of neighbors) {
             const elev = fbm(n.t!.q, n.t!.r, seed);
             if (elev < minElev) {
                 minElev = elev;
                 lowestNeighbor = n.t!;
                 chosenEdgeIdx = n.idx;
             }
          }

          if (lowestNeighbor && chosenEdgeIdx !== -1) {
              current.rivers![chosenEdgeIdx] = true;
              // The neighbor shares the opposite edge
              const oppositeEdgeIdx = (chosenEdgeIdx + 3) % 6;
              lowestNeighbor.rivers![oppositeEdgeIdx] = true;

              if (lowestNeighbor.terrain === TerrainType.WATER) break;
              current = lowestNeighbor;
              steps++;
          } else {
              break;
          }
      }
  });

  return tiles;
}

// --- Game State Logic ---

export function canMoveTo(unit: Unit, targetTile: Tile, allUnits: Unit[], allCities: City[], tiles: Tile[]): boolean {
  const unitInfo = UNIT_INFO[unit.type];
  const domain = unitInfo.domain;
  
  if (domain === 'LAND' && targetTile.terrain === TerrainType.WATER) return false;
  if (domain === 'SEA' && targetTile.terrain !== TerrainType.WATER) return false; 
  if (domain === 'AIR') return true; 

  const cost = TERRAIN_COST[targetTile.terrain];
  if (cost >= 999) return false;

  // Check unit stacking rules
  const unitsOnTile = allUnits.filter(u => u.q === targetTile.q && u.r === targetTile.r && u.id !== unit.id);
  
  if (unitsOnTile.length > 0) {
      const enemy = unitsOnTile.find(u => u.ownerId !== unit.ownerId);
      if (enemy) return true; // Can move to attack

      const isMyCombat = unitInfo.strength > 0;
      const isMyCivilian = !isMyCombat;

      for (const u of unitsOnTile) {
          const isTargetCombat = UNIT_INFO[u.type].strength > 0;
          
          if (isMyCombat && isTargetCombat) return false; 
          if (isMyCivilian && !isTargetCombat) return false;
      }
  }

  return true;
}

export function spawnBarbarians(gameState: GameState): Unit[] {
    const newBarbarians: Unit[] = [];
    if (gameState.turn < 10) return [];
    if (Math.random() > 0.15) return []; 

    const fogTiles = gameState.tiles.filter(t => 
        !t.isVisible && 
        t.terrain !== TerrainType.WATER && 
        t.terrain !== TerrainType.MOUNTAIN &&
        t.terrain !== TerrainType.SNOW &&
        !gameState.units.some(u => u.q === t.q && u.r === t.r) &&
        !gameState.cities.some(c => c.q === t.q && c.r === t.r)
    );

    if (fogTiles.length > 0) {
        const spawnTile = fogTiles[Math.floor(Math.random() * fogTiles.length)];
        newBarbarians.push({
            id: `barb-${gameState.turn}-${Math.random()}`,
            ownerId: 'barbarians',
            type: UnitType.BARBARIAN_WARRIOR, 
            domain: 'LAND',
            q: spawnTile.q, r: spawnTile.r,
            health: 100,
            movesLeft: 0, maxMoves: 2,
            strength: Math.min(50, 18 + Math.floor(gameState.turn / 5)), 
            attackRange: 1
        });
    }
    return newBarbarians;
}

// Helper to find a valid spawn spot
export function findSpawnSpot(city: City, unitType: UnitType, tiles: Tile[], units: Unit[]): Coordinates | null {
    const info = UNIT_INFO[unitType];
    const domain = info.domain;
    const centerTile = tiles.find(t => t.q === city.q && t.r === city.r);
    
    if (centerTile) {
        const isLand = domain === 'LAND';
        const validTerrain = isLand ? centerTile.terrain !== TerrainType.WATER : centerTile.terrain === TerrainType.WATER; 
        
        if (validTerrain) {
            const unitsHere = units.filter(u => u.q === city.q && u.r === city.r);
            let canStack = true;
            const isMyCombat = info.strength > 0;
            const isMyCivilian = !isMyCombat;

            for (const u of unitsHere) {
                const isTargetCombat = UNIT_INFO[u.type].strength > 0;
                if (isMyCombat && isTargetCombat) { canStack = false; break; }
                if (isMyCivilian && !isTargetCombat) { canStack = false; break; }
            }

            if (canStack) return { q: city.q, r: city.r };
        }
    }

    const neighbors = getNeighbors(city.q, city.r);
    for (const n of neighbors) {
        const tile = tiles.find(t => t.q === n.q && t.r === n.r);
        if (!tile) continue;
        
        const isWater = tile.terrain === TerrainType.WATER;
        if (domain === 'LAND' && isWater) continue;
        if (domain === 'SEA' && !isWater) continue;
        if (tile.terrain === TerrainType.MOUNTAIN) continue;

        const unitsHere = units.filter(u => u.q === n.q && u.r === n.r);
        let canStack = true;
        const isMyCombat = info.strength > 0;
        const isMyCivilian = !isMyCombat;

        for (const u of unitsHere) {
            const isTargetCombat = UNIT_INFO[u.type].strength > 0;
            if (isMyCombat && isTargetCombat) { canStack = false; break; }
            if (isMyCivilian && !isTargetCombat) { canStack = false; break; }
        }

        if (canStack) return { q: n.q, r: n.r };
    }

    return null;
}

export function getVillageReward(player: Player): string {
    const rand = Math.random();
    if (rand < 0.3) {
        return "GOLD";
    } else if (rand < 0.6) {
        return "TECH_BOOST";
    } else if (rand < 0.8) {
        return "POPULATION";
    } else {
        return "SCOUT";
    }
}

export function processTurn(gameState: GameState): GameState {
    let nextState = { ...gameState, selectedUnitId: null, selectedCityId: null, selectedTileId: null };
      
    const aiRes = calculateAiMoves(nextState);
    nextState.units = aiRes.updatedUnits;
    nextState.cities = [...aiRes.updatedCities, ...aiRes.newCities];
    
    const barbs = spawnBarbarians(nextState);
    nextState.units = [...nextState.units, ...barbs];

    nextState.players = nextState.players.map(p => {
        let turnScience = 0, turnCulture = 0, turnGold = 0;
        
        // City Yields
        nextState.cities.filter(c => c.ownerId === p.id).forEach(c => {
             const centerTile = nextState.tiles.find(t => t.q === c.q && t.r === c.r);
             if(centerTile) {
                 const centerY = getTileYields(centerTile, p);
                 turnScience += centerY.science;
                 turnCulture += centerY.culture;
                 turnGold += centerY.gold;
                 
                 // Base City Bonus
                 turnScience += 1; 
                 turnCulture += 1;
             }

             c.workedTiles.forEach(wt => {
                 const t = nextState.tiles.find(tile => tile.q === wt.q && tile.r === wt.r);
                 if (t) {
                     const y = getTileYields(t, p);
                     turnScience += y.science; 
                     turnCulture += y.culture; 
                     turnGold += y.gold;
                 }
             });
             
             c.buildings.forEach(bId => {
                 const b = BUILDING_INFO[bId];
                 if(b.yields.science) turnScience += b.yields.science;
                 if(b.yields.culture) turnCulture += b.yields.culture;
                 if(b.yields.gold) turnGold += b.yields.gold;
             });
             
             if (p.activePolicies.includes("URBAN_PLANNING")) turnScience += 0; // Only Prod
             if (p.activePolicies.includes("GOD_KING")) { turnGold += 1; } // And Faith
             if (p.activePolicies.includes("TRADE_CONFEDERATION")) { turnScience += 1; turnCulture += 1; } // Simplified as passive
        });
        
        return {
            ...p,
            science: p.science + turnScience,
            culture: p.culture + turnCulture,
            gold: p.gold + turnGold,
            scienceYield: Math.floor(turnScience),
            cultureYield: Math.floor(turnCulture)
        };
    });

    // City Growth and Production
    nextState.cities = nextState.cities.map(c => {
        // 1. Healing
        let newHealth = Math.min(c.maxHealth, c.health + 5);
        
        // 2. Production
        let prod = c.production;
        const owner = nextState.players.find(p => p.id === c.ownerId);
        let turnProd = 0;
        let turnFood = 0;

        if (owner) {
             const centerTile = nextState.tiles.find(t => t.q === c.q && t.r === c.r);
             if(centerTile) {
                 const y = getTileYields(centerTile, owner);
                 turnProd += Math.max(1, y.production);
                 turnFood += Math.max(2, y.food);
             }

             c.workedTiles.forEach(wt => {
                 const t = nextState.tiles.find(tile => tile.q === wt.q && tile.r === wt.r);
                 if (t) {
                     const y = getTileYields(t, owner);
                     turnProd += y.production;
                     turnFood += y.food;
                 }
             });
             
             c.buildings.forEach(b => {
                 const info = BUILDING_INFO[b];
                 if(info.yields.production) turnProd += info.yields.production;
                 if(info.yields.food) turnFood += info.yields.food;
                 if(b === BuildingType.FACTORY || b === BuildingType.WORKSHOP) turnProd += 3;
             });
             
             if (owner.activePolicies.includes("URBAN_PLANNING")) turnProd += 1;

             prod += turnProd;
             
             // Production Completion Logic
             let targetCost = 9999;
             if (c.currentProductionTarget) {
                  if (c.currentProductionTarget in UNIT_INFO) targetCost = UNIT_INFO[c.currentProductionTarget as UnitType].cost;
                  else targetCost = BUILDING_INFO[c.currentProductionTarget as BuildingType].cost;
                  
                  if (prod >= targetCost) {
                      prod = 0;
                      if (c.currentProductionTarget in UNIT_INFO) {
                           const type = c.currentProductionTarget as UnitType;
                           const spawnSpot = findSpawnSpot(c, type, nextState.tiles, nextState.units);
                           
                           if (spawnSpot) {
                               nextState.units.push({
                                   id: `u-${Date.now()}-${Math.random()}`, ownerId: c.ownerId, type, domain: UNIT_INFO[type].domain,
                                   q: spawnSpot.q, r: spawnSpot.r, health: 100, movesLeft: 0, maxMoves: UNIT_INFO[type].maxMoves,
                                   strength: UNIT_INFO[type].strength, attackRange: UNIT_INFO[type].range,
                                   buildCharges: UNIT_INFO[type].buildCharges
                               });
                               nextState.messages.push({ id: `m-${Date.now()}`, text: `${c.name}: ${UNIT_INFO[type].name} 생산 완료`, sender: "System", timestamp: Date.now() });
                           } else {
                               nextState.messages.push({ id: `m-${Date.now()}`, text: `${c.name}: 유닛을 배치할 공간이 없습니다!`, sender: "System", timestamp: Date.now() });
                           }
                      } else {
                           const type = c.currentProductionTarget as BuildingType;
                           c.buildings.push(type);
                           if (type === BuildingType.ANCIENT_WALLS) c.maxHealth += 100;
                           nextState.messages.push({ id: `m-${Date.now()}`, text: `${c.name}: ${BUILDING_INFO[type].name} 건설 완료`, sender: "System", timestamp: Date.now() });
                      }
                      c.currentProductionTarget = null;
                  }
             }
        }

        // 3. Population & Food Logic
        const foodConsumed = c.population * 2; 
        const surplus = turnFood - foodConsumed;
        let storedFood = c.food + surplus;
        let population = c.population;
        
        const growthThreshold = Math.floor(10 + (population * 4) + (Math.pow(population, 1.2)));

        if (storedFood >= growthThreshold) {
            population += 1;
            storedFood -= growthThreshold;
            nextState.messages.push({ id: `m-growth-${Date.now()}`, text: `${c.name} 인구 증가 (${population})`, sender: "System", timestamp: Date.now() });
        } else if (storedFood < -20) {
            if (population > 1) {
                population -= 1;
                storedFood = 0;
                nextState.messages.push({ id: `m-starve-${Date.now()}`, text: `${c.name} 기근 발생! 인구 감소`, sender: "System", timestamp: Date.now() });
            } else {
                storedFood = -20; 
            }
        }

        // Culture Growth
        let cultureStored = c.cultureStored + (1 + c.population * 0.3);
        let cultureThreshold = c.cultureThreshold;
        if (cultureStored >= cultureThreshold) {
             cultureStored = 0; 
             cultureThreshold *= 1.2;
             // Border expansion (Simple implementation: no-op visual change for now, or handled in rendering bounds)
        }

        return { ...c, health: newHealth, production: prod, food: storedFood, population, cultureStored, cultureThreshold };
    });

    nextState.turn += 1;
    nextState.units.forEach(u => u.movesLeft = u.maxMoves);

    return nextState;
}

export function executeUnitAction(gameState: GameState, unitId: string, action: 'BUILD_FARM' | 'BUILD_MINE' | 'BUILD_PASTURE'): GameState {
    const unit = gameState.units.find(u => u.id === unitId);
    if (!unit) return gameState;

    if (unit.type !== UnitType.BUILDER) return gameState;
    if ((unit.buildCharges || 0) <= 0) return gameState;
    if (unit.movesLeft <= 0) return gameState;

    const tile = gameState.tiles.find(t => t.q === unit.q && t.r === unit.r);
    if (!tile) return gameState;

    let improvement: Tile['improvement'] = undefined;
    
    if (action === 'BUILD_FARM') {
        if (tile.terrain === TerrainType.PLAINS || tile.terrain === TerrainType.GRASSLAND) {
            improvement = 'FARM';
        }
    } else if (action === 'BUILD_MINE') {
        if (tile.resource === 'IRON' || tile.resource === 'COAL' || tile.resource === 'ALUMINUM' || tile.resource === 'URANIUM') {
            improvement = 'MINE';
        } else if (tile.terrain === TerrainType.PLAINS || tile.terrain === TerrainType.GRASSLAND || tile.terrain === TerrainType.DESERT || tile.terrain === TerrainType.TUNDRA || tile.isHill) {
             improvement = 'MINE'; 
        }
    } else if (action === 'BUILD_PASTURE') {
        if (tile.resource === 'HORSES' || tile.resource === 'CATTLE') {
            improvement = 'PASTURE';
        }
    }

    // Fallback force build
    if (!improvement) {
        if (action === 'BUILD_FARM') improvement = 'FARM';
        if (action === 'BUILD_MINE') improvement = 'MINE';
        if (action === 'BUILD_PASTURE') improvement = 'PASTURE';
    }

    if (improvement) {
        const updatedTiles = gameState.tiles.map(t => t.id === tile.id ? { ...t, improvement: improvement } : t);
        
        let unitDeleted = false;
        let updatedUnits = gameState.units.map(u => {
            if (u.id === unit.id) {
                const newCharges = (u.buildCharges || 0) - 1;
                if (newCharges <= 0) {
                    unitDeleted = true;
                    return null;
                }
                return { ...u, buildCharges: newCharges, movesLeft: 0 };
            }
            return u;
        }).filter(u => u !== null) as Unit[];

        const msgs = [...gameState.messages, { id: `m-build-${Date.now()}`, text: "시설 건설 완료", sender: "System", timestamp: Date.now() }];
        if (unitDeleted) {
            msgs.push({ id: `m-build-end-${Date.now()}`, text: "건설자가 소모되었습니다.", sender: "System", timestamp: Date.now() });
        }

        return {
            ...gameState,
            tiles: updatedTiles,
            units: updatedUnits,
            selectedUnitId: unitDeleted ? null : unitId,
            messages: msgs
        };
    }
    
    return gameState;
}

export function purchaseItem(gameState: GameState, cityId: string, item: UnitType | BuildingType): GameState {
    const city = gameState.cities.find(c => c.id === cityId);
    const player = gameState.players.find(p => p.id === city?.ownerId);
    if (!city || !player) return gameState;

    const isUnit = item in UNIT_INFO;
    const cost = isUnit ? UNIT_INFO[item as UnitType].cost : BUILDING_INFO[item as BuildingType].cost;
    const goldPrice = cost * 4;

    if (player.gold >= goldPrice) {
        const updatedPlayers = gameState.players.map(p => p.id === player.id ? { ...p, gold: p.gold - goldPrice } : p);
        const updatedCities = gameState.cities.map(c => c.id === city.id ? { ...c, buildings: isUnit ? c.buildings : [...c.buildings, item as BuildingType] } : c);
        let updatedUnits = [...gameState.units];

        if (isUnit) {
            const type = item as UnitType;
            const spawnSpot = findSpawnSpot(city, type, gameState.tiles, gameState.units);
            
            if (spawnSpot) {
                const info = UNIT_INFO[type];
                updatedUnits.push({
                    id: `u-${Date.now()}-${Math.random()}`, ownerId: player.id, type, domain: info.domain,
                    q: spawnSpot.q, r: spawnSpot.r, health: 100, movesLeft: 0, maxMoves: info.maxMoves,
                    strength: info.strength, attackRange: info.range, buildCharges: info.buildCharges
                });
            } else {
                return gameState; 
            }
        } else {
             if (item === BuildingType.ANCIENT_WALLS) updatedCities.find(c => c.id === city.id)!.maxHealth += 100;
        }

        return {
            ...gameState,
            players: updatedPlayers,
            cities: updatedCities,
            units: updatedUnits,
            messages: [...gameState.messages, { id: `m-${Date.now()}`, text: `${city.name}: ${isUnit ? UNIT_INFO[item as UnitType].name : BUILDING_INFO[item as BuildingType].name} 구매 완료`, sender: "System", timestamp: Date.now() }]
        };
    }
    return gameState;
}

function calculateAiMoves(gameState: GameState) {
  let updatedUnits = [...gameState.units];
  const updatedCities = [...gameState.cities];
  const newCities: City[] = [];
  const removedUnits: string[] = [];

  const aiPlayers = gameState.players.filter(p => p.type === PlayerType.AI);
  
  aiPlayers.forEach(player => {
      const myUnits = updatedUnits.filter(u => u.ownerId === player.id);
      myUnits.forEach(unit => {
          unit.movesLeft = unit.maxMoves;
          const neighbors = getNeighbors(unit.q, unit.r);
          
          const enemy = updatedUnits.find(u => u.ownerId !== player.id && neighbors.some(n => n.q === u.q && n.r === u.r));
          if (enemy) {
              if (UNIT_INFO[enemy.type].strength === 0) {
                  enemy.ownerId = player.id;
                  enemy.movesLeft = 0;
                  unit.movesLeft = 0;
                  unit.q = enemy.q;
                  unit.r = enemy.r;
              } else {
                  enemy.health -= 20;
                  unit.movesLeft = 0;
                  if (enemy.health <= 0) removedUnits.push(enemy.id);
              }
          } else if (unit.movesLeft > 0) {
              const validMoves = neighbors.filter(n => {
                const t = gameState.tiles.find(tile => tile.q === n.q && tile.r === n.r);
                return t && canMoveTo(unit, t, updatedUnits, updatedCities, gameState.tiles);
              });
              if (validMoves.length > 0) {
                 const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                 unit.q = move.q;
                 unit.r = move.r;
                 unit.movesLeft--;
              }
          }

          if (unit.type === UnitType.SETTLER && Math.random() > 0.8) {
              if (!updatedCities.some(c => getDistance(c, unit) < 4)) {
                 newCities.push({
                     id: `c-${Math.random()}`,
                     ownerId: player.id,
                     name: `${player.leaderName}의 도시`,
                     q: unit.q, r: unit.r,
                     health: 200, maxHealth: 200,
                     production: 0, food: 0, population: 1,
                     currentProductionTarget: UnitType.WARRIOR,
                     workedTiles: [], buildings: [], cultureStored: 0, cultureThreshold: 50
                 });
                 removedUnits.push(unit.id);
                 getNeighbors(unit.q, unit.r).forEach(n => {
                    const t = gameState.tiles.find(tile => tile.q === n.q && tile.r === n.r);
                    if (t && !t.ownerId) t.ownerId = player.id;
                 });
              }
          }
      });
  });

  return { 
      updatedUnits: updatedUnits.filter(u => !removedUnits.includes(u.id)), 
      updatedCities, 
      newCities 
  };
}

export function checkMeeting(gameState: GameState): Player[] {
    const human = gameState.players[0];
    const updatedPlayers = [...gameState.players];
    const myAssets = [...gameState.units.filter(u => u.ownerId === human.id), ...gameState.cities.filter(c => c.ownerId === human.id)];

    gameState.players.forEach(opponent => {
        if (opponent.id === human.id || human.metPlayers.includes(opponent.id)) return;
        
        const opAssets = [...gameState.units.filter(u => u.ownerId === opponent.id), ...gameState.cities.filter(c => c.ownerId === opponent.id)];
        let met = false;

        for (const my of myAssets) {
            for (const op of opAssets) {
                if (getDistance(my, op) <= 4) { 
                    met = true;
                    break;
                }
            }
            if (met) break;
        }

        if (met) {
            const humanIdx = updatedPlayers.findIndex(p => p.id === human.id);
            const opIdx = updatedPlayers.findIndex(p => p.id === opponent.id);
            
            updatedPlayers[humanIdx] = { ...updatedPlayers[humanIdx], metPlayers: [...updatedPlayers[humanIdx].metPlayers, opponent.id] };
            updatedPlayers[opIdx] = { ...updatedPlayers[opIdx], metPlayers: [...updatedPlayers[opIdx].metPlayers, human.id] };
        }
    });

    return updatedPlayers;
}

export const updateVisibility = (tiles: Tile[], units: Unit[], playerId: string, cities: City[] = []): Tile[] => {
    const newTiles = tiles.map(t => ({ ...t }));
    const myAssets = [...units.filter(u => u.ownerId === playerId), ...cities.filter(c => c.ownerId === playerId)];

    myAssets.forEach(asset => {
       const viewRange = (asset as any).type === UnitType.SCOUT ? 3 : 2; 
       newTiles.forEach(tile => {
          if (getDistance({q: asset.q, r: asset.r}, {q: tile.q, r: tile.r}) <= viewRange) {
              tile.isVisible = true;
              tile.isDiscovered = true;
          }
       });
    });
    return newTiles;
};

export function findPath(start: Coordinates, end: Coordinates, units: Unit[], cities: City[], tiles: Tile[], movingUnit: Unit): Coordinates[] | null {
  // Simple A*
  const openSet: { q: number; r: number; cost: number; est: number; parent: any }[] = [];
  const closedSet = new Set<string>();

  openSet.push({ q: start.q, r: start.r, cost: 0, est: getDistance(start, end), parent: null });

  while (openSet.length > 0) {
    openSet.sort((a, b) => (a.cost + a.est) - (b.cost + b.est));
    const current = openSet.shift()!;

    if (current.q === end.q && current.r === end.r) {
      const path: Coordinates[] = [];
      let curr = current;
      while (curr.parent) {
        path.push({ q: curr.q, r: curr.r });
        curr = curr.parent;
      }
      return path.reverse();
    }

    closedSet.add(`${current.q},${current.r}`);

    const neighbors = getNeighbors(current.q, current.r);
    for (const n of neighbors) {
        if (closedSet.has(`${n.q},${n.r}`)) continue;

        const tile = tiles.find(t => t.q === n.q && t.r === n.r);
        if (!tile) continue;

        if (!canMoveTo(movingUnit, tile, units, cities, tiles)) continue;

        const gScore = current.cost + TERRAIN_COST[tile.terrain];
        const existing = openSet.find(o => o.q === n.q && o.r === n.r);
        
        if (existing) {
            if (gScore < existing.cost) {
                existing.cost = gScore;
                existing.parent = current;
            }
        } else {
            openSet.push({
                q: n.q, r: n.r,
                cost: gScore,
                est: getDistance(n, end),
                parent: current
            });
        }
    }
  }
  return null;
}
