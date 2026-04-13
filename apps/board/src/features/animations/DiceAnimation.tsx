import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { on } from '@erudis/shared';

export function DiceAnimation() {
  const [dice, setDice] = useState<{ result: number; dieType: string } | null>(null);

  useEffect(() => {
    return on('fx:dice-roll', (data) => {
      setDice(data);
      setTimeout(() => setDice(null), 2500);
    });
  }, []);

  return (
    <AnimatePresence>
      {dice && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-zinc-900/90 border-2 border-yellow-400 rounded-2xl px-12 py-8 text-center"
            initial={{ scale: 0.3, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <p className="text-zinc-400 text-sm mb-2">{dice.dieType}</p>
            <motion.span
              className="text-6xl font-bold text-yellow-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {dice.result}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
