
import { TerrainType, UnitType, BuildingType, Tech, Civic, TileYields, Policy } from "./types";

export const HEX_SIZE = 42; 
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

export const MAP_SIZES = {
  SMALL: { width: 20, height: 18 },
  MEDIUM: { width: 30, height: 24 },
  LARGE: { width: 40, height: 30 },
};

export const ERAS = {
    0: "고대 시대",
    1: "고전 시대",
    2: "중세 시대",
    3: "르네상스 시대",
    4: "산업 시대",
    5: "현대 시대",
    6: "원자력 시대"
};

// 30% Cost Reduction Applied
export const UNIT_INFO: Record<UnitType, { name: string; description: string; domain: 'LAND' | 'SEA' | 'AIR'; maxMoves: number; strength: number; range: number; cost: number; requiredTech: string | null; buildCharges?: number }> = {
  [UnitType.SETTLER]: { name: "개척자", description: "새로운 도시를 건설합니다.", domain: 'LAND', maxMoves: 2, strength: 0, range: 0, cost: 56, requiredTech: null },
  [UnitType.BUILDER]: { name: "건설자", description: "타일 시설을 건설합니다.", domain: 'LAND', maxMoves: 2, strength: 0, range: 0, cost: 35, requiredTech: null, buildCharges: 3 },
  [UnitType.SCOUT]: { name: "정찰병", description: "빠른 이동 속도로 지도를 밝힙니다.", domain: 'LAND', maxMoves: 3, strength: 10, range: 1, cost: 20, requiredTech: null },
  [UnitType.WARRIOR]: { name: "전사", description: "기본 근접 유닛입니다.", domain: 'LAND', maxMoves: 2, strength: 20, range: 1, cost: 28, requiredTech: null },
  [UnitType.SLINGER]: { name: "투석병", description: "취약하지만 선제 공격이 가능합니다.", domain: 'LAND', maxMoves: 2, strength: 15, range: 1, cost: 25, requiredTech: null },
  [UnitType.ARCHER]: { name: "궁수", description: "원거리 공격 유닛입니다.", domain: 'LAND', maxMoves: 2, strength: 15, range: 2, cost: 42, requiredTech: "ARCHERY" },
  [UnitType.SPEARMAN]: { name: "창병", description: "기병에게 강력합니다.", domain: 'LAND', maxMoves: 2, strength: 25, range: 1, cost: 45, requiredTech: "BRONZE_WORKING" },
  [UnitType.HEAVY_CHARIOT]: { name: "중전차", description: "평지에서 강력한 기동성을 가집니다.", domain: 'LAND', maxMoves: 4, strength: 28, range: 1, cost: 45, requiredTech: "WHEEL" },
  [UnitType.SWORDSMAN]: { name: "검사", description: "철이 필요한 강력한 보병입니다.", domain: 'LAND', maxMoves: 2, strength: 35, range: 1, cost: 63, requiredTech: "IRON_WORKING" },
  [UnitType.HORSEMAN]: { name: "기마병", description: "말 자원을 사용하는 빠른 유닛입니다.", domain: 'LAND', maxMoves: 4, strength: 36, range: 1, cost: 55, requiredTech: "HORSEBACK_RIDING" },
  [UnitType.CATAPULT]: { name: "투석기", description: "도시 공격에 효과적입니다.", domain: 'LAND', maxMoves: 2, strength: 25, range: 2, cost: 84, requiredTech: "MATHEMATICS" },
  [UnitType.CROSSBOWMAN]: { name: "석궁병", description: "강력한 중세 원거리 유닛입니다.", domain: 'LAND', maxMoves: 2, strength: 30, range: 2, cost: 126, requiredTech: "MACHINERY" },
  [UnitType.KNIGHT]: { name: "기사", description: "중세의 강력한 기병입니다.", domain: 'LAND', maxMoves: 4, strength: 48, range: 1, cost: 140, requiredTech: "STIRRUPS" },
  [UnitType.MUSKETMAN]: { name: "머스킷병", description: "화약을 사용하는 르네상스 보병입니다.", domain: 'LAND', maxMoves: 2, strength: 55, range: 1, cost: 168, requiredTech: "GUNPOWDER" },
  [UnitType.CANNON]: { name: "대포", description: "성벽을 파괴하는 공성 유닛입니다.", domain: 'LAND', maxMoves: 2, strength: 45, range: 2, cost: 190, requiredTech: "METAL_CASTING" },
  [UnitType.INFANTRY]: { name: "보병", description: "현대적인 소총수입니다.", domain: 'LAND', maxMoves: 2, strength: 70, range: 1, cost: 300, requiredTech: "REPLACEABLE_PARTS" },
  [UnitType.ARTILLERY]: { name: "야포", description: "장거리 포격이 가능합니다.", domain: 'LAND', maxMoves: 2, strength: 60, range: 3, cost: 320, requiredTech: "STEEL" },
  [UnitType.TANK]: { name: "탱크", description: "현대전의 주력 기갑 유닛입니다.", domain: 'LAND', maxMoves: 5, strength: 80, range: 1, cost: 350, requiredTech: "COMBUSTION" },
  [UnitType.FIGHTER]: { name: "전투기", description: "제공권을 장악합니다.", domain: 'AIR', maxMoves: 10, strength: 85, range: 4, cost: 380, requiredTech: "FLIGHT" },
  [UnitType.BOMBER]: { name: "폭격기", description: "도시와 유닛을 폭격합니다.", domain: 'AIR', maxMoves: 12, strength: 85, range: 6, cost: 420, requiredTech: "ADVANCED_FLIGHT" },
  
  [UnitType.GALLEY]: { name: "갤리선", description: "초기 해상 유닛.", domain: 'SEA', maxMoves: 3, strength: 25, range: 1, cost: 45, requiredTech: "SAILING" },
  [UnitType.QUADRIREME]: { name: "사단노선", description: "원거리 해상 공격.", domain: 'SEA', maxMoves: 3, strength: 20, range: 2, cost: 84, requiredTech: "SHIPBUILDING" },
  [UnitType.CARAVEL]: { name: "캐러벨", description: "대양 항해가 가능합니다.", domain: 'SEA', maxMoves: 4, strength: 50, range: 1, cost: 160, requiredTech: "CARTOGRAPHY" },
  [UnitType.IRONCLAD]: { name: "철갑선", description: "증기력을 사용하는 해군.", domain: 'SEA', maxMoves: 5, strength: 60, range: 1, cost: 260, requiredTech: "STEAM_POWER" },
  [UnitType.BATTLESHIP]: { name: "전함", description: "강력한 함포 사격.", domain: 'SEA', maxMoves: 5, strength: 70, range: 3, cost: 380, requiredTech: "STEEL" },
  [UnitType.DESTROYER]: { name: "구축함", description: "잠수함 탐지 및 빠른 이동.", domain: 'SEA', maxMoves: 6, strength: 75, range: 1, cost: 350, requiredTech: "COMBUSTION" },
  [UnitType.FISHING_BOAT]: { name: "어선", description: "해양 자원 채취 (1회용).", domain: 'SEA', maxMoves: 3, strength: 0, range: 0, cost: 28, requiredTech: "SAILING", buildCharges: 1 },
  
  [UnitType.BARBARIAN_WARRIOR]: { name: "야만인 전사", description: "적대적 유닛", domain: 'LAND', maxMoves: 2, strength: 18, range: 1, cost: 0, requiredTech: null }
};

