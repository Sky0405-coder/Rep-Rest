import {
  getPlayerView,
  initialPlayerState,
  playerReducer,
  type PlayerAction,
  type PlayerConfig,
  type PlayerEvent,
  type PlayerState,
  type Step,
} from '@workout/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

type Distribute<T> = T extends unknown ? Omit<T, 'now'> : never;
export type PlayerCommand = Distribute<PlayerAction>;

const TICK_MS = 100;

/**
 * Verbindet den reinen Player-Reducer aus `core` mit React: Takt, App-Wechsel
 * und Ereignisse (Töne, Vibration). Die Zeit kommt immer aus Date.now().
 */
export function usePlayer(steps: readonly Step[], config: PlayerConfig, onEvents: (events: PlayerEvent[]) => void) {
  const [state, setState] = useState<PlayerState>(initialPlayerState);
  // Spiegel des States für dispatch, damit schnelle Aktionen nicht auf einem veralteten Stand arbeiten.
  const stateRef = useRef<PlayerState>(state);
  const [now, setNow] = useState(() => Date.now());
  const onEventsRef = useRef(onEvents);
  useEffect(() => {
    onEventsRef.current = onEvents;
  });

  const dispatch = useCallback(
    (command: PlayerCommand) => {
      const t = Date.now();
      const result = playerReducer(stateRef.current, { ...command, now: t } as PlayerAction, steps, config);
      if (result.state !== stateRef.current) {
        stateRef.current = result.state;
        setState(result.state);
      }
      setNow(t);
      if (result.events.length > 0) onEventsRef.current(result.events);
    },
    [steps, config],
  );

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'tick' }), TICK_MS);
    // Nach Rückkehr in die App sofort aufholen statt bis zum nächsten Takt zu warten.
    const sub = AppState.addEventListener('change', (s) => s === 'active' && dispatch({ type: 'tick' }));
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [dispatch]);

  return { state, view: getPlayerView(state, steps, now, config), dispatch };
}
