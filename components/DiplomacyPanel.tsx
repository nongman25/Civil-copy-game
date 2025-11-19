
import React, { useState } from 'react';
import { Player, DiplomaticRelation, PlayerType } from '../types';

interface DiplomacyPanelProps {
  humanPlayer: Player;
  players: Player[];
  onClose: () => void;
  onDeclareWar: (targetId: string) => void;
  onMakePeace: (targetId: string) => void;
  onGift: (targetId: string, gold: number) => void;
}

const DiplomacyPanel: React.FC<DiplomacyPanelProps> = ({ humanPlayer, players, onClose, onDeclareWar, onMakePeace, onGift }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Only show players we have met (AI or Barbarians)
  const opponents = players.filter(p => 
    (p.type === PlayerType.AI || p.type === PlayerType.BARBARIAN) && 
    p.id !== humanPlayer.id && 
    (humanPlayer.metPlayers.includes(p.id) || p.type === PlayerType.BARBARIAN)
  );
  
  const selectedPlayer = opponents.find(p => p.id === selectedId);
  const relation: DiplomaticRelation = selectedPlayer 
    ? humanPlayer.diplomacy[selectedPlayer.id] 
    : { status: 'PEACE', relationship: 50, isOpenBorders: false };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden">
        
        {/* Sidebar List */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-2">
           <h2 className="text-xl font-bold text-slate-200 mb-4">세계 의회</h2>
           {opponents.length === 0 && <div className="text-slate-500 text-sm">아직 만난 문명이 없습니다.</div>}
           
           {opponents.map(p => (
               <button 
                 key={p.id} 
                 onClick={() => setSelectedId(p.id)}
                 className={`p-3 rounded text-left flex items-center gap-3 transition-colors
                    ${selectedId === p.id ? 'bg-slate-700 ring-1 ring-amber-500' : 'hover:bg-slate-700/50'}
                 `}
               >
                   <div className="w-8 h-8 rounded-full border-2 border-white/50 flex items-center justify-center font-bold text-sm" style={{backgroundColor: p.color}}>
                       {p.leaderName[0]}
                   </div>
                   <div>
                       <div className="font-bold text-sm text-slate-200">{p.leaderName}</div>
                       <div className={`text-xs ${humanPlayer.diplomacy[p.id].status === 'WAR' ? 'text-red-400' : 'text-green-400'}`}>
                           {humanPlayer.diplomacy[p.id].status === 'WAR' ? '전쟁 중' : '평화'}
                       </div>
                   </div>
               </button>
           ))}
           <button onClick={onClose} className="mt-auto bg-slate-700 hover:bg-slate-600 text-white py-2 rounded">닫기</button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col relative">
            {selectedPlayer ? (
                <>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-amber-500 shadow-xl flex items-center justify-center text-4xl" style={{backgroundColor: selectedPlayer.color}}>
                           👑
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">{selectedPlayer.leaderName}</h1>
                            <p className="text-slate-400 italic">"{relation.status === 'WAR' ? '네놈을 파멸시키겠다!' : '반갑소, 친구여. 우리 문명은 평화를 사랑하오.'}"</p>
                        </div>
                    </div>

                    {/* Relationship Bar */}
                    <div className="mb-8 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                        <div className="flex justify-between text-sm text-slate-300 mb-1">
                            <span>관계도</span>
                            <span>{relation.relationship} / 100</span>
                        </div>
                        <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-600">
                            <div 
                                className={`h-full ${relation.relationship < 30 ? 'bg-red-500' : relation.relationship > 70 ? 'bg-green-500' : 'bg-amber-500'}`} 
                                style={{width: `${relation.relationship}%`}}
                            ></div>
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex justify-between">
                            <span>적대적</span>
                            <span>중립적</span>
                            <span>우호적</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {relation.status === 'PEACE' ? (
                            <button onClick={() => onDeclareWar(selectedPlayer.id)} className="bg-red-900/80 hover:bg-red-800 border border-red-600 p-6 rounded-xl text-left group">
                                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚔️ 전쟁 선포</div>
                                <div className="text-red-200 text-sm">즉시 전쟁 상태에 돌입합니다.</div>
                            </button>
                        ) : (
                            <button onClick={() => onMakePeace(selectedPlayer.id)} className="bg-green-900/80 hover:bg-green-800 border border-green-600 p-6 rounded-xl text-left group">
                                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🕊️ 평화 협상</div>
                                <div className="text-green-200 text-sm">전쟁을 중단합니다. (상대가 거절할 수 있음)</div>
                            </button>
                        )}
                        
                        <button onClick={() => onGift(selectedPlayer.id, 50)} disabled={humanPlayer.gold < 50} className="bg-amber-900/80 hover:bg-amber-800 border border-amber-600 p-6 rounded-xl text-left group disabled:opacity-50">
                             <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🎁 선물 보내기 (50 G)</div>
                             <div className="text-amber-200 text-sm">우호도를 +10 증가시킵니다.</div>
                        </button>

                        <button disabled={relation.relationship < 80 || relation.status === 'WAR'} className="bg-blue-900/80 hover:bg-blue-800 border border-blue-600 p-6 rounded-xl text-left group disabled:opacity-30 disabled:cursor-not-allowed">
                             <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🤝 동맹 체결</div>
                             <div className="text-blue-200 text-sm">관계도 80 이상 필요. 시야를 공유합니다.</div>
                        </button>

                         <button disabled={relation.relationship < 50 || relation.status === 'WAR'} className="bg-purple-900/80 hover:bg-purple-800 border border-purple-600 p-6 rounded-xl text-left group disabled:opacity-30 disabled:cursor-not-allowed">
                             <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🗺️ 국경 개방</div>
                             <div className="text-purple-200 text-sm">관계도 50 이상 필요. 영토를 통과합니다.</div>
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xl">
                    좌측에서 지도자를 선택하세요.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DiplomacyPanel;
