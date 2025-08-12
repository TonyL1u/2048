import { createScope } from 'animejs';
import { throttle } from 'es-toolkit';
import type { CSSProperties, RefObject } from 'react';

import { AnimatedBlock, AnimationType } from './animation';

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

type DataChangeEvent = (matrix: number[][], self: Game) => void;

type BlockMergeEvent = (
  matrix: number[][],
  source: {
    from: { pos: [number, number]; block: AnimatedBlock };
    to: { pos: [number, number]; block: AnimatedBlock };
  },
  self: Game
) => void;

type BlockClickEvent = (matrix: number[][], source: { pos: [number, number]; block: AnimatedBlock }, self: Game) => void;

const createMatrixArray = (rows: number, cols: number) => {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0) as number[]);
};

const createEventHook = <T extends (...args: any[]) => void>() => {
  const queue: T[] = [];
  const fire = (...params: Parameters<T>) => {
    if (queue.length > 0) {
      queue.forEach(fn => {
        fn.call(null, ...params);
      });
    }
  };
  const on = (evt: T) => {
    queue.push(evt);

    return () => {
      const index = queue.findIndex(_evt => _evt === evt);
      if (index > -1) {
        queue.splice(index, 1);
      }
    };
  };

  return { on, fire } as const;
};

class Game {
  #config = {
    rows: 4,
    cols: 4,
    gap: 8
  };

  #matrix: number[][] = [];
  #blocks: AnimatedBlock[] = [];
  #root: HTMLDivElement | null = null;

  #animationQueue: AnimationType[] = [];
  #isRendering = false;

  #dataChangeEvent = createEventHook<DataChangeEvent>();
  #blockMergeEvent = createEventHook<BlockMergeEvent>();
  #blockClickEvent = createEventHook<BlockClickEvent>();

  onDataChange = this.#dataChangeEvent.on;
  onBlockMerge = this.#blockMergeEvent.on;
  onBlockClick = this.#blockClickEvent.on;

  constructor(config?: GameConfig) {
    this.#config = { ...this.#config, ...config };
  }

  init(root?: RefObject<HTMLDivElement>) {
    if (!root) return;

    this.#root = root.current;
    this.#bindKeyboardEvent();
    this.#bindTouchEvent();

    createScope({ root });
    this.renew();
  }

  renew() {
    this.#isRendering = false;
    this.#animationQueue.length = 0;
    this.#matrix = createMatrixArray(this.#rows, this.#cols);
    this.#render();
    this.#add();
    this.#start();
  }

  addOne(pos?: [number, number], value?: 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048) {
    this.#add(pos, value);
    this.#render();
  }

  deleteOne(pos?: [number, number]) {
    this.#delete(pos);
    this.#render();
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

  get elements() {
    return this.#blocks.filter(block => block.value !== 0).map(block => block.el.childNodes[0]);
  }

  get #rows() {
    return this.#config.rows;
  }

  get #cols() {
    return this.#config.cols;
  }

  #bindKeyboardEvent() {
    window.addEventListener(
      'keydown',
      throttle(
        (e: KeyboardEvent) => {
          if (this.#isRendering) return;

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
  }

  #bindTouchEvent() {
    let isSwiped = false;
    const coordsStart = { x: 0, y: 0 };
    const coordsEnd = { x: 0, y: 0 };

    this.#root!.addEventListener(
      'touchstart',
      e => {
        e.preventDefault();

        isSwiped = false;
        coordsStart.x = coordsStart.y = coordsEnd.x = coordsEnd.y = 0;

        const [x, y] = [e.touches[0].clientX, e.touches[0].clientY];
        coordsStart.x = x;
        coordsStart.y = y;
      },
      { passive: false, capture: true }
    );

    this.#root!.addEventListener(
      'touchmove',
      e => {
        e.preventDefault();

        const [x, y] = [e.touches[0].clientX, e.touches[0].clientY];
        coordsEnd.x = x;
        coordsEnd.y = y;

        const diffX = coordsStart.x - coordsEnd.x;
        const diffY = coordsStart.y - coordsEnd.y;

        if (Math.max(Math.abs(diffX), Math.abs(diffY)) >= 50 && !isSwiped && !this.#isRendering) {
          if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
              if (this.#move(Direction.LEFT)) this.#start();
            } else {
              if (this.#move(Direction.RIGHT)) this.#start();
            }
          } else {
            if (diffY > 0) {
              if (this.#move(Direction.UP)) this.#start();
            } else {
              if (this.#move(Direction.DOWN)) this.#start();
            }
          }

          isSwiped = true;
        }
      },
      { passive: false, capture: true }
    );
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

          this.#blockMergeEvent.fire(
            this.#matrix,
            {
              from: {
                pos: [ni, nj],
                block: this.#blocks[ni * this.#cols + nj]
              },
              to: {
                pos: [i, j],
                block: this.#blocks[i * this.#cols + j]
              }
            },
            this
          );
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

  #add(pos?: [number, number], value?: number) {
    const allZeroPos: number[][] = [];
    for (let i = 0; i < this.#matrix.length; i++) {
      for (let j = 0; j < this.#matrix[i].length; j++) {
        if (this.#matrix[i][j] === 0) {
          allZeroPos.push([i, j]);
        }
      }
    }
    const randomPos = pos || allZeroPos[Math.floor(Math.random() * allZeroPos.length)];
    const randomValue = value || Math.random() < 0.5 ? 2 : 4;

    if (randomPos) {
      const [i, j] = randomPos;
      if (this.#matrix[i][j] === 0) {
        this.#matrix[i][j] = randomValue;
        this.#animationQueue.push({ type: 'zoom', target: [i, j], value: randomValue });
      } else {
        this.#matrix[i][j] += randomValue;
        this.#animationQueue.push({ type: 'pop', target: [i, j] });

        this.#blockMergeEvent.fire(
          this.#matrix,
          {
            from: {
              pos: [i, j],
              block: this.#blocks[i * this.#cols + j]
            },
            to: {
              pos: [i, j],
              block: this.#blocks[i * this.#cols + j]
            }
          },
          this
        );
      }
    }
  }

  #delete(pos?: [number, number]) {
    const allNonZeroPos: number[][] = [];
    for (let i = 0; i < this.#matrix.length; i++) {
      for (let j = 0; j < this.#matrix[i].length; j++) {
        if (this.#matrix[i][j] !== 0) {
          allNonZeroPos.push([i, j]);
        }
      }
    }

    const randomPos = pos || allNonZeroPos[Math.floor(Math.random() * allNonZeroPos.length)];
    if (randomPos) {
      const [i, j] = randomPos;
      if (this.#matrix[i][j] === 0) return;

      this.#matrix[i][j] = 0;
      this.#animationQueue.push({ type: 'zoom', target: [i, j], reverse: true });
    }
  }

  #mountBlocks() {
    this.#blocks = this.#matrix.flat().map(value => new AnimatedBlock(value));
    this.#blocks.forEach((block, index) => {
      block.el.onclick = () => {
        this.#blockClickEvent.fire(this.#matrix, { pos: [~~(index / this.#cols), index % this.#cols], block }, this);
      };
    });

    if (this.#root) {
      while (this.#root.firstChild) {
        this.#root.removeChild(this.#root.firstChild);
      }
      this.#root.append(...this.#blocks.map(block => block.el));
    }

    this.#dataChangeEvent.fire(this.#matrix, this);
  }

  #render() {
    this.#isRendering = true;

    if (this.#animationQueue.length > 0) {
      Promise.all(
        this.#animationQueue.map(async animation => {
          const {
            target: [x, y],
            type,
            ...restParams
          } = animation;
          // @ts-expect-error animejs promise type error
          await this.#blocks[x * this.#cols + y][type](restParams);
        })
      ).then(() => {
        this.#mountBlocks();
      });
    } else {
      this.#mountBlocks();
    }

    this.#isRendering = false;
    this.#animationQueue.length = 0;
  }
}

export default new Game();
