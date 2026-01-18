import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, UserPlus, MessageCircle, Gamepad2,
  MoreVertical, Clock, Check, X, Send, Copy
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { NavigationBar } from '../components/NavigationBar';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

interface FriendsScreenProps {
  onNavigate: (screen: string) => void;
  onInviteToGame?: (friendId: string) => void;
}

type Tab = 'friends' | 'requests' | 'find';

// Mock friends data
const mockFriends = [
  { id: '1', username: 'RahulKapoor', avatarUrl: null, chips: 25000, isOnline: true, lastSeen: new Date(), inGame: true },
  { id: '2', username: 'PriyaSharma', avatarUrl: null, chips: 18000, isOnline: true, lastSeen: new Date(), inGame: false },
  { id: '3', username: 'AmitSingh', avatarUrl: null, chips: 32000, isOnline: false, lastSeen: new Date(Date.now() - 3600000), inGame: false },
  { id: '4', username: 'NehaGupta', avatarUrl: null, chips: 15000, isOnline: true, lastSeen: new Date(), inGame: false },
  { id: '5', username: 'VikramJoshi', avatarUrl: null, chips: 42000, isOnline: false, lastSeen: new Date(Date.now() - 7200000), inGame: false },
];

const mockRequests = [
  { id: '6', username: 'AnanyaSingh', avatarUrl: null, chips: 20000, mutualFriends: 3 },
  { id: '7', username: 'RohitVerma', avatarUrl: null, chips: 28000, mutualFriends: 5 },
];

const mockSuggestions = [
  { id: '8', username: 'MeghaNair', avatarUrl: null, chips: 35000, mutualFriends: 8 },
  { id: '9', username: 'ArjunMehta', avatarUrl: null, chips: 22000, mutualFriends: 4 },
  { id: '10', username: 'KavitaRao', avatarUrl: null, chips: 19000, mutualFriends: 6 },
];

export function FriendsScreen({ onNavigate, onInviteToGame }: FriendsScreenProps) {
  const [selectedTab, setSelectedTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  const inviteCode = 'TEEN-PATTI-2024';

  const filteredFriends = mockFriends.filter((friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter((f) => f.isOnline);
  const offlineFriends = filteredFriends.filter((f) => !f.isOnline);

  const formatLastSeen = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 px-4 pt-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">Friends</h1>
              <span className="px-2 py-0.5 bg-green-500/20 rounded-full text-xs text-green-400">
                {onlineFriends.length} online
              </span>
            </div>
            <button
              onClick={() => setShowInviteCode(true)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              <UserPlus className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4">
            {[
              { id: 'friends' as Tab, label: 'Friends', count: mockFriends.length },
              { id: 'requests' as Tab, label: 'Requests', count: mockRequests.length },
              { id: 'find' as Tab, label: 'Find', count: 0 }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1',
                  selectedTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/60'
                )}
              >
                {tab.label}
                {tab.count > 0 && selectedTab !== tab.id && (
                  <span className="px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />
          </div>
        </motion.header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <AnimatePresence mode="wait">
            {selectedTab === 'friends' && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Online friends */}
                {onlineFriends.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                      Online - {onlineFriends.length}
                    </h3>
                    {onlineFriends.map((friend, index) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-lg font-bold text-white">
                            {friend.username[0]}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-900" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <p className="text-white font-medium">{friend.username}</p>
                          <p className="text-white/50 text-xs">
                            {friend.inGame ? (
                              <span className="text-green-400">Playing now</span>
                            ) : (
                              `₹${formatChips(friend.chips)}`
                            )}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {friend.inGame ? (
                            <button className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
                              Watch
                            </button>
                          ) : (
                            <button
                              onClick={() => onInviteToGame?.(friend.id)}
                              className="px-3 py-1.5 rounded-lg bg-yellow-500 text-yellow-900 text-xs font-medium flex items-center gap-1"
                            >
                              <Gamepad2 className="w-3 h-3" />
                              Invite
                            </button>
                          )}
                          <button className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Offline friends */}
                {offlineFriends.length > 0 && (
                  <div>
                    <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                      Offline - {offlineFriends.length}
                    </h3>
                    {offlineFriends.map((friend, index) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (onlineFriends.length + index) * 0.05 }}
                        className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/5 opacity-60"
                      >
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-lg font-bold text-white">
                            {friend.username[0]}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <p className="text-white font-medium">{friend.username}</p>
                          <p className="text-white/50 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastSeen(friend.lastSeen)}
                          </p>
                        </div>

                        {/* Actions */}
                        <button className="p-2 rounded-lg bg-white/10 text-white/40">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {selectedTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                  Friend Requests - {mockRequests.length}
                </h3>
                {mockRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/5"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-lg font-bold text-white">
                      {request.username[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-white font-medium">{request.username}</p>
                      <p className="text-white/50 text-xs">
                        {request.mutualFriends} mutual friends
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-green-500 text-white">
                        <Check className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg bg-red-500/20 text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedTab === 'find' && (
              <motion.div
                key="find"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h3 className="text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
                  Suggested Friends
                </h3>
                {mockSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white/5"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-lg font-bold text-white">
                      {suggestion.username[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-white font-medium">{suggestion.username}</p>
                      <p className="text-white/50 text-xs">
                        {suggestion.mutualFriends} mutual friends • ₹{formatChips(suggestion.chips)}
                      </p>
                    </div>

                    {/* Actions */}
                    <button className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium flex items-center gap-1">
                      <UserPlus className="w-3 h-3" />
                      Add
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Invite modal */}
        <AnimatePresence>
          {showInviteCode && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowInviteCode(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed bottom-0 left-0 right-0 p-4 z-50"
              >
                <div className="bg-gradient-to-b from-gray-900 to-black rounded-3xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-2 text-center">Invite Friends</h2>
                  <p className="text-white/60 text-sm text-center mb-4">
                    Share this code with your friends to play together
                  </p>

                  <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl mb-4">
                    <span className="flex-1 font-mono text-yellow-400 text-lg text-center">{inviteCode}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(inviteCode)}
                      className="p-2 rounded-lg bg-yellow-500 text-yellow-900"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowInviteCode(false)}
                    className="w-full py-3 rounded-xl bg-white/10 text-white font-medium"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <NavigationBar currentScreen="social" onNavigate={onNavigate} />
      </div>
    </Layout>
  );
}
