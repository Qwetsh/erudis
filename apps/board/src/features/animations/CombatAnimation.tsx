import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { on } from '@erudis/shared';

export function CombatAnimation() {
  const [hit, setHit] = useState<{ damage: number; target: string } | null>(null);

  useEffect(() => {
    return on('fx:combat-hit', (data) => {
      setHit(data);
      setTimeout(() => setHit(null), 1500);
    });
  }, []);

  return (
    <AnimatePresence>
      {hit && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`text-5xl font-bold ${
              hit.target === 'monster' ? 'text-red-500' : 'text-orange-400'
            }`}
            initial={{ scale: 2, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.5 }}
          >
            -{hit.damage}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
