import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import {
  Plus,
  Diamond,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Trophy,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// --- Types ---

interface Transaction {
  id: string;
  type: 'win' | 'loss' | 'purchase' | 'reward' | 'gift';
  amount: number;
  currency: 'chips' | 'diamonds';
  description: string;
  timestamp: Date;
}

interface WalletWidgetProps {
  chips?: number;
  diamonds?: number;
  transactions?: Transaction[];
  onOpenStore?: () => void;
  className?: string;
}

// --- Mock data ---

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    type: 'win',
    amount: 5000,
    currency: 'chips',
    description: 'Classic table win',
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 't2',
    type: 'reward',
    amount: 750,
    currency: 'chips',
    description: 'Daily reward Day 2',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 't3',
    type: 'loss',
    amount: 2000,
    currency: 'chips',
    description: 'High stakes table',
    timestamp: new Date(Date.now() - 7200000),
  },
  {
    id: 't4',
    type: 'purchase',
    amount: 15000,
    currency: 'chips',
    description: 'Chip package ₹100',
    timestamp: new Date(Date.now() - 14400000),
  },
  {
    id: 't5',
    type: 'gift',
    amount: 500,
    currency: 'chips',
    description: 'Gift from Priya',
    timestamp: new Date(Date.now() - 28800000),
  },
];

// --- Helpers ---

function getTransactionIcon(type: Transaction['type']) {
  switch (type) {
    case 'win':
      return <Trophy size={12} className="text-green-400" />;
    case 'loss':
      return <ArrowUpRight size={12} className="text-red-400" />;
    case 'purchase':
      return <ShoppingCart size={12} className="text-blue-400" />;
    case 'reward':
      return <Gift size={12} className="text-yellow-400" />;
    case 'gift':
      return <ArrowDownLeft size={12} className="text-purple-400" />;
  }
}

function getTransactionColor(type: Transaction['type']): string {
  switch (type) {
    case 'win':
    case 'reward':
    case 'gift':
    case 'purchase':
      return 'text-green-400';
    case 'loss':
      return 'text-red-400';
  }
}

function getTransactionSign(type: Transaction['type']): string {
  switch (type) {
    case 'loss':
      return '-';
    default:
      return '+';
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// --- Animated Counter ---

function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(0);
  const [displayValue, setDisplayValue] = useState(formatChips(value));
  const prevValue = useRef(value);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplayValue(formatChips(Math.round(v))),
    });

    // Flash effect
    prevValue.current = value;
    return controls.stop;
  }, [value, motionVal]);

  const isIncreasing = value > prevValue.current;

  return (
    <motion.span
      key={value}
      initial={prevValue.current !== value ? { scale: 1.15, color: isIncreasing ? '#22c55e' : '#ef4444' } : false}
      animate={{ scale: 1, color: '#ffffff' }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {displayValue}
    </motion.span>
  );
}

// --- Main Component ---

export function WalletWidget({
  chips = 50000,
  diamonds = 120,
  transactions = DEFAULT_TRANSACTIONS,
  onOpenStore,
  className,
}: WalletWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedTransactions = transactions.slice(0, 5);

  return (
    <motion.div
      layout
      className={cn(
        'rounded-2xl border border-white/10 overflow-hidden',
        'bg-gradient-to-b from-gray-800/80 to-gray-900/90 backdrop-blur-xl',
        className,
      )}
    >
      {/* Compact view */}
      <div className="flex items-center gap-2 p-3">
        {/* Chips display */}
        <motion.div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/15"
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-gradient-to-b from-yellow-400 to-amber-600 shadow-sm shadow-yellow-500/30"
            animate={{ boxShadow: ['0 0 0 0 rgba(234, 179, 8, 0.2)', '0 0 0 4px rgba(234, 179, 8, 0)', '0 0 0 0 rgba(234, 179, 8, 0.2)'] }}
            transition={{ repeat: Infinity, duration: 3 }}
          />
          <AnimatedCounter value={chips} className="text-sm font-bold text-white" />
        </motion.div>

        {/* Diamonds display */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/15">
          <Diamond size={12} className="text-cyan-400" />
          <AnimatedCounter value={diamonds} className="text-sm font-bold text-white" />
        </div>

        {/* Add button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onOpenStore}
          className="ml-auto w-8 h-8 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20"
        >
          <Plus size={16} className="text-black" />
        </motion.button>

        {/* Expand toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center"
        >
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-gray-400" />
          </motion.div>
        </motion.button>
      </div>

      {/* Expanded transaction history */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Recent Activity
                </span>
              </div>

              <div className="space-y-1.5">
                {displayedTransactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      {getTransactionIcon(tx.type)}
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{tx.description}</p>
                      <span className="text-[10px] text-gray-600">{timeAgo(tx.timestamp)}</span>
                    </div>

                    {/* Amount */}
                    <span className={cn('text-xs font-bold', getTransactionColor(tx.type))}>
                      {getTransactionSign(tx.type)}{formatChips(tx.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>

              {displayedTransactions.length === 0 && (
                <div className="py-4 text-center text-xs text-gray-600">
                  No recent transactions
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
