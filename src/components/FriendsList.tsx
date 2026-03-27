import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, X, Gift, Gamepad2, Eye,
  Clock, ChevronDown, ChevronUp, MessageCircle, Check
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  username: string;
  avatarUrl?: string | null;
  chips: number;
  level: number;
  isOnline: boolean;
  lastSeen: Date;
  inGame: boolean;
}

export interface FriendRequest {
  id: string;
  username: string;
  avatarUrl?: string | null;
  chips: number;
  level: number;
  mutualFriends: number;
  direction: 'sent' | 'received';
  sentAt: Date;
}

export interface FriendsListProps {
  friends?: Friend[];
  requests?: FriendRequest[];
  onInviteToTable?: (friendId: string) => void;
  onSendGift?: (friendId: string) => void;
  onViewProfile?: (friendId: string) => void;
  onAcceptRequest?: (requestId: string) => void;
  onDeclineRequest?: (requestId: string) => void;
  onCancelRequest?: (requestId: string) => void;
  onAddFriend?: (username: string) => void;
  onClose?: () => void;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_FRIENDS: Friend[] = [
  { id: '1', username: 'RahulKapoor', avatarUrl: null, chips: 125000, level: 32, isOnline: true, lastSeen: new Date(), inGame: true },
  { id: '2', username: 'PriyaSharma', avatarUrl: null, chips: 88000, level: 28, isOnline: true, lastSeen: new Date(), inGame: false },
  { id: '3', username: 'NehaGupta', avatarUrl: null, chips: 215000, level: 45, isOnline: true, lastSeen: new Date(), inGame: false },
  { id: '4', username: 'AmitSingh', avatarUrl: null, chips: 32000, level: 18, isOnline: false, lastSeen: new Date(Date.now() - 1800000), inGame: false },
  { id: '5', username: 'VikramJoshi', avatarUrl: null, chips: 542000, level: 55, isOnline: false, lastSeen: new Date(Date.now() - 7200000), inGame: false },
  { id: '6', username: 'KavitaRao', avatarUrl: null, chips: 19000, level: 12, isOnline: false, lastSeen: new Date(Date.now() - 86400000), inGame: false },
  { id: '7', username: 'ArjunMehta', avatarUrl: null, chips: 76000, level: 24, isOnline: false, lastSeen: new Date(Date.now() - 172800000), inGame: false },
];

const MOCK_REQUESTS: FriendRequest[] = [
  { id: 'r1', username: 'AnanyaSingh', avatarUrl: null, chips: 20000, level: 15, mutualFriends: 3, direction: 'received', sentAt: new Date(Date.now() - 3600000) },
  { id: 'r2', username: 'RohitVerma', avatarUrl: null, chips: 48000, level: 22, mutualFriends: 5, direction: 'received', sentAt: new Date(Date.now() - 7200000) },
  { id: 'r3', username: 'MeghaNair', avatarUrl: null, chips: 35000, level: 19, mutualFriends: 2, direction: 'sent', sentAt: new Date(Date.now() - 86400000) },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatLastActive(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getAvatarGradient(name: string): string {
  const gradients = [
    'from-red-600 to-red-900',
    'from-blue-600 to-blue-900',
    'from-purple-600 to-purple-900',
    'from-emerald-600 to-emerald-900',
    'from-orange-600 to-orange-900',
    'from-pink-600 to-pink-900',
    'from-cyan-600 to-cyan-900',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

// ── Component ────────────────────────────────────────────────────────────────

export function FriendsList({
  friends = MOCK_FRIENDS,
  requests = MOCK_REQUESTS,
  onInviteToTable,
  onSendGift,
  onViewProfile,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onAddFriend,
  onClose,
}: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [requestsExpanded, setRequestsExpanded] = useState(true);
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);

  // Sort: online first (in-game at top), then alphabetical
  const sortedAndFiltered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = friends.filter((f) =>
      f.username.toLowerCase().includes(q)
    );
    return filtered.sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      if (a.isOnline && b.isOnline) {
        if (a.inGame && !b.inGame) return -1;
        if (!a.inGame && b.inGame) return 1;
      }
      return a.username.localeCompare(b.username);
    });
  }, [friends, searchQuery]);

  const onlineFriends = sortedAndFiltered.filter((f) => f.isOnline);
  const offlineFriends = sortedAndFiltered.filter((f) => !f.isOnline);
  const receivedRequests = requests.filter((r) => r.direction === 'received');
  const sentRequests = requests.filter((r) => r.direction === 'sent');

