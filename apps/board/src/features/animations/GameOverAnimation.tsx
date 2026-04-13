import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { on } from '@erudis/shared';

export function GameOverAnimation() {
  const [winner, setWinner] = useState<{ winnerName: string } | null>(null);

  useEffect(() => {
    return on('fx:game-over', (data) => {
      setWinner(data);
    });
  }, []);

  return (
    <AnimatePresence>
      {winner && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
          >
            <motion.p
              className="text-2xl text-zinc-400 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Victoire !
            </motion.p>
            <motion.h1
              className="text-6xl font-bold text-yellow-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              {winner.winnerName}
            </motion.h1>
            <motion.p
              className="text-xl text-zinc-300 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              a réussi l'Épreuve du Brevet !
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
