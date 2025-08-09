import { createScope } from 'animejs';
import { throttle } from 'es-toolkit';
import type { CSSProperties, RefObject } from 'react';

import { AnimatedCube, AnimationType } from './animation';

enum Direction {
  UP,
  RIGHT,
  DOWN,
  LEFT
}

interface GameConfig {
  rows?: number;
  cols?: number;
  gap?: number;
}

const createMatrixArray = (rows: number, cols: number) => {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0) as number[]);
};

export class Game {
  #config = {
    rows: 4,
    cols: 4,
    gap: 8
  };

  #matrix: number[][] = [];
  #cubes: AnimatedCube[] = [];
  #root: HTMLDivElement | null = null;

  #animationQueue: AnimationType[] = [];
  #dataChangeEventQueue: ((matrix: number[][]) => void)[] = [];
  #cubeMergedEventQueue: ((value: number) => void)[] = [];

  constructor(config?: GameConfig) {
    this.#config = { ...this.#config, ...config };
  }

  init(root?: RefObject<HTMLDivElement>) {
    window.addEventListener(
      'keydown',
      throttle(
        (e: KeyboardEvent) => {
          switch (e.key) {
            case 'ArrowUp': {
              e.preventDefault();
              if (this.#move(Direction.UP)) this.#start();

              break;
            }

            case 'ArrowRight':
              e.preventDefault();
              if (this.#move(Direction.RIGHT)) this.#start();

              break;
            case 'ArrowDown':
              e.preventDefault();
              if (this.#move(Direction.DOWN)) this.#start();

              break;
            case 'ArrowLeft':
              e.preventDefault();
              if (this.#move(Direction.LEFT)) this.#start();

              break;
          }
        },
        200,
        { edges: ['leading'] }
      )
    );

    if (root) {
      createScope({ root });
      this.#root = root.current;
      this.renew();
    }
  }

  renew() {
    this.#animationQueue.length = 0;
    this.#matrix = createMatrixArray(this.#rows, this.#cols);
    this.#render();
    this.#add();
    this.#start();
  }

  onDataChange(evt: (matrix: number[][]) => void) {
    this.#dataChangeEventQueue.push(evt);
  }

  onCubeMerged(evt: (value: number) => void) {
    this.#cubeMergedEventQueue.push(evt);
  }

  get containerStyle(): CSSProperties {
    const { gap } = this.#config;

    return {
      display: 'grid',
      width: 'max-content',
      gridTemplateColumns: `repeat(${this.#cols}, minmax(0, 1fr))`,
      gap: `${gap}px`
    };
  }

  get #rows() {
    return this.#config.rows;
  }

  get #cols() {
    return this.#config.cols;
  }

  #start() {
    this.#add();
    this.#render();
  }

  #move(direction: Direction) {
    let isMoved = false;
    const getNextPos = (
      {
        [Direction.UP]: (i, j) => [i + 1, j],
        [Direction.RIGHT]: (i, j) => [i, j - 1],
        [Direction.DOWN]: (i, j) => [i - 1, j],
        [Direction.LEFT]: (i, j) => [i, j + 1]
      } as Record<Direction, (i: number, j: number) => [number, number]>
    )[direction];
    const inRange = (i: number, j: number) => {
      return i >= 0 && i < this.#rows && j >= 0 && j < this.#cols;
    };
    const findNextNonZero = (i: number, j: number) => {
      const [ni, nj] = getNextPos(i, j);

      if (!inRange(ni, nj)) return;

      if (this.#matrix[ni][nj] !== 0) return [ni, nj] as const;

      return findNextNonZero(ni, nj);
    };
    const calculate = (i: number, j: number) => {
      const next = findNextNonZero(i, j);

      if (next) {
        const [ni, nj] = next;
        const currentValue = this.#matrix[i][j];
        const nextValue = this.#matrix[ni][nj];
        const animation = {
          type: 'slide',
          target: [ni, nj],
          pos: [j - nj, i - ni],
          extDistance: this.#config.gap
        } as const;

        if (currentValue === 0) {
          [this.#matrix[i][j], this.#matrix[ni][nj]] = [this.#matrix[ni][nj], this.#matrix[i][j]];
          this.#animationQueue.push(animation);
          isMoved = true;
          calculate(i, j);
        } else if (currentValue === nextValue) {
          this.#matrix[i][j] *= 2;
          this.#matrix[ni][nj] = 0;
          this.#animationQueue.push({ ...animation, params: { opacity: 0.2 } });
          this.#animationQueue.push({ type: 'pop', target: [i, j] });
          isMoved = true;

          if (this.#cubeMergedEventQueue.length > 0) {
            this.#cubeMergedEventQueue.forEach(fn => {
              fn.call(null, this.#matrix[i][j]);
            });
          }
        }

        calculate(...getNextPos(i, j));
      }
    };

    switch (direction) {
      case Direction.UP:
        for (let j = 0; j < this.#cols; j++) {
          calculate(0, j);
        }

        break;
      case Direction.RIGHT:
        for (let i = 0; i < this.#rows; i++) {
          calculate(i, this.#cols - 1);
        }

        break;
      case Direction.DOWN:
        for (let j = 0; j < this.#cols; j++) {
          calculate(this.#rows - 1, j);
        }

        break;
      case Direction.LEFT:
        for (let i = 0; i < this.#rows; i++) {
          calculate(i, 0);
        }

        break;
    }

    return isMoved;
  }

  #add() {
    const allZeroPos: number[][] = [];
    for (let i = 0; i < this.#matrix.length; i++) {
      for (let j = 0; j < this.#matrix[i].length; j++) {
        if (this.#matrix[i][j] === 0) {
          allZeroPos.push([i, j]);
        }
      }
    }
    const pos = allZeroPos[Math.floor(Math.random() * allZeroPos.length)];
    const value = Math.random() < 0.5 ? 2 : 4;

    if (pos) {
      const [i, j] = pos;
      this.#matrix[i][j] = value;
      this.#animationQueue.push({ type: 'zoom', target: [i, j], value });
    }
  }

  #render() {
    const remountCubes = () => {
      this.#cubes = this.#matrix.flat().map(value => new AnimatedCube(value));

      if (this.#root) {
        while (this.#root.firstChild) {
          this.#root!.removeChild(this.#root.firstChild);
        }
        this.#root.append(...this.#cubes.map(cube => cube.el));
      }

      if (this.#dataChangeEventQueue.length > 0) {
        this.#dataChangeEventQueue.forEach(fn => {
          fn.call(null, this.#matrix);
        });
      }
    };

    if (this.#animationQueue.length > 0) {
      Promise.all(
        this.#animationQueue.map(async animation => {
          const {
            target: [x, y],
            type,
            params
          } = animation;
          const targetIndex = x * this.#cols + y;

          if (type === 'zoom') {
            const { value } = animation;

            // @ts-expect-error promise type error
            await this.#cubes[targetIndex].zoom({ value, params });
          } else if (type === 'slide') {
            const { pos, extDistance } = animation;

            // @ts-expect-error promise type error
            await this.#cubes[targetIndex].slide({ pos, extDistance, params });
          } else if (type === 'pop') {
            // @ts-expect-error promise type error
            await this.#cubes[targetIndex].pop({});
          }
        })
      ).then(() => {
        remountCubes();
      });
    } else {
      remountCubes();
    }

    this.#animationQueue.length = 0;
  }
}