  const handleAddFriend = () => {
    if (addUsername.trim()) {
      onAddFriend?.(addUsername.trim());
      setAddUsername('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">
            Friends{' '}
            <span className="text-sm font-normal text-green-400">
              ({onlineFriends.length} online)
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAddModal(true)}
              className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-orange-500/20"
            >
              <UserPlus className="w-4 h-4 text-white" />
            </motion.button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-white/40 hover:text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {/* Friend Requests Section */}
        {(receivedRequests.length > 0 || sentRequests.length > 0) && (
          <div>
            <button
              onClick={() => setRequestsExpanded(!requestsExpanded)}
              className="flex items-center justify-between w-full mb-2"
            >
              <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                Requests
                {receivedRequests.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] text-white">
                    {receivedRequests.length}
                  </span>
                )}
              </h3>
              {requestsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/40" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              )}
            </button>

            <AnimatePresence>
              {requestsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {/* Received */}
                  {receivedRequests.map((req, index) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-yellow-500/20"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white',
                        getAvatarGradient(req.username)
                      )}>
                        {req.username[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{req.username}</p>
                        <p className="text-white/40 text-xs">
                          {req.mutualFriends} mutual · Lvl {req.level}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onAcceptRequest?.(req.id)}
                          className="p-1.5 rounded-lg bg-green-500 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onDeclineRequest?.(req.id)}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Sent */}
                  {sentRequests.map((req, index) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (receivedRequests.length + index) * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 opacity-70"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white',
                        getAvatarGradient(req.username)
                      )}>
                        {req.username[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{req.username}</p>
                        <p className="text-white/40 text-xs">Pending · Sent {formatLastActive(req.sentAt)}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onCancelRequest?.(req.id)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 text-white/50 text-xs"
                      >
                        Cancel
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Online Friends */}
        {onlineFriends.length > 0 && (
          <div>
            <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
              Online - {onlineFriends.length}
            </h3>
            <div className="space-y-2">
              {onlineFriends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  layout
                >
                  <div
                    onClick={() =>
                      setExpandedFriendId(
                        expandedFriendId === friend.id ? null : friend.id
                      )
                    }
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className={cn(
                        'w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-base font-bold text-white',
                        getAvatarGradient(friend.username)
                      )}>
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={friend.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          friend.username[0]
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-medium text-sm truncate">{friend.username}</p>
                        <span className="text-white/30 text-[10px]">Lvl {friend.level}</span>
                      </div>
                      <p className="text-xs">
                        {friend.inGame ? (
                          <span className="text-green-400 flex items-center gap-1">
                            <Gamepad2 className="w-3 h-3" />
                            In a game
                          </span>
                        ) : (
                          <span className="text-white/40">{formatChips(friend.chips)} chips</span>
                        )}
                      </p>
                    </div>

                    {/* Quick action */}
                    {friend.inGame ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewProfile?.(friend.id); }}
                        className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Watch
                      </button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onInviteToTable?.(friend.id); }}
                        className="px-3 py-1.5 rounded-lg bg-yellow-500 text-yellow-900 text-xs font-bold flex items-center gap-1"
                      >
                        <Gamepad2 className="w-3 h-3" />
                        Invite
                      </motion.button>
                    )}
                  </div>

                  {/* Expanded quick actions */}
                  <AnimatePresence>
                    {expandedFriendId === friend.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                          <button
                            onClick={() => onInviteToTable?.(friend.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-yellow-500/10 text-yellow-400 text-xs font-medium hover:bg-yellow-500/20 transition-colors"
                          >
                            <Gamepad2 className="w-3.5 h-3.5" />
                            Invite
                          </button>
                          <button
                            onClick={() => onSendGift?.(friend.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition-colors"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Gift
                          </button>
                          <button
                            onClick={() => onViewProfile?.(friend.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Profile
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 text-white/50 text-xs font-medium hover:bg-white/10 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Chat
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Offline Friends */}
        {offlineFriends.length > 0 && (
          <div>
            <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
              Offline - {offlineFriends.length}
            </h3>
            <div className="space-y-2">
              {offlineFriends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (onlineFriends.length + index) * 0.04 }}
                  layout
                >
                  <div
                    onClick={() =>
                      setExpandedFriendId(
                        expandedFriendId === friend.id ? null : friend.id
                      )
                    }
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 opacity-60 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-base font-bold text-white">
                        {friend.username[0]}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gray-500 border-2 border-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white font-medium text-sm truncate">{friend.username}</p>
                        <span className="text-white/30 text-[10px]">Lvl {friend.level}</span>
                      </div>
                      <p className="text-white/40 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastActive(friend.lastSeen)}
                      </p>
                    </div>
                  </div>

                  {/* Expanded quick actions (offline) */}
                  <AnimatePresence>
                    {expandedFriendId === friend.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                          <button
                            onClick={() => onSendGift?.(friend.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-pink-500/10 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition-colors"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Gift
                          </button>
                          <button
                            onClick={() => onViewProfile?.(friend.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Profile
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {sortedAndFiltered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-white/40">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No friends found</p>
            <p className="text-xs mt-1">Try a different search</p>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50"
            >
              <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Add Friend</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                    placeholder="Enter username..."
                    autoFocus
                    className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddFriend}
                    disabled={!addUsername.trim()}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all',
                      addUsername.trim()
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-white/10 text-white/30'
                    )}
                  >
                    <UserPlus className="w-4 h-4" />
                    Send Request
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
