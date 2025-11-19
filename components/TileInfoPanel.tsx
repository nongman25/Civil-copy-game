
import React from 'react';
import { Tile, Player, TerrainType } from '../types';
import { UNIT_INFO, TERRAIN_YIELDS, RESOURCE_YIELDS, IMPROVEMENT_YIELDS } from '../constants';
import { getTileYields } from '../utils/gameUtils';

interface TileInfoPanelProps {
  tile: Tile | null;
  player: Player;
}

const TileInfoPanel: React.FC<TileInfoPanelProps> = ({ tile, player }) => {
  if (!tile || !tile.isDiscovered) return null;

  const yields = getTileYields(tile, player);
  const defenseMod = tile.terrain === TerrainType.FOREST || tile.terrain === TerrainType.MOUNTAIN || tile.isHill ? 25 : 0;
  const moveCost = tile.terrain === TerrainType.MOUNTAIN ? 'X' : tile.terrain === TerrainType.FOREST || tile.isHill ? 2 : 1;

  return (
    <div className="fixed bottom-4 left-4 bg-slate-900/90 border border-slate-600 p-4 rounded-xl shadow-2xl backdrop-blur-md z-40 w-64 animate-fade-in text-sm select-none pointer-events-none">
      <h3 className="text-lg font-bold text-amber-500 mb-1 border-b border-slate-700 pb-1">지형 정보</h3>
      
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-300">지형:</span>
        <span className="font-bold text-white">{tile.terrain} {tile.isHill ? '(언덕)' : ''}</span>
      </div>

      {tile.hasVillage && (
        <div className="flex justify-between items-center mb-2 text-yellow-400 font-bold">
          <span>⛺ 부족 마을</span>
        </div>
      )}
      
      {tile.resource && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">자원:</span>
          <span className="font-bold text-green-400">{tile.resource}</span>
        </div>
      )}

      {tile.improvement && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">시설:</span>
          <span className="font-bold text-blue-400">{tile.improvement}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 bg-slate-800 p-2 rounded mb-2">
         <div className="text-center">
            <div className="text-[10px] text-slate-400">이동</div>
            <div className="text-white font-bold">{moveCost}</div>
         </div>
         <div className="text-center">
            <div className="text-[10px] text-slate-400">방어</div>
            <div className="text-white font-bold">+{defenseMod}%</div>
         </div>
         <div className="text-center">
            <div className="text-[10px] text-slate-400">매력도</div>
            <div className="text-white font-bold">{tile.rivers?.some(r => r) ? '+1' : '0'}</div>
         </div>
      </div>

      <h4 className="text-xs font-bold text-slate-400 mb-1">산출량</h4>
      <div className="flex gap-2 flex-wrap">
         {yields.food > 0 && <span className="bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded text-xs">🍎 {yields.food}</span>}
         {yields.production > 0 && <span className="bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded text-xs">⚙️ {yields.production}</span>}
         {yields.gold > 0 && <span className="bg-yellow-900/50 text-yellow-300 px-1.5 py-0.5 rounded text-xs">🪙 {yields.gold}</span>}
         {yields.science > 0 && <span className="bg-blue-900/50 text-blue-300 px-1.5 py-0.5 rounded text-xs">🧪 {yields.science}</span>}
         {yields.culture > 0 && <span className="bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded text-xs">🎭 {yields.culture}</span>}
      </div>
    </div>
  );
};

export default TileInfoPanel;