export const BUILDING_INFO: Record<BuildingType, { name: string; cost: number; yields: Partial<TileYields>; tech: string | null; desc: string }> = {
    [BuildingType.MONUMENT]: { name: "기념비", cost: 42, yields: { culture: 2 }, tech: null, desc: "+2 문화" },
    [BuildingType.GRANARY]: { name: "곡창", cost: 46, yields: { food: 2 }, tech: "POTTERY", desc: "+2 식량, 주거공간 제공" },
    [BuildingType.ANCIENT_WALLS]: { name: "고대 성벽", cost: 56, yields: {}, tech: "MASONRY", desc: "도시 방어력 +50, 체력 +100" },
    [BuildingType.LIBRARY]: { name: "도서관", cost: 56, yields: { science: 2 }, tech: "WRITING", desc: "+2 과학" },
    [BuildingType.WATER_MILL]: { name: "물레방아", cost: 56, yields: { food: 1, production: 1 }, tech: "WHEEL", desc: "+1 식량, +1 생산 (강 인접 필요)" },
    [BuildingType.MARKET]: { name: "시장", cost: 84, yields: { gold: 3 }, tech: "CURRENCY", desc: "+3 골드" },
    [BuildingType.UNIVERSITY]: { name: "대학교", cost: 175, yields: { science: 4 }, tech: "EDUCATION", desc: "+4 과학" },
    [BuildingType.WORKSHOP]: { name: "작업장", cost: 120, yields: { production: 3 }, tech: "APPRENTICESHIP", desc: "+3 생산력" },
    [BuildingType.BANK]: { name: "은행", cost: 200, yields: { gold: 5 }, tech: "BANKING", desc: "+5 골드" },
    [BuildingType.FACTORY]: { name: "공장", cost: 265, yields: { production: 5 }, tech: "INDUSTRIALIZATION", desc: "+5 생산력" },
    [BuildingType.RESEARCH_LAB]: { name: "연구소", cost: 400, yields: { science: 8 }, tech: "CHEMISTRY", desc: "+8 과학" }
};

