
import React, { useRef, useState } from 'react';
import { Player } from '../types';
import { TECH_TREE, CIVICS_TREE, ERAS } from '../constants';

interface ResearchPanelProps {
  player: Player;
  type: 'SCIENCE' | 'CULTURE';
  onClose: () => void;
  onSelect: (id: string, type: 'SCIENCE' | 'CULTURE') => void;
  onTogglePolicy: () => void;
}

const ResearchPanel: React.FC<ResearchPanelProps> = ({ player, type, onClose, onSelect, onTogglePolicy }) => {
  const items = type === 'SCIENCE' ? TECH_TREE : CIVICS_TREE;
  const currentId = type === 'SCIENCE' ? player.currentTechId : player.currentCivicId;
  const researched = type === 'SCIENCE' ? player.researchedTechs : player.researchedCivics;

  const groupedItems: Record<number, typeof items> = {};
  items.forEach(item => {
      if (!groupedItems[item.era]) groupedItems[item.era] = [];
      groupedItems[item.era].push(item);
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
      if (!scrollRef.current) return;
      setIsDragging(true);
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setStartY(e.pageY - scrollRef.current.offsetTop);
      setScrollLeft(scrollRef.current.scrollLeft);
      setScrollTop(scrollRef.current.scrollTop);
  };

  const handleMouseLeave = () => {
      setIsDragging(false);
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollRef.current.offsetLeft;
      const y = e.pageY - scrollRef.current.offsetTop;
      const walkX = (x - startX) * 1.5; 
      const walkY = (y - startY) * 1.5;
      scrollRef.current.scrollLeft = scrollLeft - walkX;
      scrollRef.current.scrollTop = scrollTop - walkY;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b ${type === 'SCIENCE' ? 'bg-blue-900/30 border-blue-500/30' : 'bg-purple-900/30 border-purple-500/30'} flex justify-between items-center shrink-0`}>
           <div>
              <h2 className={`text-3xl font-bold ${type === 'SCIENCE' ? 'text-blue-400' : 'text-purple-400'}`}>
                  {type === 'SCIENCE' ? '기술 연구 트리' : '사회 제도 트리'}
              </h2>
              <p className="text-slate-400 mt-1">
                  {type === 'SCIENCE' ? '시대를 거쳐 과학을 발전시키십시오.' : '문명을 위대한 사회로 이끄십시오.'}
              </p>
           </div>
           <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-full border border-slate-600 font-bold transition-colors">
               닫기
           </button>
        </div>

        {/* Tree Container - Drag & Scroll Enabled */}
        <div 
            className="flex-1 overflow-auto bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] bg-slate-900 cursor-grab active:cursor-grabbing select-none"
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
        >
            <div className="flex h-full p-12 min-w-max items-start">
                {Object.keys(ERAS).map((eraKey: any) => {
                    const eraId = parseInt(eraKey);
                    const eraItems = groupedItems[eraId];
                    if (!eraItems || eraItems.length === 0) return null;

                    return (
                        <div key={eraId} className="flex flex-col mr-12 relative min-w-[280px]">
                            {/* Era Header */}
                            <div className="text-center mb-6 border-b-2 border-slate-700 pb-2 bg-slate-900/80 rounded z-10">
                                <span className="text-slate-500 text-sm uppercase tracking-widest font-bold">{ERAS[eraKey]}</span>
                            </div>
                            
                            {/* Items Column */}
                            <div className="flex flex-col gap-6 justify-center">
                                {eraItems.map(item => {
                                    const isResearched = researched.includes(item.id);
                                    const isCurrent = currentId === item.id;
                                    
                                    const unmetPrereqs = item.prerequisites 
                                        ? item.prerequisites.filter(pId => !researched.includes(pId))
                                        : [];
                                    const isLocked = !isResearched && unmetPrereqs.length > 0;
                                    
                                    return (
                                        <div 
                                            key={item.id}
                                            onClick={(e) => {
                                                // Prevent click when dragging
                                                if (!isDragging && !isResearched && !isLocked) {
                                                    onSelect(item.id, type);
                                                }
                                            }}
                                            className={`
                                                relative w-72 p-4 rounded-lg border-2 text-left transition-all transform 
                                                flex flex-col justify-between shrink-0 shadow-xl min-h-[140px]
                                                ${isResearched 
                                                    ? 'bg-slate-800/40 border-slate-700 opacity-70 grayscale' 
                                                    : isCurrent 
                                                        ? type === 'SCIENCE' ? 'bg-blue-900/60 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-105' : 'bg-purple-900/60 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105'
                                                        : isLocked
                                                            ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                                                            : 'bg-slate-800 border-slate-600 hover:border-slate-400 hover:bg-slate-700 hover:scale-[1.02] cursor-pointer'
                                                }
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className={`font-bold ${isResearched ? 'text-slate-400' : isLocked ? 'text-slate-600' : 'text-white'}`}>
                                                    {isLocked && '🔒 '}{item.name}
                                                </h4>
                                                {isResearched && <span className="text-green-500 font-bold">✓</span>}
                                            </div>
                                            
                                            <p className="text-xs text-slate-400 mb-3 line-clamp-2 min-h-[2.5em] pointer-events-none">{item.description}</p>
                                            
                                            {isLocked && (
                                                <div className="mb-2 text-[10px] text-red-400 border-t border-slate-800 pt-1">
                                                    필요: {unmetPrereqs.map(pid => items.find(i => i.id === pid)?.name).join(', ')}
                                                </div>
                                            )}

                                            <div className="mt-auto pt-2 border-t border-white/10 flex justify-between items-center text-xs pointer-events-none">
                                                <span className="font-mono text-slate-500">Cost: {item.cost}</span>
                                                {isCurrent && <span className="text-amber-400 font-bold animate-pulse">연구 중</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {type === 'CULTURE' && (
            <div className="p-4 bg-purple-900/20 border-t border-purple-500/30 backdrop-blur-sm flex justify-center shrink-0">
                 <button 
                        onClick={onTogglePolicy}
                        className={`px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 border-2 ${
                            player.activePolicies.borderExpansion 
                            ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' 
                            : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-purple-500'
                        }`}
                    >
                        {player.activePolicies.borderExpansion ? '정책: 국경 확장 가속 활성화됨' : '정책: 국경 확장 가속 비활성'}
                    </button>
            </div>
        )}
    </div>
  );
};

export default ResearchPanel;
