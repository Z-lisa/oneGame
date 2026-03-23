import React, { useState, useEffect, useCallback } from 'react';
import type { Level, Position } from './types';
import { generateLevel } from './levelGenerator';
import { checkLevelConnection, getConnectedCells } from './connectionChecker';
import { PipeGameCanvas } from './PipeGameCanvas';

export const PipeGame: React.FC = () => {
  const [level, setLevel] = useState<Level | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [moves, setMoves] = useState(0);
  const [connectedCells, setConnectedCells] = useState<Position[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);

  const initLevel = useCallback(() => {
    const newLevel = generateLevel(8);
    setLevel(newLevel);
    setIsWin(false);
    setMoves(0);
    setConnectedCells([]);
  }, []);

  useEffect(() => {
    initLevel();
  }, [initLevel]);

  useEffect(() => {
    if (level) {
      const connected = getConnectedCells(level);
      setConnectedCells(connected);
    }
  }, [level]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!level || isWin) return;

    const cell = level.grid[row][col];
    if (!cell.pipeType || cell.pipeType.id === 'empty') return;

    const newGrid = level.grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          return {
            ...c,
            rotation: (c.rotation + 1) % 4,
          };
        }
        return c;
      })
    );

    const newLevel = { ...level, grid: newGrid };
    setLevel(newLevel);
    setMoves(prev => prev + 1);

    const connected = getConnectedCells(newLevel);
    setConnectedCells(connected);

    if (checkLevelConnection(newLevel)) {
      setIsWin(true);
    }
  }, [level, isWin]);

  if (!level) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-slate-300">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent text-center w-full">
        水管连接
      </h1>
      <p className="text-slate-400 mb-6 text-center">连接起点到终点，让水流通畅！</p>

      <div className="flex gap-8 mb-6">
        <div className="bg-slate-800 px-6 py-3 rounded-lg text-center min-w-[80px]">
          <span className="text-slate-400 text-sm">步数</span>
          <div className="text-2xl font-bold text-cyan-400 text-center">{moves}</div>
        </div>
        <div className="bg-slate-800 px-6 py-3 rounded-lg text-center min-w-[80px]">
          <span className="text-slate-400 text-sm">连通</span>
          <div className="text-2xl font-bold text-green-400 text-center">{connectedCells.length}</div>
        </div>
      </div>

      <div className="relative">
        <PipeGameCanvas
          grid={level.grid}
          size={level.size}
          connectedCells={connectedCells}
          onCellClick={handleCellClick}
          cellSize={60}
        />

        {isWin && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-green-400 mb-2">恭喜通关！</h2>
              <p className="text-slate-300 mb-4">用了 {moves} 步完成</p>
              <button
                onClick={initLevel}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
              >
                再来一局
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex gap-4">
        <button
          onClick={initLevel}
          className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          重新开始
        </button>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          {showInstructions ? '隐藏说明' : '游戏说明'}
        </button>
      </div>

      {showInstructions && (
        <div className="mt-6 bg-slate-800/50 p-6 rounded-xl max-w-md">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">游戏说明</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>• <span className="text-green-400 font-bold">S</span> 是起点，<span className="text-red-400 font-bold">E</span> 是终点</li>
            <li>• 点击水管可以顺时针旋转</li>
            <li>• 将所有水管正确连接，形成从起点到终点的通路</li>
            <li>• <span className="text-cyan-400">青色</span> 表示已经连通的部分</li>
            <li>• 6种水管类型：直型2种，弯型4种</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-400 mb-2">水管类型：</h4>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
              <div className="bg-slate-700/50 p-2 rounded text-center">│ 上下通</div>
              <div className="bg-slate-700/50 p-2 rounded text-center">─ 左右通</div>
              <div className="bg-slate-700/50 p-2 rounded text-center">└ 上右通</div>
              <div className="bg-slate-700/50 p-2 rounded text-center">┌ 右下同</div>
              <div className="bg-slate-700/50 p-2 rounded text-center">┐ 下左通</div>
              <div className="bg-slate-700/50 p-2 rounded text-center">┘ 左上通</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
