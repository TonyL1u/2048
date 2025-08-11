/* eslint-disable @typescript-eslint/prefer-for-of */
import { useEffect, useRef, useState } from 'react';

import Game from '../core/game';

export interface UseGameOptions {
  godMode?: boolean;
}

export const useGame = (options?: UseGameOptions) => {
  const { godMode } = options || {};
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
      Game.init(root);
      Game.onBlockMerge((_, { to }) => {
        setScore(score => score + to.block.value * 2);
      });
      Game.onDataChange(matrix => {
        setIsGameOver(checkIsGameOver(matrix));
      });
    }
  }, []);

  useEffect(() => {
    const off = Game.onBlockClick((matrix, { pos }) => {
      if (!godMode) return;

      const [i, j] = pos;
      if (matrix[i][j] === 0) {
        Game.addOne(pos, 2);
      } else {
        Game.deleteOne(pos);
      }
    });

    return off;
  }, [godMode]);

  return {
    root,
    containerStyle: Game.containerStyle,
    score,
    isGameOver,
    reset: () => {
      Game.renew();
      setScore(0);
    }
  };
};
