import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { on } from '@erudis/shared';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-zinc-300 border-zinc-500',
  rare: 'text-blue-400 border-blue-500',
  legendary: 'text-yellow-400 border-yellow-500',
};

export function LootAnimation() {
  const [loot, setLoot] = useState<{
    gold?: number;
    itemName?: string;
    rarity?: string;
  } | null>(null);

  useEffect(() => {
    return on('fx:loot', (data) => {
      setLoot(data);
      const duration = data.rarity === 'legendary' ? 4000 : 2500;
      setTimeout(() => setLoot(null), duration);
    });
  }, []);

  const colorClass = loot?.rarity
    ? RARITY_COLORS[loot.rarity] ?? RARITY_COLORS.common
    : RARITY_COLORS.common;

  return (
    <AnimatePresence>
      {loot && (
        <motion.div
          className="fixed top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <motion.div
            className={`bg-zinc-900/95 border-2 ${colorClass} rounded-xl px-8 py-4 text-center`}
            animate={
              loot.rarity === 'legendary'
                ? { scale: [1, 1.05, 1], boxShadow: ['0 0 10px gold', '0 0 30px gold', '0 0 10px gold'] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {loot.itemName && (
              <p className={`text-xl font-bold ${colorClass.split(' ')[0]}`}>
                {loot.itemName}
              </p>
            )}
            {loot.gold && loot.gold > 0 && (
              <p className="text-yellow-400 text-lg">+{loot.gold} or</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
