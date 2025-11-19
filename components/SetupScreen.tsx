
import React, { useState } from 'react';
import { GameSettings } from '../types';

interface SetupScreenProps {
  onStart: (settings: GameSettings) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [name, setName] = useState("지도자");
  const [mapSize, setMapSize] = useState<GameSettings['mapSize']>('MEDIUM');
  const [playerCount, setPlayerCount] = useState(2);
  const [difficulty, setDifficulty] = useState<GameSettings['difficulty']>('PRINCE');
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => {
      onStart({ mapSize, difficulty, playerName: name, playerCount });
    }, 800);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center">
      <div className="bg-slate-900/90 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full backdrop-blur-sm">
        <h1 className="text-4xl font-bold text-amber-400 mb-2 text-center tracking-wider">CIV GENIUS</h1>
        <p className="text-slate-400 text-center mb-8">문명을 건설하고 정복하십시오.</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">지도자 이름</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">지도 크기</label>
            <div className="grid grid-cols-3 gap-2">
              {(['SMALL', 'MEDIUM', 'LARGE'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setMapSize(size)}
                  className={`px-2 py-2 rounded text-sm font-bold border ${mapSize === size ? 'bg-amber-500 border-amber-500 text-slate-900' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                >
                  {size === 'SMALL' ? '소형' : size === 'MEDIUM' ? '중형' : '대형'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">참가 문명 수</label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`px-2 py-2 rounded text-sm font-bold border ${playerCount === count ? 'bg-blue-500 border-blue-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                >
                  {count}인
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">난이도</label>
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none"
            >
              <option value="PRINCE">왕자 (보통)</option>
              <option value="KING">왕 (어려움)</option>
              <option value="DEITY">신 (매우 어려움)</option>
            </select>
          </div>

          <button 
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 font-bold py-3 rounded shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "세계 생성 중..." : "게임 시작"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