export const TERRAIN_YIELDS: Record<TerrainType, TileYields> = {
  [TerrainType.WATER]: { food: 1, production: 0, gold: 1, science: 0, culture: 0 },
  [TerrainType.PLAINS]: { food: 1, production: 1, gold: 0, science: 0, culture: 0 },
  [TerrainType.GRASSLAND]: { food: 2, production: 0, gold: 0, science: 0, culture: 0 },
  [TerrainType.FOREST]: { food: 1, production: 2, gold: 0, science: 0, culture: 0 }, 
  [TerrainType.MOUNTAIN]: { food: 0, production: 0, gold: 0, science: 1, culture: 0 }, 
  [TerrainType.DESERT]: { food: 0, production: 0, gold: 0, science: 0, culture: 0 },
  [TerrainType.SNOW]: { food: 0, production: 0, gold: 0, science: 0, culture: 0 },
  [TerrainType.TUNDRA]: { food: 1, production: 0, gold: 0, science: 0, culture: 0 },
};

export const RESOURCE_YIELDS: Record<string, Partial<TileYields>> = {
  'IRON': { production: 2, science: 1 },
  'HORSES': { production: 1, gold: 1 },
  'COAL': { production: 3 },
  'OIL': { production: 3, gold: 3 },
  'ALUMINUM': { science: 2, production: 1 },
  'URANIUM': { production: 2, science: 3 },
  'WHEAT': { food: 1 },
  'RICE': { food: 1 },
  'CATTLE': { production: 1, food: 1 },
  'GOLD': { gold: 4, culture: 1 },
  'FISH': { food: 1 },
  'WHALES': { gold: 2, food: 1, culture: 1 }
};

export const IMPROVEMENT_YIELDS: Record<string, Partial<TileYields>> = {
  'FARM': { food: 1 },
  'MINE': { production: 2 }, 
  'PASTURE': { production: 1, food: 0.5 },
  'PLANTATION': { gold: 2 },
  'FISHING_BOATS': { food: 1, gold: 1 },
  'CAMP': { gold: 1, production: 1 },
  'OIL_WELL': { production: 3 }
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  [TerrainType.WATER]: "#3b82f6", 
  [TerrainType.PLAINS]: "#eab308", 
  [TerrainType.GRASSLAND]: "#4ade80", 
  [TerrainType.FOREST]: "#166534", 
  [TerrainType.MOUNTAIN]: "#94a3b8", 
  [TerrainType.DESERT]: "#fdba74", 
  [TerrainType.SNOW]: "#f1f5f9", 
  [TerrainType.TUNDRA]: "#a8a29e",
};

