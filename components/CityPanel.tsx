
import React, { useState, useEffect } from 'react';
import { City, UnitType, BuildingType, Player, Tile } from '../types';
import { UNIT_INFO, BUILDING_INFO } from '../constants';
import { getTileYields, isCoastalCity } from '../utils/gameUtils';

interface CityPanelProps {
  city: City;
  player: Player;
  tiles: Tile[];
  onClose: () => void;
  onProduce: (item: UnitType | BuildingType) => void;
  onPurchase: (item: UnitType | BuildingType) => void; 
  onRename?: (cityId: string, newName: string) => void;
}

const CityPanel: React.FC<CityPanelProps> = ({ city, player, tiles, onClose, onProduce, onPurchase, onRename }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(city.name);

  useEffect(() => {
      setEditName(city.name);
  }, [city.name]);

  const handleNameSubmit = () => {
      setIsEditingName(false);
      if (onRename && editName.trim() !== "") {
          onRename(city.id, editName);
      } else {
          setEditName(city.name);
      }
  };

  const isUnit = (item: string) => item in UNIT_INFO;
  const isCoastal = isCoastalCity(city, tiles);
  
  const currentProdName = city.currentProductionTarget 
    ? (isUnit(city.currentProductionTarget!) 
        ? UNIT_INFO[city.currentProductionTarget as UnitType].name 
        : BUILDING_INFO[city.currentProductionTarget as BuildingType].name) 
    : "없음";
    
  const currentProdCost = city.currentProductionTarget 
     ? (isUnit(city.currentProductionTarget!) 
        ? UNIT_INFO[city.currentProductionTarget as UnitType].cost 
        : BUILDING_INFO[city.currentProductionTarget as BuildingType].cost)
     : 100;
     
  const progress = Math.min(100, (city.production / currentProdCost) * 100);
  const foodNeeded = city.population * 15;
  const foodProgress = Math.min(100, (city.food / foodNeeded) * 100);
  const cultureProgress = Math.min(100, (city.cultureStored / city.cultureThreshold) * 100);

  // --- Calculate Yields ---
  let totalFood = 0; 
  let totalProd = 0; 
  let totalGold = 0;
  let totalScience = 0;
  let totalCulture = 0;

  const cityCenterTile = tiles.find(t => t.q === city.q && t.r === city.r);
  if (cityCenterTile) {
      const centerYield = getTileYields(cityCenterTile, player);
      totalFood += Math.max(2, centerYield.food);
      totalProd += Math.max(1, centerYield.production);
      totalGold += centerYield.gold;
      totalScience += centerYield.science;
      totalCulture += centerYield.culture;
      
      // New Base Yields for City
      totalScience += 1;
      totalCulture += 1;
  }

  city.workedTiles.forEach(coord => {
      if (coord.q === city.q && coord.r === city.r) return;

      const tile = tiles.find(t => t.q === coord.q && t.r === coord.r);
      if (tile) {
          const y = getTileYields(tile, player);
          totalFood += y.food;
          totalProd += y.production;
          totalGold += y.gold;
          totalScience += y.science;
          totalCulture += y.culture;
      }
  });
  
  city.buildings.forEach(bId => {
      const b = BUILDING_INFO[bId];
      if (b.yields.food) totalFood += b.yields.food;
      if (b.yields.production) totalProd += b.yields.production;
      if (b.yields.gold) totalGold += b.yields.gold;
      if (b.yields.science) totalScience += b.yields.science;
      if (b.yields.culture) totalCulture += b.yields.culture;
  });

  // Policy Global Effects
  if (player.activePolicies.includes("URBAN_PLANNING")) totalProd += 1;
  if (player.activePolicies.includes("GOD_KING")) { totalGold += 1; totalCulture += 1; }

  const foodConsumed = city.population * 2;
  const surplusFood = totalFood - foodConsumed;

  return (
    <div className="fixed right-0 top-20 bottom-0 w-[450px] bg-slate-900/95 border-l border-amber-600/50 backdrop-blur-lg shadow-2xl p-6 text-slate-100 transform transition-transform animate-slide-in-right z-20 flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
        <div className="flex-1">
            {isEditingName ? (
                <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleNameSubmit}
                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                    autoFocus
                    className="text-2xl font-bold bg-slate-800 text-amber-500 border border-amber-500 rounded px-2 py-1 w-full focus:outline-none"
                />
            ) : (
                <h2 
                    className="text-2xl font-bold text-amber-500 flex items-center gap-2 cursor-pointer hover:text-amber-400"
                    onClick={() => setIsEditingName(true)}
                    title="이름 수정하려면 클릭하세요"
                >
                    {city.maxHealth > 200 ? '🏰' : '🏠'} {city.name} <span className="text-sm bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-600">{city.population}</span>
                    <span className="text-xs opacity-50">✏️</span>
                </h2>
            )}
            <div className="text-xs text-slate-400 mt-1">체력: {city.health}/{city.maxHealth} | <span className="text-green-400">시민 배치 가능: {city.population - city.workedTiles.length}</span></div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl ml-4">&times;</button>
      </div>
      
      <div className="text-xs text-blue-300 mb-4 bg-blue-900/20 p-2 rounded border border-blue-800">
          💡 지도에서 내 영토 내 타일을 클릭하여 시민을 배치하거나 해제하세요.
      </div>

      {/* Yields */}
      <div className="grid grid-cols-5 gap-1 mb-6 bg-slate-800/50 p-2 rounded-lg border border-slate-700 text-center">
          <div><div className="text-[10px] text-slate-400">식량</div><div className={`${surplusFood >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>{surplusFood >= 0 ? '+' : ''}{surplusFood.toFixed(1)}</div></div>
          <div><div className="text-[10px] text-slate-400">생산</div><div className="text-amber-400 font-bold">+{totalProd.toFixed(1)}</div></div>
          <div><div className="text-[10px] text-slate-400">골드</div><div className="text-yellow-400 font-bold">+{totalGold.toFixed(1)}</div></div>
          <div><div className="text-[10px] text-slate-400">과학</div><div className="text-blue-400 font-bold">+{totalScience.toFixed(1)}</div></div>
          <div><div className="text-[10px] text-slate-400">문화</div><div className="text-purple-400 font-bold">+{totalCulture.toFixed(1)}</div></div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3 mb-6 text-xs">
        <div>
            <div className="flex justify-between mb-1"><span className="text-slate-300">생산: <span className="text-white font-bold">{currentProdName}</span></span><span>{city.production}/{currentProdCost}</span></div>
            <div className="w-full bg-slate-800 rounded-full h-2 border border-slate-600 overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: `${progress}%` }}></div></div>
        </div>
        <div>
             <div className="flex justify-between mb-1"><span className="text-slate-300">성장:</span><span>{Math.floor(foodProgress)}%</span></div>
             <div className="w-full bg-slate-800 rounded-full h-1.5 border border-slate-600 overflow-hidden"><div className="bg-green-500 h-full" style={{ width: `${foodProgress}%` }}></div></div>
        </div>
        <div>
             <div className="flex justify-between mb-1"><span className="text-slate-300">국경 확장:</span><span>{Math.floor(cultureProgress)}%</span></div>
             <div className="w-full bg-slate-800 rounded-full h-1.5 border border-slate-600 overflow-hidden"><div className="bg-purple-500 h-full" style={{ width: `${cultureProgress}%` }}></div></div>
        </div>
      </div>

      {/* Production List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Units */}
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">유닛 생산</h3>
        <div className="space-y-1 mb-4">
          {(Object.keys(UNIT_INFO) as UnitType[]).filter(u => u !== 'BARBARIAN_WARRIOR').map((type) => {
            const info = UNIT_INFO[type];
            if (info.domain === 'SEA' && !isCoastal) return null; // Restrict naval units
            
            const isLocked = info.requiredTech && !player.researchedTechs.includes(info.requiredTech);
            if (isLocked) return null; 

            const isSelected = city.currentProductionTarget === type;
            const buyCost = info.cost * 4;
            
            return (
              <div key={type} className="flex gap-1">
                  <button onClick={() => onProduce(type)}
                    className={`flex-1 text-left p-2 rounded border flex items-center gap-3 relative ${isSelected ? 'bg-amber-900/40 border-amber-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <div className="text-lg w-8 text-center">{type === 'SETTLER' ? '🚩' : '⚔️'}</div>
                    <div className="flex-1">
                        <div className="font-bold text-sm">{info.name}</div>
                        <div className="text-[10px] text-slate-400">{info.cost} ⚙️ / 공격 {info.strength}</div>
                    </div>
                  </button>
                  <button 
                    disabled={player.gold < buyCost}
                    onClick={() => onPurchase(type)}
                    className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 rounded font-bold text-xs border border-yellow-500 disabled:border-slate-600 flex flex-col items-center justify-center w-20">
                    <span>구매</span>
                    <span className="text-[10px]">🪙{buyCost}</span>
                  </button>
              </div>
            );
          })}
        </div>

        {/* Buildings */}
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">건물 건설</h3>
        <div className="space-y-1">
            {(Object.keys(BUILDING_INFO) as BuildingType[]).map((type) => {
                const info = BUILDING_INFO[type];
                const isBuilt = city.buildings.includes(type);
                const isLocked = info.tech && !player.researchedTechs.includes(info.tech);
                
                if (isBuilt || isLocked) return null; 

                const isSelected = city.currentProductionTarget === type;
                const buyCost = info.cost * 4;

                return (
                  <div key={type} className="flex gap-1">
                      <button onClick={() => onProduce(type)}
                        className={`flex-1 text-left p-2 rounded border flex items-center gap-3 relative ${isSelected ? 'bg-blue-900/40 border-blue-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                        <div className="text-lg w-8 text-center">🏛️</div>
                        <div className="flex-1">
                            <div className="font-bold text-sm">{info.name}</div>
                            <div className="text-[10px] text-slate-400">{info.cost} ⚙️ / {info.desc}</div>
                        </div>
                      </button>
                      <button 
                        disabled={player.gold < buyCost}
                        onClick={() => onPurchase(type)}
                        className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 rounded font-bold text-xs border border-yellow-500 disabled:border-slate-600 flex flex-col items-center justify-center w-20">
                        <span>구매</span>
                        <span className="text-[10px]">🪙{buyCost}</span>
                      </button>
                  </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default CityPanel;
