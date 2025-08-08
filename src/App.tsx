import './App.css';

import { useGame } from './hooks/use-game';

function App() {
  const { root, containerStyle, score, highestScore, reset } = useGame();

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">2048 游戏</h1>
      <div className="mt-4 flex gap-x-2">
        <div ref={root} className="mx-auto rounded bg-gray-500 p-2" style={containerStyle} />
        <div className="flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-max w-20 space-y-1 rounded bg-gray-400 p-2 text-center">
              <div className="text-sm font-bold text-white">得分</div>
              <div className="w-full rounded bg-gray-300">{score}</div>
            </div>
            <div className="h-max w-20 space-y-1 rounded bg-gray-400 p-2 text-center">
              <div className="text-sm font-bold text-white">最高分</div>
              <div className="w-full rounded bg-gray-300">{highestScore}</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-x-2">
              <button className="flex-1 cursor-pointer rounded bg-gray-100 px-2 py-1 text-sm">+1</button>
              <button className="flex-1 cursor-pointer rounded bg-gray-100 px-2 py-1 text-sm">*2</button>
            </div>
            <button className="w-full cursor-pointer rounded bg-black px-2 py-1 text-sm text-white" onClick={reset}>
              重置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