export const TERRAIN_COLORS_SIDE: Record<TerrainType, string> = {
  [TerrainType.WATER]: "#1e3a8a", 
  [TerrainType.PLAINS]: "#854d0e", 
  [TerrainType.GRASSLAND]: "#14532d", 
  [TerrainType.FOREST]: "#14532d", 
  [TerrainType.MOUNTAIN]: "#334155", 
  [TerrainType.DESERT]: "#c2410c", 
  [TerrainType.SNOW]: "#94a3b8", 
  [TerrainType.TUNDRA]: "#57534e",
};

export const TERRAIN_COST: Record<TerrainType, number> = {
  [TerrainType.WATER]: 1,
  [TerrainType.PLAINS]: 1,
  [TerrainType.GRASSLAND]: 1,
  [TerrainType.FOREST]: 2,
  [TerrainType.MOUNTAIN]: 999,
  [TerrainType.DESERT]: 1,
  [TerrainType.SNOW]: 2,
  [TerrainType.TUNDRA]: 1,
};

export const AI_LEADERS = [
  { name: "길가메시", color: "#ea580c" }, 
  { name: "클레오파트라", color: "#ca8a04" },
  { name: "진시황", color: "#15803d" },
  { name: "트라야누스", color: "#7e22ce" },
];

export const PLAYER_COLORS = {
  HUMAN: "#0284c7", 
  BARBARIAN: "#b91c1c" 
};

export interface TechNode extends Tech {
    era: number;
}

export interface CivicNode extends Civic {
    era: number;
}

