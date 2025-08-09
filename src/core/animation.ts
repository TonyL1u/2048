import type { AnimationParams } from 'animejs';
import { animate } from 'animejs';

const CUBE_CLASS_MAP: Record<number, string[]> = {
  2: ['bg-orange-50', 'text-black'],
  4: ['bg-orange-50', 'text-black'],
  8: ['bg-orange-100', 'text-black'],
  16: ['bg-orange-100', 'text-black'],
  32: ['bg-orange-200', 'text-black'],
  64: ['bg-orange-200', 'text-black'],
  128: ['bg-orange-300', 'text-black'],
  256: ['bg-orange-400', 'text-black'],
  512: ['bg-orange-500', 'text-white'],
  1024: ['bg-orange-600', 'text-white'],
  2024: ['bg-orange-700', 'text-white']
};

interface BaseParams<T extends 'zoom' | 'slide' | 'pop'> {
  type: T;
  target: readonly [number, number];
  params?: AnimationParams;
}

interface ZoomParams extends BaseParams<'zoom'> {
  value: number;
}

interface SlideParams extends BaseParams<'slide'> {
  pos: readonly [number, number];
  extDistance?: number;
}

type PopParams = BaseParams<'pop'>;

export type AnimationType = ZoomParams | SlideParams | PopParams;

export class AnimatedCube {
  el!: HTMLDivElement;
  static SIZE = 64;
  static DURATION = 100;

  constructor(value: number) {
    const el = document.createElement('div');
    el.className = 'relative flex rounded before:absolute before:top-0 before:right-0 before:bottom-0 before:left-0 before:z-0 before:rounded before:bg-gray-400';
    el.setAttribute('style', `height: ${AnimatedCube.SIZE}px; width: ${AnimatedCube.SIZE}px`);
    const inner = document.createElement('div');
    inner.className = 'z-1 flex h-full w-full items-center justify-center rounded text-xl font-bold shadow';
    inner.classList.add(...(value ? CUBE_CLASS_MAP[value] : ['opacity-0']));
    inner.textContent = `${value}`;
    el.appendChild(inner);

    this.el = el;
  }

  get #target() {
    return this.el.childNodes[0] as HTMLDivElement;
  }

  zoom(params: Omit<ZoomParams, 'type' | 'target'>) {
    const { value, params: _params } = params;
    this.#target.textContent = `${value}`;
    this.#target.classList.add(...CUBE_CLASS_MAP[value]);

    return animate(this.#target, {
      duration: AnimatedCube.DURATION,
      scale: [0.2, 1],
      opacity: 1,
      ..._params
    });
  }

  slide(params: Omit<SlideParams, 'type' | 'target'>) {
    const { pos, extDistance = 0, params: _params } = params;
    const [x, y] = pos;

    return animate(this.#target, {
      duration: AnimatedCube.DURATION,
      x: x * (AnimatedCube.SIZE + extDistance),
      y: y * (AnimatedCube.SIZE + extDistance),
      opacity: 1,
      ..._params
    });
  }

  pop(params: Omit<PopParams, 'type' | 'target'>) {
    const { params: _params } = params;

    return animate(this.#target, {
      duration: AnimatedCube.DURATION,
      scale: [1, 1.2, 1],
      opacity: 1,
      ..._params
    });
  }
}
