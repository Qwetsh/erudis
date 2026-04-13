import { DiceAnimation } from './DiceAnimation';
import { CombatAnimation } from './CombatAnimation';
import { LootAnimation } from './LootAnimation';
import { GameOverAnimation } from './GameOverAnimation';

/** Couche d'animations overlay — à placer dans le root de l'app */
export function AnimationLayer() {
  return (
    <>
      <DiceAnimation />
      <CombatAnimation />
      <LootAnimation />
      <GameOverAnimation />
    </>
  );
}
