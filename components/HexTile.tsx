
import React from 'react';
import { Tile, TerrainType, City, Player } from '../types';
import { TERRAIN_COLORS_SIDE, HEX_HEIGHT, HEX_WIDTH } from '../constants';
import { axialToPixel, isResourceVisible } from '../utils/gameUtils';

interface HexTileProps {
  tile: Tile;
  city?: City;
  isSelected: boolean;
  isInRange: boolean;
  isBorder?: string;
  isWorked?: boolean;
  player: Player; 
  onClick: (tile: Tile) => void;
}

const HexTile: React.FC<HexTileProps> = ({ tile, city, isSelected, isInRange, isBorder, isWorked, player, onClick }) => {
  const { x, y } = axialToPixel(tile.q, tile.r);
  
  if (!tile.isDiscovered) {
      return null;
  }

  const opacity = tile.isVisible ? 1 : 0.5;
  
  // Hill height offset
  const HILL_OFFSET = tile.isHill ? -8 : 0;
  const DEPTH = tile.terrain === TerrainType.MOUNTAIN ? 30 : tile.terrain === TerrainType.WATER ? 5 : 15 + (tile.isHill ? 5 : 0);
  const TOP_Y_OFFSET = -12 + HILL_OFFSET; 

  const p = [
      {x: HEX_WIDTH/2, y: 0},
      {x: HEX_WIDTH, y: HEX_HEIGHT*0.25},
      {x: HEX_WIDTH, y: HEX_HEIGHT*0.75},
      {x: HEX_WIDTH/2, y: HEX_HEIGHT},
      {x: 0, y: HEX_HEIGHT*0.75},
      {x: 0, y: HEX_HEIGHT*0.25}
  ];

  const topPoints = p.map(pt => `${pt.x},${pt.y + TOP_Y_OFFSET}`).join(" ");
  const frontLeftFace = `${0},${HEX_HEIGHT*0.75 + TOP_Y_OFFSET} ${HEX_WIDTH/2},${HEX_HEIGHT + TOP_Y_OFFSET} ${HEX_WIDTH/2},${HEX_HEIGHT + TOP_Y_OFFSET + DEPTH} ${0},${HEX_HEIGHT*0.75 + TOP_Y_OFFSET + DEPTH}`;
  const frontRightFace = `${HEX_WIDTH/2},${HEX_HEIGHT + TOP_Y_OFFSET} ${HEX_WIDTH},${HEX_HEIGHT*0.75 + TOP_Y_OFFSET} ${HEX_WIDTH},${HEX_HEIGHT*0.75 + TOP_Y_OFFSET + DEPTH} ${HEX_WIDTH/2},${HEX_HEIGHT + TOP_Y_OFFSET + DEPTH}`;

  const sideColor = TERRAIN_COLORS_SIDE[tile.terrain];
  const fillId = `url(#terrain-${tile.terrain})`;
  const showResource = tile.resource ? isResourceVisible(tile.resource, player) : false;

  return (
    <g 
      transform={`translate(${x}, ${y})`} 
      onClick={(e) => { e.stopPropagation(); onClick(tile); }} 
      className="cursor-pointer transition-all duration-200 group"
      style={{ opacity, pointerEvents: 'auto' }} 
    >
      {/* 3D Sides */}
      <polygon points={frontLeftFace} fill={sideColor} stroke={sideColor} strokeWidth="1" />
      <polygon points={frontRightFace} fill={sideColor} stroke={sideColor} strokeWidth="1" />

      {/* Top Face */}
      <polygon 
        points={topPoints} 
        fill={fillId}
        stroke={isSelected ? "#ffffff" : isInRange ? "#ef4444" : "#ffffff"} 
        strokeWidth={isSelected ? 3 : 0.2}
        strokeOpacity={isSelected || isInRange ? 1 : 0.1}
        className={`${isSelected ? 'filter drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]' : 'hover:brightness-110'}`}
      />
      
      {/* Hill Overlay (Texture) */}
      {tile.isHill && (
          <polygon points={topPoints} fill="black" opacity="0.15" pointerEvents="none" />
      )}
      
      {/* Texture Overlay */}
      <polygon points={topPoints} fill="transparent" filter="url(#noise)" opacity="0.15" pointerEvents="none" />

      {/* Rivers - Rendered ON TOP of terrain, thicker, cleaner */}
      {tile.rivers && tile.isVisible && (
          <g transform={`translate(0, ${TOP_Y_OFFSET})`} pointerEvents="none" style={{ mixBlendMode: 'normal' }}>
              {tile.rivers[0] && <line x1={p[5].x} y1={p[5].y} x2={p[0].x} y2={p[0].y} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />} 
              {tile.rivers[1] && <line x1={p[0].x} y1={p[0].y} x2={p[1].x} y2={p[1].y} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />} 
              {tile.rivers[2] && <line x1={p[1].x} y1={p[1].y} x2={p[2].x} y2={p[2].y} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />} 
              {tile.rivers[3] && <line x1={p[2].x} y1={p[2].y} x2={p[3].x} y2={p[3].y} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />} 
              {tile.rivers[4] && <line x1={p[3].x} y1={p[3].y} x2={p[4].x} y2={p[4].y} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />} 
              {tile.rivers[5] && <line x1={p[4].x} y1={p[4].y} x2={p[5].x} y2={p[5].y} stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" className="filter drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />} 
          </g>
      )}

      {/* Water Waves */}
      {tile.terrain === TerrainType.WATER && (
          <text x={HEX_WIDTH/2} y={HEX_HEIGHT/2 + TOP_Y_OFFSET} textAnchor="middle" fontSize="20" opacity="0.3" fill="white" pointerEvents="none">≈</text>
      )}

      {/* Border (Solid, Pulsing) */}
      {(isBorder || tile.ownerId) && tile.isVisible && (
         <polygon 
            points={topPoints} 
            fill="none" 
            stroke={isBorder || (tile.ownerId === player.id ? player.color : undefined)} 
            strokeWidth="4" 
            className="animate-pulse opacity-80"
            pointerEvents="none"
         />
      )}

      {/* Citizen Indicator */}
      {isWorked && tile.isVisible && (
         <g transform={`translate(${HEX_WIDTH/2}, ${HEX_HEIGHT/2 + TOP_Y_OFFSET - 25})`} pointerEvents="none" className="animate-bounce">
             <circle r="8" fill="#22c55e" stroke="white" strokeWidth="1.5" className="drop-shadow-md" />
             <text x="0" y="3" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">👤</text>
         </g>
      )}
      
      {/* Resource & Improvement Props */}
      <g transform={`translate(${HEX_WIDTH/2}, ${HEX_HEIGHT/2 + TOP_Y_OFFSET})`} pointerEvents="none">
          {tile.terrain === TerrainType.MOUNTAIN && (
             <path d="M -20 10 L 0 -25 L 20 10 Z M -10 15 L 5 -15 L 15 15 Z" fill="#64748b" stroke="#334155" strokeWidth="1" className="drop-shadow-lg" />
          )}
          {tile.terrain === TerrainType.FOREST && (
              <g>
                  <path d="M -15 5 L -15 -10 L -5 -10 L -5 -20 L 5 -20 L 5 -10 L 15 -10 L 15 5 Z" fill="#14532d" opacity="0.4" transform="translate(2,2)" />
                  <path d="M -10 5 L 0 -15 L 10 5 Z" fill="#15803d" stroke="#064e3b" transform="translate(-10, -5)" />
                  <path d="M -12 10 L 0 -18 L 12 10 Z" fill="#16a34a" stroke="#064e3b" transform="translate(5, 0)" />
              </g>
          )}
          
          {/* Tribal Village */}
          {tile.hasVillage && (
              <g transform="translate(0, -5)">
                  <circle r="12" fill="#eab308" stroke="#854d0e" strokeWidth="2" className="animate-pulse" />
                  <text y="4" textAnchor="middle" fontSize="14">⛺</text>
              </g>
          )}
          
          {/* Improvements */}
          {tile.improvement === 'FARM' && <text y={5} textAnchor="middle" fontSize="18">🏡</text>}
          {tile.improvement === 'MINE' && <text y={5} textAnchor="middle" fontSize="18">⚒️</text>}
          {tile.improvement === 'PASTURE' && <text y={5} textAnchor="middle" fontSize="18">🐄</text>}
          {tile.improvement === 'PLANTATION' && <text y={5} textAnchor="middle" fontSize="18">🍌</text>}
          {tile.improvement === 'OIL_WELL' && <text y={5} textAnchor="middle" fontSize="18">🛢️</text>}
          
          {/* Resources */}
          {!tile.improvement && showResource && (
             <g>
               {tile.resource === 'IRON' && <text y={-5} textAnchor="middle" fontSize="16">⛏️</text>}
               {tile.resource === 'HORSES' && <text y={-5} textAnchor="middle" fontSize="16">🐴</text>}
               {tile.resource === 'COAL' && <text y={-5} textAnchor="middle" fontSize="16">⚫</text>}
               {tile.resource === 'OIL' && <text y={-5} textAnchor="middle" fontSize="16">🛢️</text>}
               {tile.resource === 'ALUMINUM' && <text y={-5} textAnchor="middle" fontSize="16">📦</text>}
               {tile.resource === 'URANIUM' && <text y={-5} textAnchor="middle" fontSize="16">☢️</text>}
               {tile.resource === 'GOLD' && <text y={-5} textAnchor="middle" fontSize="16">💎</text>}
               {tile.resource === 'WHEAT' && <text y={-5} textAnchor="middle" fontSize="16">🌾</text>}
               {tile.resource === 'RICE' && <text y={-5} textAnchor="middle" fontSize="16">🍚</text>}
               {tile.resource === 'CATTLE' && <text y={-5} textAnchor="middle" fontSize="16">🐮</text>}
               {tile.resource === 'FISH' && <text y={-5} textAnchor="middle" fontSize="16">🐟</text>}
               {tile.resource === 'WHALES' && <text y={-5} textAnchor="middle" fontSize="16">🐋</text>}
             </g>
          )}
      </g>

      {/* City Label */}
      {city && (
         <g className="select-none" transform={`translate(0, ${TOP_Y_OFFSET - 10})`} pointerEvents="none">
            <text x={HEX_WIDTH/2} y={HEX_HEIGHT/2} textAnchor="middle" fontSize="32" className="filter drop-shadow-2xl">
                {city.maxHealth > 200 ? '🏰' : '🏠'}
            </text>
            
            {tile.isVisible && (
                <g transform="translate(0, -35)">
                    <rect x={HEX_WIDTH/2 - 20} y={-20} width="40" height="4" fill="#333" />
                    <rect x={HEX_WIDTH/2 - 20} y={-20} width={(city.health/city.maxHealth)*40} height="4" fill={city.health < 50 ? 'red' : 'green'} />
                    
                    <rect x={HEX_WIDTH/2 - 40} y={-16} width="80" height="22" rx="4" fill={isBorder || "#333"} stroke="white" strokeWidth="1.5" className="shadow-lg"/>
                    <text x={HEX_WIDTH/2} y={0} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold" style={{textShadow: '0px 1px 2px black'}}>
                        {city.name} ({city.population})
                    </text>
                </g>
            )}
         </g>
      )}
    </g>
  );
};

export default HexTile;