export const TECH_TREE: TechNode[] = [
  // Ancient (Era 0)
  { id: "POTTERY", name: "도예", description: "곡창 건설 가능", cost: 25, era: 0 },
  { id: "MINING", name: "채광", description: "광산 건설, 숲 벌목", cost: 25, era: 0 },
  { id: "ANIMAL_HUSBANDRY", name: "목축업", description: "말 발견, 목장 건설", cost: 25, revealResource: "HORSES", era: 0 },
  { id: "SAILING", name: "항해술", description: "갤리선, 어선", cost: 50, revealResource: "WHALES", era: 0 },
  { id: "ASTROLOGY", name: "점성술", description: "종교관 설립 가능", cost: 50, era: 0 },
  { id: "WRITING", name: "문자", description: "도서관 건설", cost: 50, era: 0, prerequisites: ["POTTERY"] },
  { id: "ARCHERY", name: "궁술", description: "궁수 유닛", cost: 50, era: 0, prerequisites: ["ANIMAL_HUSBANDRY"] },
  { id: "MASONRY", name: "석조기술", description: "성벽 건설", cost: 80, era: 0, prerequisites: ["MINING"] },
  { id: "BRONZE_WORKING", name: "청동 기술", description: "철 발견, 창병", cost: 80, revealResource: "IRON", era: 0, prerequisites: ["MINING"] },
  { id: "WHEEL", name: "바퀴", description: "중전차, 물레방아", cost: 90, era: 0, prerequisites: ["MINING"] },
  
  // Classical (Era 1)
  { id: "HORSEBACK_RIDING", name: "승마", description: "기마병", cost: 120, era: 1, prerequisites: ["ANIMAL_HUSBANDRY", "ARCHERY"] },
  { id: "CURRENCY", name: "화폐", description: "시장 건설", cost: 120, era: 1, prerequisites: ["WRITING"] },
  { id: "IRON_WORKING", name: "철제 기술", description: "검사 유닛", cost: 120, era: 1, prerequisites: ["BRONZE_WORKING"] },
  { id: "SHIPBUILDING", name: "조선술", description: "사단노선, 유닛 승선", cost: 200, era: 1, prerequisites: ["SAILING"] },
  { id: "MATHEMATICS", name: "수학", description: "투석기", cost: 200, era: 1, prerequisites: ["CURRENCY", "WHEEL"] },
  { id: "CONSTRUCTION", name: "건축", description: "시설 효율 증가", cost: 200, era: 1, prerequisites: ["MASONRY", "WHEEL"] },
  { id: "ENGINEERING", name: "공학", description: "송수로", cost: 200, era: 1, prerequisites: ["WHEEL"] },

  // Medieval (Era 2)
  { id: "STIRRUPS", name: "등자", description: "기사 유닛", cost: 360, era: 2, prerequisites: ["HORSEBACK_RIDING"] },
  { id: "APPRENTICESHIP", name: "도제 제도", description: "작업장, 광산 +1 생산", cost: 300, era: 2, prerequisites: ["CURRENCY", "MINING"] },
  { id: "MACHINERY", name: "기계", description: "석궁병", cost: 300, era: 2, prerequisites: ["ENGINEERING", "IRON_WORKING"] },
  { id: "EDUCATION", name: "교육", description: "대학교", cost: 360, era: 2, prerequisites: ["MATHEMATICS"] },
  { id: "BANKING", name: "은행업", description: "은행", cost: 450, era: 2, prerequisites: ["CURRENCY", "EDUCATION"] },
  { id: "GUNPOWDER", name: "화약", description: "머스킷병", cost: 500, era: 2, prerequisites: ["STIRRUPS", "APPRENTICESHIP"] },

  // Renaissance (Era 3)
  { id: "PRINTING", name: "인쇄술", description: "외교 시계 증가", cost: 600, era: 3, prerequisites: ["EDUCATION"] },
  { id: "METAL_CASTING", name: "금속 주조", description: "대포", cost: 660, era: 3, prerequisites: ["GUNPOWDER"] },
  { id: "CARTOGRAPHY", name: "지도 제작", description: "캐러벨", cost: 660, era: 3, prerequisites: ["SHIPBUILDING", "ASTROLOGY"] },

  // Industrial (Era 4)
  { id: "INDUSTRIALIZATION", name: "산업화", description: "공장, 석탄 발견", cost: 900, revealResource: "COAL", era: 4, prerequisites: ["METAL_CASTING", "BANKING"] },
  { id: "SCIENTIFIC_THEORY", name: "과학 이론", description: "연구소", cost: 900, era: 4, prerequisites: ["EDUCATION", "PRINTING"] },
  { id: "STEAM_POWER", name: "증기력", description: "철갑선", cost: 800, era: 4, prerequisites: ["INDUSTRIALIZATION"] },
  { id: "STEEL", name: "강철", description: "전함, 야포", cost: 1100, era: 4, prerequisites: ["METAL_CASTING"] },

  // Modern (Era 5)
  { id: "REPLACEABLE_PARTS", name: "부품 대체", description: "보병", cost: 1250, era: 5, prerequisites: ["INDUSTRIALIZATION"] },
  { id: "COMBUSTION", name: "내연 기관", description: "탱크, 구축함, 석유 발견", cost: 1250, revealResource: "OIL", era: 5, prerequisites: ["STEAM_POWER", "STEEL"] },
  { id: "FLIGHT", name: "비행", description: "전투기", cost: 1200, era: 5, prerequisites: ["SCIENTIFIC_THEORY", "COMBUSTION"] },
  { id: "CHEMISTRY", name: "화학", description: "연구소", cost: 1100, era: 5, prerequisites: ["SCIENTIFIC_THEORY"] },

  // Atomic (Era 6)
  { id: "ADVANCED_FLIGHT", name: "고급 비행", description: "폭격기, 알루미늄", cost: 1500, revealResource: "ALUMINUM", era: 6, prerequisites: ["FLIGHT"] },
  { id: "NUCLEAR_FISSION", name: "핵분열", description: "우라늄 발견", cost: 2000, revealResource: "URANIUM", era: 6, prerequisites: ["CHEMISTRY"] }
];

