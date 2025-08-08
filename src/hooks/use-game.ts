import { useEffect, useRef, useState } from 'react';

import { Game } from '../core/game';

const game = new Game();

export const useGame = () => {
  const root = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highestScore, setHighestScore] = useState(() => {
    const localData = localStorage.getItem('2048_highest_score');
    if (localData) return +localData;

    return 0;
  });

  useEffect(() => {
    if (root.current) {
      game.init(root);
      game.onDataChange(matrix => {
        const score = matrix.flat().reduce((a, b) => a + b);
        setScore(score);
        if (score > highestScore) {
          setHighestScore(score);
          localStorage.setItem('2048_highest_score', `${score}`);
        }
      });
    }
  }, []);

  return {
    root,
    containerStyle: game.containerStyle,
    score,
    highestScore,
    reset: () => {
      game.renew();
      setScore(0);
    }
  };
};
