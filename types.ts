
export enum TerrainType {
  WATER = 'WATER',
  PLAINS = 'PLAINS',
  GRASSLAND = 'GRASSLAND',
  FOREST = 'FOREST',
  MOUNTAIN = 'MOUNTAIN',
  DESERT = 'DESERT',
  SNOW = 'SNOW',
  TUNDRA = 'TUNDRA'
}

export enum UnitType {
  SETTLER = 'SETTLER',
  BUILDER = 'BUILDER',
  SCOUT = 'SCOUT',
  WARRIOR = 'WARRIOR',
  SLINGER = 'SLINGER',
  ARCHER = 'ARCHER',
  SPEARMAN = 'SPEARMAN',
  HEAVY_CHARIOT = 'HEAVY_CHARIOT',
  SWORDSMAN = 'SWORDSMAN',
  HORSEMAN = 'HORSEMAN',
  CATAPULT = 'CATAPULT',
  CROSSBOWMAN = 'CROSSBOWMAN',
  KNIGHT = 'KNIGHT',
  MUSKETMAN = 'MUSKETMAN',
  CANNON = 'CANNON',
  INFANTRY = 'INFANTRY',
  ARTILLERY = 'ARTILLERY',
  TANK = 'TANK',
  FIGHTER = 'FIGHTER',
  BOMBER = 'BOMBER',
  GALLEY = 'GALLEY',
  QUADRIREME = 'QUADRIREME',
  CARAVEL = 'CARAVEL',
  IRONCLAD = 'IRONCLAD',
  BATTLESHIP = 'BATTLESHIP',
  DESTROYER = 'DESTROYER',
  FISHING_BOAT = 'FISHING_BOAT',
  BARBARIAN_WARRIOR = 'BARBARIAN_WARRIOR'
}

export enum BuildingType {
  MONUMENT = 'MONUMENT',
  GRANARY = 'GRANARY',
  LIBRARY = 'LIBRARY',
  ANCIENT_WALLS = 'ANCIENT_WALLS',
  WATER_MILL = 'WATER_MILL',
  MARKET = 'MARKET',
  UNIVERSITY = 'UNIVERSITY',
  WORKSHOP = 'WORKSHOP',
  BANK = 'BANK',
  FACTORY = 'FACTORY',
  RESEARCH_LAB = 'RESEARCH_LAB'
}

export enum PlayerType {
  HUMAN = 'HUMAN',
  AI = 'AI',
  BARBARIAN = 'BARBARIAN'
}

export interface DiplomaticRelation {
  status: 'WAR' | 'PEACE';
  relationship: number; // 0 to 100
  isOpenBorders: boolean;
}

export interface Coordinates {
  q: number;
  r: number;
}

export interface TileYields {
  food: number;
  production: number;
  gold: number;
  science: number;
  culture: number;
}

export interface Tile {
  id: string;
  q: number;
  r: number;
  terrain: TerrainType;
  isHill: boolean; // New
  hasVillage: boolean; // New
  resource?: 'IRON' | 'HORSES' | 'COAL' | 'OIL' | 'ALUMINUM' | 'URANIUM' | 'WHEAT' | 'GOLD' | 'FISH' | 'WHALES' | 'CATTLE' | 'RICE';
  improvement?: 'FARM' | 'MINE' | 'PASTURE' | 'PLANTATION' | 'FISHING_BOATS' | 'CAMP' | 'OIL_WELL';
  ownerId: string | null;
  isVisible: boolean;
  isDiscovered: boolean;
  rivers?: boolean[]; // [NW, NE, E, SE, SW, W]
}

export interface Unit {
  id: string;
  ownerId: string;
  type: UnitType;
  domain: 'LAND' | 'SEA' | 'AIR';
  q: number;
  r: number;
  health: number;
  movesLeft: number;
  maxMoves: number;
  attackRange: number;
  strength: number;
  buildCharges?: number; 
  isFortified?: boolean;
}

export interface City {
  id: string;
  ownerId: string;
  name: string;
  q: number;
  r: number;
  health: number;
  maxHealth: number;
  production: number;
  food: number;
  population: number;
  currentProductionTarget: UnitType | BuildingType | null;
  workedTiles: Coordinates[];
  buildings: BuildingType[];
  cultureStored: number;
  cultureThreshold: number;
}

export interface Tech {
  id: string;
  name: string;
  description: string;
  cost: number;
  revealResource?: string;
  prerequisites?: string[];
}

export interface Civic {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect?: string;
  prerequisites?: string[];
}

export interface Policy {
    id: string;
    name: string;
    description: string;
    type: 'MILITARY' | 'ECONOMIC' | 'DIPLOMATIC' | 'WILDCARD';
    era: number;
    requiresTech?: string;
    requiresCivic?: string;
}

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  color: string;
  gold: number;
  science: number;
  culture: number;
  scienceYield: number; 
  cultureYield: number; 
  isAlive: boolean;
  leaderName: string;
  currentTechId: string | null;
  currentCivicId: string | null;
  researchedTechs: string[];
  researchedCivics: string[];
  activePolicies: string[]; // Array of Policy IDs
  unlockedPolicies: string[]; // Array of Policy IDs
  diplomacy: Record<string, DiplomaticRelation>;
  metPlayers: string[]; 
}

export interface GameState {
  turn: number;
  tiles: Tile[];
  units: Unit[];
  cities: City[];
  players: Player[];
  currentPlayerIndex: number;
  selectedUnitId: string | null;
  selectedCityId: string | null;
  selectedTileId: string | null;
  messages: GameMessage[];
  gameOver: boolean;
  showDiplomacy: boolean;
  showPolicies: boolean;
}

export interface GameMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
}

export interface GameSettings {
  mapSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  difficulty: 'PRINCE' | 'KING' | 'DEITY';
  playerCount: number;
  playerName: string;
}
