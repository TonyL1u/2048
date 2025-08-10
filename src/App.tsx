import './App.css';

import { useEffect, useRef, useState } from 'react';

import { useGame } from './hooks/use-game';

function App() {
  const { root, containerStyle, score, isGameOver, reset, addOne, deleteOne } = useGame();
  const oldScore = useRef(0);
  const scoreAdditionEl = useRef<HTMLDivElement>(null);
  const [bestScore, setBestScore] = useState(() => {
    const localData = localStorage.getItem('2048_best_score');
    if (localData) return +localData;

    return 0;
  });

  useEffect(() => {
    if (scoreAdditionEl.current && score > oldScore.current) {
      scoreAdditionEl.current.textContent = `+${score - oldScore.current}`;
      scoreAdditionEl.current.animate(
        [
          { top: '10px', opacity: 1 },
          { top: '-30px', opacity: 0 }
        ],
        { duration: 600, fill: 'forwards' }
      );
    }
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('2048_best_score', `${score}`);
    }

    oldScore.current = score;
  }, [score]);

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">2048 Game</h1>
      <div className="mt-4 flex gap-x-2">
        <div className="relative">
          <div ref={root} className="mx-auto rounded bg-gray-500 p-2" style={containerStyle} />
          {isGameOver && (
            <div className="absolute top-0 z-2 flex h-full w-full flex-col items-center justify-center gap-y-2 bg-white opacity-80 backdrop-blur-3xl">
              <div className="text-2xl font-bold">Game Over</div>
              <button className="cursor-pointer rounded bg-black px-2 py-1 text-xs text-white" onClick={reset}>
                Try again
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-max w-full space-y-1 rounded bg-gray-400 p-2 text-center">
              <div className="text-sm font-bold text-white">SCORE</div>
              <div className="relative w-full rounded bg-gray-300">
                {score}
                <div ref={scoreAdditionEl} className="absolute top-0 right-0 font-bold" />
              </div>
            </div>
            <div className="h-max w-full space-y-1 rounded bg-gray-400 p-2 text-center">
              <div className="text-sm font-bold text-white">BEST</div>
              <div className="w-full rounded bg-gray-300">{bestScore}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-x-2">
              <button
                className="flex-1 cursor-pointer rounded bg-gray-100 px-2 py-1 text-sm"
                onClick={() => {
                  deleteOne([0, 0]);
                }}>
                -1
              </button>
              <button
                className="flex-1 cursor-pointer rounded bg-gray-100 px-2 py-1 text-sm"
                onClick={() => {
                  addOne([0, 0]);
                }}>
                +1
              </button>
            </div>
            <button className="w-full cursor-pointer rounded bg-black px-2 py-1 text-sm text-white" onClick={reset}>
              New Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
