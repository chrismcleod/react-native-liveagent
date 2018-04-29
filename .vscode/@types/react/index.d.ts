import * as React from 'react';

declare module 'react' {
  export type Ref<T> = string | { bivarianceHack(instance: T | null): any }[ 'bivarianceHack' ] | RefObject<T>;
  export function createRef<T>(): RefObject<T>;
  export interface RefObject<T> {
    readonly current: T | null;
  }
  type Provider<T> = React.ComponentType<{
    value: T;
    children?: ReactNode;
  }>;
  type Consumer<T> = ComponentType<{
    children: (value: T) => ReactNode;
    unstable_observedBits?: number;
  }>;
  interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
  }
  function createContext<T>(defaultValue: T, calculateChangedBits?: (prev: T, next: T) => number): Context<T>;
}
