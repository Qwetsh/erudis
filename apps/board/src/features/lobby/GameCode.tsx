import { QRCodeSVG } from 'qrcode.react';
import { useGameStore } from '../../store/use-game-store';

const PLAYER_BASE_URL = import.meta.env.PROD
  ? `${window.location.origin}/erudis/player/`
  : 'http://localhost:5174/';

export function GameCode() {
  const gameCode = useGameStore((s) => s.gameCode);

  if (!gameCode) return null;

  const playerUrl = `${PLAYER_BASE_URL}?code=${gameCode}`;

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-xl text-gray-400">Code de la partie</p>
      <div className="flex items-center gap-8">
        <div className="rounded-2xl bg-gray-800 px-12 py-6">
          <span className="font-mono text-7xl font-bold tracking-[0.3em] text-white">
            {gameCode}
          </span>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <QRCodeSVG value={playerUrl} size={160} level="M" />
        </div>
      </div>
      <p className="text-gray-500">Scannez le QR code ou entrez le code sur votre téléphone</p>
    </div>
  );
}