export const CIVICS_TREE: CivicNode[] = [
  // Ancient (Era 0)
  { id: "CODE_OF_LAWS", name: "법전", description: "기본적인 사회 질서", cost: 20, era: 0 },
  { id: "CRAFTSMANSHIP", name: "장인 정신", description: "생산력 보너스 카드", cost: 40, era: 0, prerequisites: ["CODE_OF_LAWS"] },
  { id: "FOREIGN_TRADE", name: "외국 무역", description: "교역로", cost: 40, era: 0, prerequisites: ["CODE_OF_LAWS"] },
  { id: "EARLY_EMPIRE", name: "초기 제국", description: "국경 확장 가속", cost: 70, effect: "BORDER_EXPANSION", era: 0, prerequisites: ["FOREIGN_TRADE"] },
  { id: "MYSTICISM", name: "신비주의", description: "사절 획득", cost: 50, era: 0, prerequisites: ["CODE_OF_LAWS"] },
  
  // Classical (Era 1)
  { id: "POLITICAL_PHILOSOPHY", name: "정치 철학", description: "정부 체제 해금", cost: 110, era: 1, prerequisites: ["EARLY_EMPIRE", "CRAFTSMANSHIP"] },
  { id: "DRAMA_POETRY", name: "드라마와 시", description: "극장가", cost: 110, era: 1, prerequisites: ["MYSTICISM"] },
  { id: "GAMES_RECREATION", name: "오락과 여가", description: "유흥단지", cost: 110, era: 1, prerequisites: ["CRAFTSMANSHIP"] },
  { id: "DEFENSIVE_TACTICS", name: "방어술", description: "도시 방어 +100%", cost: 160, era: 1, prerequisites: ["POLITICAL_PHILOSOPHY"] },

  // Medieval (Era 2)
  { id: "FEUDALISM", name: "봉건제", description: "농장 인접 보너스", cost: 275, era: 2, prerequisites: ["DEFENSIVE_TACTICS"] },
  { id: "CIVIL_SERVICE", name: "공공 행정", description: "동맹 가능", cost: 275, era: 2, prerequisites: ["POLITICAL_PHILOSOPHY", "DRAMA_POETRY"] },
  { id: "THEOLOGY", name: "신학", description: "신앙 구매", cost: 120, era: 2, prerequisites: ["DRAMA_POETRY"] },
  
  // Renaissance (Era 3)
  { id: "HUMANISM", name: "인본주의", description: "박물관", cost: 540, era: 3, prerequisites: ["DRAMA_POETRY", "CIVIL_SERVICE"] },
  { id: "DIPLOMATIC_SERVICE", name: "외교부", description: "스파이", cost: 540, era: 3, prerequisites: ["CIVIL_SERVICE"] },
  { id: "NATURAL_HISTORY", name: "자연사", description: "고고학자", cost: 870, era: 3, prerequisites: ["HUMANISM"] },
  
  // Modern (Era 4+)
  { id: "IDEOLOGY", name: "이념", description: "3단계 정부", cost: 1200, era: 4, prerequisites: ["HUMANISM", "DIPLOMATIC_SERVICE"] },
  { id: "SUFFRAGE", name: "참정권", description: "민주주의", cost: 1500, era: 5, prerequisites: ["IDEOLOGY"] },
  { id: "TOTALITARIANISM", name: "전체주의", description: "파시즘", cost: 1500, era: 5, prerequisites: ["IDEOLOGY"] },
  { id: "CLASS_STRUGGLE", name: "계급 투쟁", description: "공산주의", cost: 1500, era: 5, prerequisites: ["IDEOLOGY"] }
];

