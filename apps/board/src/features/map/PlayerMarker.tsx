import { memo } from 'react';
import { hexToPixel } from '@erudis/shared';

const HEX_SIZE = 28;

const PLAYER_COLORS = [
  '#ef4444', '#3b82f6', '#22c55e', '#f59e0b',
  '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#6366f1', '#84cc16',
];

type Props = {
  q: number;
  r: number;
  playerIndex: number;
  playerName: string;
  isConnected: boolean;
};

function PlayerMarkerRaw({ q, r, playerIndex, playerName, isConnected }: Props) {
  const { x, y } = hexToPixel({ q, r }, HEX_SIZE);
  const color = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
  const offset = (playerIndex % 3 - 1) * 8;

  return (
    <g transform={`translate(${x + offset},${y - 8})`} opacity={isConnected ? 1 : 0.4}>
      <circle r={6} fill={color} stroke="#fff" strokeWidth={1.5} />
      <text
        y={16}
        textAnchor="middle"
        fill="#fff"
        fontSize={8}
        fontWeight="bold"
        style={{ pointerEvents: 'none' }}
      >
        {playerName.slice(0, 3)}
      </text>
    </g>
  );
}

export const PlayerMarker = memo(PlayerMarkerRaw);
