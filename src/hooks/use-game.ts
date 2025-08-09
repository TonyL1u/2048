/* eslint-disable @typescript-eslint/prefer-for-of */
import { useEffect, useRef, useState } from 'react';

import { Game } from '../core/game';

const game = new Game();

export const useGame = () => {
  const root = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const checkIsGameOver = (matrix: number[][]) => {
    let over = true;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] === 0 || matrix[i][j] === matrix[i][j + 1]) {
          over = false;
          break;
        }
      }

      if (!over) break;
    }

    for (let j = 0; j < matrix[0].length; j++) {
      for (let i = 0; i < matrix.length; i++) {
        if (matrix[i][j] === 0 || matrix[i][j] === matrix[i + 1]?.[j]) {
          over = false;
          break;
        }
      }

      if (!over) break;
    }

    return over;
  };

  useEffect(() => {
    if (root.current) {
      game.init(root);
      game.onCubeMerged(value => {
        setScore(score => score + value);
      });
      game.onDataChange(matrix => {
        setIsGameOver(checkIsGameOver(matrix));
      });
    }
  }, []);

  return {
    root,
    containerStyle: game.containerStyle,
    score,
    isGameOver,
    reset: () => {
      game.renew();
      setScore(0);
    }
  };
};
