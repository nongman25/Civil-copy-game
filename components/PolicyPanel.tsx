
import React from 'react';
import { Player, Policy } from '../types';
import { POLICY_CARDS } from '../constants';

interface PolicyPanelProps {
  player: Player;
  onClose: () => void;
  onTogglePolicy: (policyId: string) => void;
}

const PolicyPanel: React.FC<PolicyPanelProps> = ({ player, onClose, onTogglePolicy }) => {
  const unlockedCards = POLICY_CARDS.filter(p => {
      if (p.requiresCivic) return player.researchedCivics.includes(p.requiresCivic);
      if (p.requiresTech) return player.researchedTechs.includes(p.requiresTech);
      return true;
  });

  const active = player.activePolicies;

  // Group by Type
  const military = unlockedCards.filter(p => p.type === 'MILITARY');
  const economic = unlockedCards.filter(p => p.type === 'ECONOMIC');
  const diplomatic = unlockedCards.filter(p => p.type === 'DIPLOMATIC');
  const wildcard = unlockedCards.filter(p => p.type === 'WILDCARD');

  // Slot Logic (Simplified for now: fixed slots per type)
  // Gov tier 0 (Chiefdom): 1 Military, 1 Economic
  // We will allow 2 of each max for demo simplicity or dynamic
  const SLOTS = { MILITARY: 2, ECONOMIC: 2, DIPLOMATIC: 2, WILDCARD: 1 };

  const renderCard = (policy: Policy) => {
      const isActive = active.includes(policy.id);
      return (
          <div key={policy.id} onClick={() => onTogglePolicy(policy.id)} 
            className={`p-3 rounded border-l-4 cursor-pointer transition-all hover:scale-105 mb-2 relative
               ${policy.type === 'MILITARY' ? 'border-red-500 bg-red-900/30 hover:bg-red-900/50' : 
                 policy.type === 'ECONOMIC' ? 'border-yellow-500 bg-yellow-900/30 hover:bg-yellow-900/50' :
                 policy.type === 'DIPLOMATIC' ? 'border-green-500 bg-green-900/30 hover:bg-green-900/50' :
                 'border-purple-500 bg-purple-900/30 hover:bg-purple-900/50'}
               ${isActive ? 'ring-2 ring-white shadow-lg' : 'opacity-80'}
            `}>
               <div className="font-bold text-sm text-white flex justify-between">
                   <span>{policy.name}</span>
                   {isActive && <span>✅</span>}
               </div>
               <div className="text-xs text-slate-300 mt-1">{policy.description}</div>
          </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8">
        <div className="bg-slate-900 border border-slate-600 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                <div>
                    <h1 className="text-2xl font-bold text-amber-500">정부 및 정책</h1>
                    <p className="text-slate-400 text-sm">문명의 정책을 설정하여 보너스를 획득하십시오.</p>
                </div>
                <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-white font-bold">닫기</button>
            </div>

            <div className="flex-1 overflow-auto p-6 grid grid-cols-4 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h2 className="text-red-400 font-bold border-b border-red-500/30 pb-2 mb-4">군사 정책 ({active.filter(id => POLICY_CARDS.find(c => c.id === id)?.type === 'MILITARY').length}/{SLOTS.MILITARY})</h2>
                    {military.map(renderCard)}
                    {military.length === 0 && <div className="text-slate-600 text-xs italic">해금된 정책 없음</div>}
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h2 className="text-yellow-400 font-bold border-b border-yellow-500/30 pb-2 mb-4">경제 정책 ({active.filter(id => POLICY_CARDS.find(c => c.id === id)?.type === 'ECONOMIC').length}/{SLOTS.ECONOMIC})</h2>
                    {economic.map(renderCard)}
                    {economic.length === 0 && <div className="text-slate-600 text-xs italic">해금된 정책 없음</div>}
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h2 className="text-green-400 font-bold border-b border-green-500/30 pb-2 mb-4">외교 정책 ({active.filter(id => POLICY_CARDS.find(c => c.id === id)?.type === 'DIPLOMATIC').length}/{SLOTS.DIPLOMATIC})</h2>
                    {diplomatic.map(renderCard)}
                    {diplomatic.length === 0 && <div className="text-slate-600 text-xs italic">해금된 정책 없음</div>}
                </div>

                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h2 className="text-purple-400 font-bold border-b border-purple-500/30 pb-2 mb-4">와일드카드 ({active.filter(id => POLICY_CARDS.find(c => c.id === id)?.type === 'WILDCARD').length}/{SLOTS.WILDCARD})</h2>
                    {wildcard.map(renderCard)}
                    {wildcard.length === 0 && <div className="text-slate-600 text-xs italic">해금된 정책 없음</div>}
                </div>
            </div>
        </div>
    </div>
  );
};

export default PolicyPanel;
