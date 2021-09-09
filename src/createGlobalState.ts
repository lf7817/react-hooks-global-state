import { SetStateAction, useCallback } from 'react';

import create from 'zustand';

const validateStateKey = (keys: string[], stateKey: string) => {
  if (!keys.includes(stateKey)) {
    throw new Error(`'${stateKey}' not found. It must be provided in initialState as a property key.`);
  }
};

const isFunction = (fn: unknown): fn is Function => (typeof fn === 'function');

const updateValue = <Value>(oldValue: Value, newValue: SetStateAction<Value>) => {
  if (isFunction(newValue)) {
    return newValue(oldValue);
  }
  return newValue;
};

/**
 * Create a global state.
 *
 * It returns a set of functions
 * - `useGlobalState`: a custom hook works like React.useState
 * - `getGlobalState`: a function to get a global state by key outside React
 * - `setGlobalState`: a function to set a global state by key outside React
 *
 * @example
 * import { createGlobalState } from 'react-hooks-global-state';
 *
 * const { useGlobalState } = createGlobalState({ count: 0 });
 *
 * const Component = () => {
 *   const [count, setCount] = useGlobalState('count');
 *   ...
 * };
 */
export const createGlobalState = <State extends object>(initialState: State) => {
  const useStore = create<State>(() => initialState);

  type StateKeys = keyof State;
  const keys = Object.keys(initialState);

  const setGlobalState = <StateKey extends StateKeys>(
    stateKey: StateKey,
    update: SetStateAction<State[StateKey]>,
  ) => {
    if (process.env.NODE_ENV !== 'production') {
      validateStateKey(keys, stateKey as string);
    }
    useStore.setState((previousState) => ({
      [stateKey]: updateValue(previousState[stateKey], update),
    } as Pick<State, StateKey>));
  };

  const useGlobalState = <StateKey extends StateKeys>(stateKey: StateKey) => {
    if (process.env.NODE_ENV !== 'production') {
      validateStateKey(keys, stateKey as string);
    }
    const selector = useCallback((state: State) => state[stateKey], [stateKey]);
    const partialState = useStore(selector);
    const updater = useCallback(
      (u: SetStateAction<State[StateKey]>) => setGlobalState(stateKey, u),
      [stateKey],
    );
    return [partialState, updater] as const;
  };

  const getGlobalState = <StateKey extends StateKeys>(stateKey: StateKey) => {
    if (process.env.NODE_ENV !== 'production') {
      validateStateKey(keys, stateKey as string);
    }
    return useStore.getState()[stateKey];
  };

  return {
    useGlobalState,
    getGlobalState,
    setGlobalState,
  };
};
