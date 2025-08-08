import type { RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { useLatest } from './use-latest';

type WindowEventName = keyof WindowEventMap;

type DocumentEventName = keyof DocumentEventMap;

type GeneralEventName = keyof GlobalEventHandlersEventMap;

type WindowEventListener<E extends WindowEventName> = (ev: WindowEventMap[E]) => unknown;

type DocumentEventListener<E extends DocumentEventName> = (ev: DocumentEventMap[E]) => unknown;

type GeneralEventListener<E extends GeneralEventName> = (ev: GlobalEventHandlersEventMap[E]) => unknown;

/**
 * Overload 1: Omitted Window target
 *
 * @param event
 * @param listener
 */
export function useEventListener<E extends WindowEventName>(event: E, listener: WindowEventListener<E>, options?: boolean | AddEventListenerOptions): void;
/**
 * Overload 2: Explicitly Document target
 *
 * @param target
 * @param event
 * @param listener
 */
export function useEventListener<E extends DocumentEventName>(target: Document, event: E, listener: DocumentEventListener<E>, options?: boolean | AddEventListenerOptions): void;
/**
 * Overload 3: Custom target
 *
 * @param target
 * @param event
 * @param listener
 */
export function useEventListener<T extends HTMLElement, E extends GeneralEventName>(target: RefObject<T | null>, event: E, listener: GeneralEventListener<E>, options?: boolean | AddEventListenerOptions): void;

export function useEventListener<T extends HTMLElement, E extends GeneralEventName>(...args: any[]) {
  const argsOffset = typeof args[0] !== 'string';
  const event = args[+argsOffset] as GeneralEventName;
  const listenerRef = useLatest<GeneralEventListener<E>>(args[+argsOffset + 1]);
  const options = useRef<AddEventListenerOptions>(args[+argsOffset + 2]);
  const handler = useCallback((_event: Event) => listenerRef.current(_event as GlobalEventHandlersEventMap[E]), [listenerRef]);

  useEffect(() => {
    const targetElement: T | Document = argsOffset ? (args[0] === document ? document : args[0].current) : window;

    if (targetElement) {
      const currentOptions = options.current;
      targetElement.addEventListener(event, handler, currentOptions);

      return () => targetElement.removeEventListener(event, handler, currentOptions);
    }
  }, [event, handler, argsOffset, args[0]]);
}
