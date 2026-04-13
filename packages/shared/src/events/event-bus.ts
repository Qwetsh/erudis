/** Event Bus typé pour événements éphémères (animations, sons) */

type EventMap = {
  'fx:dice-roll': { result: number; dieType: string };
  'fx:combat-hit': { damage: number; target: 'monster' | 'player' };
  'fx:loot': { gold?: number; itemName?: string; rarity?: string };
  'fx:chest-open': { q: number; r: number };
  'fx:level-up': { playerId: string };
  'fx:death': { playerId: string };
  'fx:pvp-bar': { position: number };
  'fx:game-over': { winnerId: string; winnerName: string };
  'fx:sound': { sound: string; volume?: number };
};

type EventHandler<T> = (data: T) => void;

const listeners = new Map<string, Set<EventHandler<unknown>>>();

export function emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
  const handlers = listeners.get(event);
  if (handlers) {
    for (const handler of handlers) {
      handler(data);
    }
  }
}

export function on<K extends keyof EventMap>(
  event: K,
  handler: EventHandler<EventMap[K]>,
): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(handler as EventHandler<unknown>);

  return () => {
    listeners.get(event)?.delete(handler as EventHandler<unknown>);
  };
}

export function off<K extends keyof EventMap>(
  event: K,
  handler: EventHandler<EventMap[K]>,
): void {
  listeners.get(event)?.delete(handler as EventHandler<unknown>);
}
