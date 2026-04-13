import { useMemo } from 'react';
import type { HexTile, PlayerRow } from '@erudis/shared';
import { HexTileComponent } from './HexTileComponent';
import { PlayerMarker } from './PlayerMarker';

type Props = {
  tiles: HexTile[];
  players: PlayerRow[];
  highlightedHexes?: Set<string>;
  onHexClick?: (q: number, r: number) => void;
};

export function HexMap({ tiles, players, highlightedHexes, onHexClick }: Props) {
  const viewBox = useMemo(() => {
    if (tiles.length === 0) return '-400 -400 800 800';
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const tile of tiles) {
      // Approximation rapide via coordonnées
      const x = 28 * (3 / 2 * tile.q);
      const y = 28 * (Math.sqrt(3) / 2 * tile.q + Math.sqrt(3) * tile.r);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const padding = 60;
    return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  }, [tiles]);

  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      style={{ background: '#0a0a1a' }}
    >
      {tiles.map((tile) => (
        <HexTileComponent
          key={`${tile.q},${tile.r}`}
          tile={tile}
          isHighlighted={highlightedHexes?.has(`${tile.q},${tile.r}`)}
          onClick={onHexClick ? () => onHexClick(tile.q, tile.r) : undefined}
        />
      ))}
      {players.map((player, i) => (
        <PlayerMarker
          key={player.id}
          q={player.position_q}
          r={player.position_r}
          playerIndex={i}
          playerName={player.name}
          isConnected={player.is_connected}
        />
      ))}
    </svg>
  );
}
