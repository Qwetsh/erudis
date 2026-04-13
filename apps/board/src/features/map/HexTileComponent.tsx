import { memo } from 'react';
import { hexToPixel, type HexTile, type POIType } from '@erudis/shared';
import { TERRAIN_COLORS, POI_ICONS } from './hex-colors';

const HEX_SIZE = 28;

type Props = {
  tile: HexTile;
  isHighlighted?: boolean;
  onClick?: () => void;
};

function hexPoints(size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(`${size * Math.cos(angle)},${size * Math.sin(angle)}`);
  }
  return points.join(' ');
}

function HexTileRaw({ tile, isHighlighted, onClick }: Props) {
  const { x, y } = hexToPixel({ q: tile.q, r: tile.r }, HEX_SIZE);
  const fill = tile.discovered
    ? TERRAIN_COLORS[tile.terrain]
    : '#1a1a2e';

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <polygon
        points={hexPoints(HEX_SIZE)}
        fill={fill}
        stroke={isHighlighted ? '#ffd700' : '#333'}
        strokeWidth={isHighlighted ? 2 : 0.5}
        opacity={tile.discovered ? 1 : 0.3}
      />
      {tile.discovered && tile.poi && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          style={{ pointerEvents: 'none' }}
        >
          {POI_ICONS[tile.poi as POIType]}
        </text>
      )}
    </g>
  );
}

export const HexTileComponent = memo(HexTileRaw);
