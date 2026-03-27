import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles, Zap, Flame, Lock, Globe, Coins, UserPlus } from 'lucide-react';
import { GameVariant } from '../types';
import { cn } from '../utils/cn';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (config: RoomConfig) => void;
  createdRoomCode?: string | null;
}

interface RoomConfig {
  name: string;
  variant: GameVariant;
  minBuyIn: number;
  maxBuyIn: number;
  bootAmount: number;
  maxPlayers: number;
  isPrivate: boolean;
}

const variants: { id: GameVariant; name: string; description: string; icon: typeof Crown; color: string }[] = [
  { id: 'classic', name: 'Classic', description: 'Traditional Teen Patti rules', icon: Crown, color: 'from-red-600 to-red-800' },
  { id: 'joker', name: 'Joker', description: 'Wild cards add excitement', icon: Sparkles, color: 'from-purple-600 to-purple-800' },
  { id: 'muflis', name: 'Muflis', description: 'Lowest hand wins!', icon: Zap, color: 'from-green-600 to-green-800' },
  { id: 'ak47', name: 'AK47', description: 'A, K, 4, 7 are jokers', icon: Flame, color: 'from-orange-600 to-orange-800' }
];

const buyInPresets = [
  { min: 100, max: 1000, boot: 10, label: 'Casual' },
  { min: 500, max: 5000, boot: 50, label: 'Regular' },
  { min: 1000, max: 10000, boot: 100, label: 'High Stakes' },
  { min: 5000, max: 50000, boot: 500, label: 'VIP' }
];

export function CreateRoomModal({ isOpen, onClose, onCreate, createdRoomCode }: CreateRoomModalProps) {
  const [config, setConfig] = useState<RoomConfig>({
    name: '',
    variant: 'classic',
    minBuyIn: 100,
    maxBuyIn: 1000,
    bootAmount: 10,
    maxPlayers: 6,
    isPrivate: false
  });

  const [step, setStep] = useState(1);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!config.name.trim()) {
      setConfig({ ...config, name: `${variants.find(v => v.id === config.variant)?.name} Table` });
    }
    onCreate(config);
  };

  const handleQuickPrivate = () => {
    // Quick create a private room with default settings
    onCreate({
      name: 'Friends Game',
      variant: 'classic',
      minBuyIn: 500,
      maxBuyIn: 5000,
      bootAmount: 50,
      maxPlayers: 6,
      isPrivate: true
    });
  };

  const selectPreset = (preset: typeof buyInPresets[0]) => {
    setConfig({
      ...config,
      minBuyIn: preset.min,
      maxBuyIn: preset.max,
      bootAmount: preset.boot
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 flex flex-col max-h-[90vh]"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/10 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Create Table</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        step >= s ? 'bg-yellow-500 w-4' : 'bg-white/20'
                      )}
                    />
                  ))}
                </div>

                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {/* Quick Private Room Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleQuickPrivate}
                      className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 border border-purple-400/30 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-white font-semibold">Quick Private Room</p>
                        <p className="text-white/70 text-sm">Create & get room code instantly</p>
                      </div>
                    </motion.button>

                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/40 text-xs">or customize</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <h3 className="text-white/80 text-sm font-medium">Choose Game Variant</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {variants.map((variant) => {
                        const Icon = variant.icon;
                        const isSelected = config.variant === variant.id;
                        return (
                          <motion.button
                            key={variant.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setConfig({ ...config, variant: variant.id })}
                            className={cn(
                              'relative p-4 rounded-2xl text-left transition-all overflow-hidden',
                              isSelected
                                ? `bg-gradient-to-br ${variant.color} ring-2 ring-yellow-500`
                                : 'bg-white/10 hover:bg-white/15'
                            )}
                          >
                            <Icon className={cn('w-6 h-6 mb-2', isSelected ? 'text-white' : 'text-white/60')} />
                            <p className={cn('font-semibold', isSelected ? 'text-white' : 'text-white/80')}>
                              {variant.name}
                            </p>
                            <p className={cn('text-xs mt-0.5', isSelected ? 'text-white/80' : 'text-white/50')}>
                              {variant.description}
                            </p>
                            {isSelected && (
                              <motion.div
                                layoutId="variantIndicator"
                                className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-white/80 text-sm font-medium">Set Buy-in & Boot</h3>

                    {/* Presets */}
                    <div className="grid grid-cols-2 gap-2">
                      {buyInPresets.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => selectPreset(preset)}
                          className={cn(
                            'p-3 rounded-xl text-left transition-all',
                            config.minBuyIn === preset.min
                              ? 'bg-yellow-500 text-yellow-900'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          )}
                        >
                          <p className="font-semibold text-sm">{preset.label}</p>
                          <p className="text-xs opacity-80">₹{preset.min} - ₹{preset.max}</p>
                        </button>
                      ))}
                    </div>

                    {/* Custom inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-white/50 block mb-1">Min Buy-in</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                          <input
                            type="number"
                            value={config.minBuyIn}
                            onChange={(e) => setConfig({ ...config, minBuyIn: Number(e.target.value) })}
                            className="w-full bg-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 block mb-1">Max Buy-in</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">₹</span>
                          <input
                            type="number"
                            value={config.maxBuyIn}
                            onChange={(e) => setConfig({ ...config, maxBuyIn: Number(e.target.value) })}
                            className="w-full bg-white/10 rounded-xl pl-8 pr-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/50 block mb-1">Boot Amount</label>
                      <div className="relative">
                        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          type="number"
                          value={config.bootAmount}
                          onChange={(e) => setConfig({ ...config, bootAmount: Number(e.target.value) })}
                          className="w-full bg-white/10 rounded-xl pl-10 pr-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-white/80 text-sm font-medium">Table Settings</h3>

                    {/* Table name */}
                    <div>
                      <label className="text-xs text-white/50 block mb-1">Table Name</label>
                      <input
                        type="text"
                        value={config.name}
                        onChange={(e) => setConfig({ ...config, name: e.target.value })}
                        placeholder={`${variants.find(v => v.id === config.variant)?.name} Table`}
                        className="w-full bg-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                      />
                    </div>

                    {/* Max players */}
                    <div>
                      <label className="text-xs text-white/50 block mb-2">Max Players</label>
                      <div className="flex gap-2">
                        {[2, 3, 4, 5, 6].map((num) => (
                          <button
                            key={num}
                            onClick={() => setConfig({ ...config, maxPlayers: num })}
                            className={cn(
                              'flex-1 py-2 rounded-xl font-medium transition-all',
                              config.maxPlayers === num
                                ? 'bg-yellow-500 text-yellow-900'
                                : 'bg-white/10 text-white/60 hover:bg-white/15'
                            )}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Privacy */}
                    <div>
                      <label className="text-xs text-white/50 block mb-2">Privacy</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfig({ ...config, isPrivate: false })}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
                            !config.isPrivate
                              ? 'bg-green-600 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/15'
                          )}
                        >
                          <Globe className="w-4 h-4" />
                          Public
                        </button>
                        <button
                          onClick={() => setConfig({ ...config, isPrivate: true })}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
                            config.isPrivate
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/15'
                          )}
                        >
                          <Lock className="w-4 h-4" />
                          Private
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex gap-3">
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
                  >
                    Create Table
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