export const POLICY_CARDS: Policy[] = [
    { id: "GOD_KING", name: "신왕", description: "+1 골드, +1 문화", type: "ECONOMIC", era: 0, requiresCivic: "CODE_OF_LAWS" },
    { id: "URBAN_PLANNING", name: "도시 계획", description: "모든 도시 생산력 +1", type: "ECONOMIC", era: 0, requiresCivic: "CODE_OF_LAWS" },
    { id: "DISCIPLINE", name: "규율", description: "야만인 상대 전투력 +5", type: "MILITARY", era: 0, requiresCivic: "CODE_OF_LAWS" },
    { id: "SURVEY", name: "측량", description: "정찰병 이동력 +1", type: "MILITARY", era: 0, requiresCivic: "CODE_OF_LAWS" },
    { id: "ILKUM", name: "일쿰", description: "건설자 생산력 +30%", type: "ECONOMIC", era: 0, requiresCivic: "CRAFTSMANSHIP" },
    { id: "AGOGE", name: "아고게", description: "근접 및 원거리 유닛 생산력 +50%", type: "MILITARY", era: 0, requiresCivic: "CRAFTSMANSHIP" },
    { id: "DIPLOMATIC_LEAGUE", name: "외교 연합", description: "외교 선물 비용 50% 감소", type: "DIPLOMATIC", era: 1, requiresCivic: "POLITICAL_PHILOSOPHY" },
    { id: "CONSCRIPTION", name: "징집", description: "유닛 유지비 -1 골드", type: "MILITARY", era: 1, requiresCivic: "STATE_WORKFORCE" },
    { id: "LAND_SURVEYORS", name: "토지 측량사", description: "국경 확장 비용 20% 감소", type: "ECONOMIC", era: 1, requiresCivic: "EARLY_EMPIRE" },
    { id: "COLONIZATION", name: "식민지화", description: "개척자 생산력 +50%", type: "ECONOMIC", era: 1, requiresCivic: "EARLY_EMPIRE" },
    { id: "STRATEGOS", name: "장군", description: "매 턴 +2 골드", type: "WILDCARD", era: 1, requiresCivic: "MILITARY_TRADITION" },
    { id: "INSPIRATION", name: "영감", description: "매 턴 +2 과학", type: "WILDCARD", era: 1, requiresCivic: "MYSTICISM" },
    { id: "REVELATION", name: "계시", description: "매 턴 +1 골드, +1 문화", type: "WILDCARD", era: 1, requiresCivic: "MYSTICISM" },
    { id: "LITERARY_TRADITION", name: "문학적 전통", description: "매 턴 +2 문화", type: "WILDCARD", era: 1, requiresCivic: "DRAMA_POETRY" },
    { id: "NAVIGATION", name: "항해", description: "해상 유닛 이동력 +1", type: "MILITARY", era: 2, requiresCivic: "NAVAL_TRADITION" },
    { id: "TRADE_CONFEDERATION", name: "무역 연합", description: "문화 +1, 과학 +1 (교역로)", type: "ECONOMIC", era: 2, requiresCivic: "MERCENARIES" },
    { id: "MERCHANT_CONFEDERATION", name: "상인 연합", description: "금 +2 (교역로)", type: "DIPLOMATIC", era: 2, requiresCivic: "GUILDS" },
    { id: "AESTHETICS", name: "미학", description: "극장가 인접 보너스 +100%", type: "ECONOMIC", era: 2, requiresCivic: "MEDIEVAL_FAIRES" },
    { id: "CRAFTSMEN", name: "장인", description: "산업구역 인접 보너스 +100%", type: "ECONOMIC", era: 2, requiresCivic: "GUILDS" },
    { id: "TOWN_CHARTERS", name: "마을 헌장", description: "상업 중심지 인접 보너스 +100%", type: "ECONOMIC", era: 2, requiresCivic: "GUILDS" },
    { id: "FEUDAL_CONTRACT", name: "봉건 계약", description: "근접 및 원거리 유닛 생산력 +50%", type: "MILITARY", era: 2, requiresCivic: "FEUDALISM" },
    { id: "SERFDOM", name: "농노제", description: "새 건설자 행동력 +2", type: "ECONOMIC", era: 2, requiresCivic: "FEUDALISM" },
    { id: "PUBLIC_WORKS", name: "공공 사업", description: "건설자 행동력 +2, 생산력 +30%", type: "ECONOMIC", era: 3, requiresCivic: "CIVIL_ENGINEERING" },
    { id: "SKYSCRAPERS", name: "마천루", description: "불가사의 건설 생산력 +15%", type: "ECONOMIC", era: 3, requiresCivic: "CIVIL_ENGINEERING" },
    { id: "GRAND_OPERA", name: "그랜드 오페라", description: "극장가 건물 문화 +100%", type: "ECONOMIC", era: 3, requiresCivic: "OPERA_BALLET" },
    { id: "RATIONALISM", name: "합리주의", description: "캠퍼스 건물 과학 +100%", type: "ECONOMIC", era: 3, requiresCivic: "THE_ENLIGHTENMENT" },
    { id: "FREE_MARKET", name: "자유 시장", description: "상업 중심지 건물 금 +100%", type: "ECONOMIC", era: 3, requiresCivic: "THE_ENLIGHTENMENT" },
    { id: "LIBERALISM", name: "자유주의", description: "쾌적도 +1 (2개 이상의 특수지구)", type: "ECONOMIC", era: 3, requiresCivic: "THE_ENLIGHTENMENT" },
    { id: "PROPAGANDA", name: "선전", description: "전쟁 피로도 25% 감소", type: "MILITARY", era: 4, requiresCivic: "MASS_MEDIA" },
    { id: "LEVEE_EN_MASSE", name: "국민 개병", description: "유닛 유지비 -2 골드", type: "MILITARY", era: 4, requiresCivic: "MOBILIZATION" },
    { id: "MARKET_ECONOMY", name: "시장 경제", description: "교역로당 +2 금, +2 문화, +1 과학", type: "ECONOMIC", era: 4, requiresCivic: "CAPITALISM" },
    { id: "NEW_DEAL", name: "뉴딜 정책", description: "쾌적도 +2, 주거 +2, 금 -8", type: "ECONOMIC", era: 5, requiresCivic: "SUFFRAGE" },
    { id: "FIVE_YEAR_PLAN", name: "5개년 계획", description: "캠퍼스/산업구역 인접 보너스 +100%", type: "ECONOMIC", era: 5, requiresCivic: "CLASS_STRUGGLE" },
    { id: "MARTIAL_LAW", name: "계엄령", description: "전쟁 피로도 25% 감소", type: "MILITARY", era: 5, requiresCivic: "TOTALITARIANISM" },
    { id: "ECOMMERCE", name: "전자 상거래", description: "교역로당 +5 생산, +10 금", type: "ECONOMIC", era: 5, requiresCivic: "GLOBALIZATION" },
    { id: "ONLINE_COMMUNITIES", name: "온라인 커뮤니티", description: "관광 +50%", type: "ECONOMIC", era: 5, requiresCivic: "SOCIAL_MEDIA" },
    { id: "COLLECTIVIZATION", name: "집단화", description: "농장 식량 +2, 주거 +2", type: "ECONOMIC", era: 5, requiresCivic: "CLASS_STRUGGLE" },
    { id: "DEFENSE_OF_MOTHERLAND", name: "조국 수호", description: "자국 영토 전투력 +5", type: "MILITARY", era: 5, requiresCivic: "CLASS_STRUGGLE" },
    { id: "MILITARY_RESEARCH", name: "군사 연구", description: "사관학교, 항구 과학 +2", type: "MILITARY", era: 4, requiresCivic: "URBANIZATION" },
    { id: "INTERNATIONAL_WATERS", name: "국제 수역", description: "해상 유닛 생산력 +100%", type: "MILITARY", era: 4, requiresCivic: "COLD_WAR" }
];
