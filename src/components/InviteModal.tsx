import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Copy, Check, Share2, Gamepad2, ExternalLink,
  QrCode, Clock, Search, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '../utils/cn';

// ── Types ────────────────────────────────────────────────────────────────────

export type InviteStatus = 'idle' | 'pending' | 'accepted' | 'declined';

export interface OnlineFriend {
  id: string;
  username: string;
  avatarUrl?: string | null;
  level: number;
  isOnline: boolean;
  inviteStatus: InviteStatus;
}

export interface InviteModalProps {
  isOpen: boolean;
  roomCode?: string;
  roomName?: string;
  friends?: OnlineFriend[];
  onInvite?: (friendId: string) => void;
  onCopyCode?: (code: string) => void;
  onShareWhatsApp?: (code: string) => void;
  onShareTelegram?: (code: string) => void;
  onClose: () => void;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FRIENDS: OnlineFriend[] = [
  { id: '1', username: 'RahulKapoor', avatarUrl: null, level: 32, isOnline: true, inviteStatus: 'idle' },
  { id: '2', username: 'PriyaSharma', avatarUrl: null, level: 28, isOnline: true, inviteStatus: 'idle' },
  { id: '3', username: 'NehaGupta', avatarUrl: null, level: 45, isOnline: true, inviteStatus: 'pending' },
  { id: '4', username: 'VikramJoshi', avatarUrl: null, level: 55, isOnline: true, inviteStatus: 'accepted' },
  { id: '5', username: 'AmitSingh', avatarUrl: null, level: 18, isOnline: false, inviteStatus: 'idle' },
  { id: '6', username: 'KavitaRao', avatarUrl: null, level: 12, isOnline: true, inviteStatus: 'declined' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusDisplay(status: InviteStatus) {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock };
    case 'accepted':
      return { label: 'Accepted', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 };
    case 'declined':
      return { label: 'Declined', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle };
    default:
      return null;
  }
}

function getAvatarGradient(name: string): string {
  const gradients = [
    'from-red-600 to-red-900',
    'from-blue-600 to-blue-900',
    'from-purple-600 to-purple-900',
    'from-emerald-600 to-emerald-900',
    'from-orange-600 to-orange-900',
  ];
  return gradients[name.charCodeAt(0) % gradients.length];
}

// ── QR Code Component (simple visual placeholder) ────────────────────────────

function QRCodeDisplay({ code }: { code: string }) {
  // Generate a deterministic pattern from the code
  const cells: boolean[][] = [];
  for (let r = 0; r < 9; r++) {
    cells[r] = [];
    for (let c = 0; c < 9; c++) {
      // Corner markers
      const isCorner =
        (r < 3 && c < 3) || (r < 3 && c > 5) || (r > 5 && c < 3);
      if (isCorner) {
        const isOuter = r === 0 || r === 2 || c === 0 || c === 2 || (r > 5 && (r === 6 || r === 8)) || (c > 5 && (c === 6 || c === 8));
        const isCenter = (r === 1 && c === 1) || (r === 1 && c === 7) || (r === 7 && c === 1);
        cells[r][c] = isOuter || isCenter;
      } else {
        // Pseudo-random from code
        const charIndex = (r * 9 + c) % code.length;
        cells[r][c] = code.charCodeAt(charIndex) % 3 !== 0;
      }
    }
  }

  return (
    <div className="bg-white rounded-xl p-3 inline-block">
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
        {cells.flat().map((filled, i) => (
          <div
            key={i}
            className={cn('w-3 h-3 rounded-[1px]', filled ? 'bg-gray-900' : 'bg-white')}
          />
        ))}
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function InviteModal({
  isOpen,
  roomCode = 'TEEN-7X4K-2024',
  roomName = 'Classic Table',
  friends = MOCK_FRIENDS,
  onInvite,
  onCopyCode,
  onShareWhatsApp,
  onShareTelegram,
  onClose,
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = useCallback(() => {
    onCopyCode?.(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode, onCopyCode]);

  const handleWhatsApp = useCallback(() => {
    onShareWhatsApp?.(roomCode);
  }, [roomCode, onShareWhatsApp]);

  const handleTelegram = useCallback(() => {
    onShareTelegram?.(roomCode);
  }, [roomCode, onShareTelegram]);

  const onlineFriends = friends
    .filter((f) => f.isOnline && f.username.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      // Sort: idle first, then pending, accepted, declined
      const order: Record<InviteStatus, number> = { idle: 0, pending: 1, accepted: 2, declined: 3 };
      return order[a.inviteStatus] - order[b.inviteStatus];
    });

  const offlineFriends = friends.filter(
    (f) => !f.isOnline && f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/10 overflow-hidden flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Invite Friends</h2>
                    <p className="text-white/40 text-xs">{roomName}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Room code section */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-white/50 text-xs mb-2 text-center">Room Code</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-black/40 rounded-xl p-3 text-center">
                      <span className="font-mono text-yellow-400 text-xl font-bold tracking-wider">
                        {roomCode}
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleCopy}
                      className={cn(
                        'p-3 rounded-xl transition-all',
                        copied
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-yellow-900'
                      )}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </motion.button>
                  </div>

                  {/* Share buttons */}
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWhatsApp}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      WhatsApp
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleTelegram}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Telegram
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowQR(!showQR)}
                      className={cn(
                        'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                        showQR ? 'bg-white text-gray-900' : 'bg-white/10 text-white/70'
                      )}
                    >
                      <QrCode className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* QR code */}
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center pt-4">
                          <QRCodeDisplay code={roomCode} />
                          <p className="text-white/40 text-[10px] mt-2">Scan to join the table</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Search friends */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>

                {/* Online friends */}
                {onlineFriends.length > 0 && (
                  <div>
                    <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                      Online - {onlineFriends.length}
                    </h3>
                    <div className="space-y-2">
                      {onlineFriends.map((friend, index) => {
                        const statusDisplay = getStatusDisplay(friend.inviteStatus);
                        return (
                          <motion.div
                            key={friend.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5"
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className={cn(
                                'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white',
                                getAvatarGradient(friend.username)
                              )}>
                                {friend.username[0]}
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{friend.username}</p>
                              <p className="text-white/40 text-xs">Level {friend.level}</p>
                            </div>

                            {/* Action / Status */}
                            {statusDisplay ? (
                              <div className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium',
                                statusDisplay.bg, statusDisplay.color
                              )}>
                                <statusDisplay.icon className="w-3 h-3" />
                                {statusDisplay.label}
                              </div>
                            ) : (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onInvite?.(friend.id)}
                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-orange-500/20"
                              >
                                <Gamepad2 className="w-3 h-3" />
                                Invite
                              </motion.button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Offline friends */}
                {offlineFriends.length > 0 && (
                  <div>
                    <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                      Offline
                    </h3>
                    <div className="space-y-2">
                      {offlineFriends.map((friend, index) => (
                        <motion.div
                          key={friend.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (onlineFriends.length + index) * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 opacity-50"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            {friend.username[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">{friend.username}</p>
                            <p className="text-white/40 text-xs">Offline</p>
                          </div>
                          <span className="text-white/30 text-xs">Unavailable</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {onlineFriends.length === 0 && offlineFriends.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-white/40">
                    <Search className="w-6 h-6 mb-2 opacity-50" />
                    <p className="text-xs">No friends found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
