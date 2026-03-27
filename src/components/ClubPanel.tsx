import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Shield, Crown, Users, Trophy, Plus,
  ChevronRight, Star, Lock, MessageCircle, ArrowLeft
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export type MemberRole = 'owner' | 'admin' | 'member';

export interface ClubMember {
  id: string;
  username: string;
  avatarUrl?: string | null;
  chips: number;
  level: number;
  role: MemberRole;
  isOnline: boolean;
  totalWinnings: number;
  gamesPlayed: number;
  joinedAt: Date;
}

export interface Club {
  id: string;
  name: string;
  avatarUrl?: string | null;
  description: string;
  memberCount: number;
  maxMembers: number;
  totalWinnings: number;
  minLevel: number;
  isOpen: boolean;
  createdAt: Date;
  members: ClubMember[];
  chatMessages: ClubChatMessage[];
}

export interface ClubChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  sentAt: Date;
}

export interface ClubPanelProps {
  currentClub?: Club | null;
  availableClubs?: Club[];
  userLevel?: number;
  onJoinClub?: (clubId: string) => void;
  onLeaveClub?: (clubId: string) => void;
  onCreateClub?: (data: { name: string; description: string; minLevel: number; isOpen: boolean }) => void;
  onSendClubChat?: (message: string) => void;
  onClose?: () => void;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MEMBERS: ClubMember[] = [
  { id: 'm1', username: 'RahulKapoor', avatarUrl: null, chips: 525000, level: 45, role: 'owner', isOnline: true, totalWinnings: 2400000, gamesPlayed: 312, joinedAt: new Date('2024-01-15') },
  { id: 'm2', username: 'PriyaSharma', avatarUrl: null, chips: 188000, level: 38, role: 'admin', isOnline: true, totalWinnings: 1800000, gamesPlayed: 245, joinedAt: new Date('2024-02-10') },
  { id: 'm3', username: 'AmitSingh', avatarUrl: null, chips: 320000, level: 42, role: 'member', isOnline: false, totalWinnings: 1200000, gamesPlayed: 198, joinedAt: new Date('2024-03-05') },
  { id: 'm4', username: 'NehaGupta', avatarUrl: null, chips: 215000, level: 35, role: 'member', isOnline: true, totalWinnings: 980000, gamesPlayed: 167, joinedAt: new Date('2024-04-20') },
  { id: 'm5', username: 'VikramJoshi', avatarUrl: null, chips: 442000, level: 50, role: 'admin', isOnline: false, totalWinnings: 3100000, gamesPlayed: 400, joinedAt: new Date('2024-01-20') },
];

const MOCK_CHAT: ClubChatMessage[] = [
  { id: 'c1', userId: 'm1', username: 'RahulKapoor', message: 'GG everyone! Great session tonight', sentAt: new Date(Date.now() - 300000) },
  { id: 'c2', userId: 'm2', username: 'PriyaSharma', message: 'That trail was insane!', sentAt: new Date(Date.now() - 240000) },
  { id: 'c3', userId: 'm4', username: 'NehaGupta', message: 'Anyone up for a round?', sentAt: new Date(Date.now() - 60000) },
];

const MOCK_CURRENT_CLUB: Club = {
  id: 'club1',
  name: 'Royal Flush Kings',
  avatarUrl: null,
  description: 'Top-tier Teen Patti club for serious players. Daily tournaments and big pots!',
  memberCount: 28,
  maxMembers: 50,
  totalWinnings: 12500000,
  minLevel: 10,
  isOpen: false,
  createdAt: new Date('2024-01-01'),
  members: MOCK_MEMBERS,
  chatMessages: MOCK_CHAT,
};

const MOCK_AVAILABLE_CLUBS: Club[] = [
  { id: 'club2', name: 'High Rollers', avatarUrl: null, description: 'Big stakes, big wins', memberCount: 42, maxMembers: 50, totalWinnings: 28000000, minLevel: 20, isOpen: true, createdAt: new Date('2023-12-01'), members: [], chatMessages: [] },
  { id: 'club3', name: 'Beginner Luck', avatarUrl: null, description: 'Friendly club for new players', memberCount: 15, maxMembers: 30, totalWinnings: 3200000, minLevel: 1, isOpen: true, createdAt: new Date('2024-06-01'), members: [], chatMessages: [] },
  { id: 'club4', name: 'Desi Aces', avatarUrl: null, description: 'Desi vibes, killer hands', memberCount: 35, maxMembers: 40, totalWinnings: 18500000, minLevel: 15, isOpen: false, createdAt: new Date('2024-03-15'), members: [], chatMessages: [] },
  { id: 'club5', name: 'Midnight Bluffers', avatarUrl: null, description: 'Night owls and bluff masters', memberCount: 22, maxMembers: 50, totalWinnings: 9800000, minLevel: 5, isOpen: true, createdAt: new Date('2024-05-10'), members: [], chatMessages: [] },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRoleBadge(role: MemberRole) {
  switch (role) {
    case 'owner':
      return { icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Owner' };
    case 'admin':
      return { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Admin' };
    default:
      return null;
  }
}

function getClubGradient(name: string): string {
  const gradients = [
    'from-yellow-600 to-amber-800',
    'from-red-600 to-red-900',
    'from-purple-600 to-purple-900',
    'from-emerald-600 to-emerald-900',
    'from-blue-600 to-blue-900',
  ];
  const index = name.charCodeAt(0) % gradients.length;
  return gradients[index];
}

// ── Component ────────────────────────────────────────────────────────────────

type Tab = 'leaderboard' | 'members' | 'chat';
type View = 'myClub' | 'browse' | 'create';

export function ClubPanel({
  currentClub = MOCK_CURRENT_CLUB,
  availableClubs = MOCK_AVAILABLE_CLUBS,
  userLevel = 25,
  onJoinClub,
  onLeaveClub,
  onCreateClub,
  onSendClubChat,
  onClose,
}: ClubPanelProps) {
  const [view, setView] = useState<View>(currentClub ? 'myClub' : 'browse');
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');

  // Create club form
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createMinLevel, setCreateMinLevel] = useState(1);
  const [createIsOpen, setCreateIsOpen] = useState(true);

  const filteredClubs = availableClubs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedMembers = currentClub
    ? [...currentClub.members].sort((a, b) => b.totalWinnings - a.totalWinnings)
    : [];

  const handleCreateClub = () => {
    if (createName.trim()) {
      onCreateClub?.({
        name: createName.trim(),
        description: createDesc.trim(),
        minLevel: createMinLevel,
        isOpen: createIsOpen,
      });
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim()) {
      onSendClubChat?.(chatInput.trim());
      setChatInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {view !== 'myClub' && currentClub && (
              <button
                onClick={() => setView('myClub')}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-white/60" />
              </button>
            )}
            <Shield className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">
              {view === 'myClub' ? 'My Club' : view === 'browse' ? 'Browse Clubs' : 'Create Club'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {view === 'myClub' && (
              <button
                onClick={() => setView('browse')}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 transition-colors"
              >
                Browse
              </button>
            )}
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
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          {/* ── My Club View ───────────────────────────────────────────── */}
          {view === 'myClub' && currentClub && (
            <motion.div
              key="myClub"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Club card */}
              <div className={cn(
                'relative rounded-2xl p-4 overflow-hidden bg-gradient-to-br border border-white/10',
                getClubGradient(currentClub.name)
              )}>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold text-white border border-white/20">
                      {currentClub.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg truncate">{currentClub.name}</h3>
                      <p className="text-white/70 text-xs line-clamp-2">{currentClub.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                      <Users className="w-4 h-4 text-white/80 mx-auto mb-1" />
                      <p className="text-white font-bold text-sm">{currentClub.memberCount}/{currentClub.maxMembers}</p>
                      <p className="text-white/50 text-[10px]">Members</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                      <Trophy className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                      <p className="text-white font-bold text-sm">{formatChips(currentClub.totalWinnings)}</p>
                      <p className="text-white/50 text-[10px]">Winnings</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                      <Star className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                      <p className="text-white font-bold text-sm">Lvl {currentClub.minLevel}+</p>
                      <p className="text-white/50 text-[10px]">Required</p>
                    </div>
                  </div>

                  {/* Leave club */}
                  <button
                    onClick={() => onLeaveClub?.(currentClub.id)}
                    className="mt-3 w-full py-2 rounded-xl bg-white/10 text-white/50 text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-all"
                  >
                    Leave Club
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                {([
                  { id: 'leaderboard' as Tab, label: 'Leaderboard' },
                  { id: 'members' as Tab, label: 'Members' },
                  { id: 'chat' as Tab, label: 'Chat' },
                ]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                      tab === t.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white/70'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === 'leaderboard' && (
                <div className="space-y-2">
                  {sortedMembers.map((member, index) => {
                    const roleBadge = getRoleBadge(member.role);
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5"
                      >
                        {/* Rank */}
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 ? 'bg-yellow-500 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-600 text-white' :
                          'bg-white/10 text-white/60'
                        )}>
                          {index + 1}
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-sm font-bold text-white">
                            {member.username[0]}
                          </div>
                          {member.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white font-medium text-sm truncate">{member.username}</p>
                            {roleBadge && (
                              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-medium', roleBadge.bg, roleBadge.color)}>
                                {roleBadge.label}
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs">{member.gamesPlayed} games</p>
                        </div>

                        {/* Winnings */}
                        <div className="text-right">
                          <p className="text-yellow-400 font-bold text-sm">{formatChips(member.totalWinnings)}</p>
                          <p className="text-white/40 text-[10px]">winnings</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {tab === 'members' && (
                <div className="space-y-2">
                  {currentClub.members.map((member, index) => {
                    const roleBadge = getRoleBadge(member.role);
                    return (
                      <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5"
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-sm font-bold text-white">
                            {member.username[0]}
                          </div>
                          {member.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white font-medium text-sm truncate">{member.username}</p>
                            {roleBadge && (
                              <roleBadge.icon className={cn('w-3.5 h-3.5', roleBadge.color)} />
                            )}
                          </div>
                          <p className="text-white/40 text-xs">
                            Lvl {member.level} · {formatChips(member.chips)} chips
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20" />
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {tab === 'chat' && (
                <div className="flex flex-col">
                  <div className="space-y-3 mb-4">
                    {currentClub.chatMessages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">
                          {msg.username[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-white text-xs font-medium">{msg.username}</span>
                            <span className="text-white/30 text-[10px]">
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm">{msg.message}</p>
                        </div>
                      </div>
                    ))}

                    {currentClub.chatMessages.length === 0 && (
                      <div className="flex flex-col items-center py-8 text-white/40">
                        <MessageCircle className="w-6 h-6 mb-2 opacity-50" />
                        <p className="text-xs">No messages yet</p>
                      </div>
                    )}
                  </div>

                  {/* Chat input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSendChat}
                      disabled={!chatInput.trim()}
                      className={cn(
                        'p-2.5 rounded-xl transition-colors',
                        chatInput.trim()
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                          : 'bg-white/10 text-white/30'
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Browse Clubs View ──────────────────────────────────────── */}
          {view === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clubs..."
                  className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
              </div>

              {/* Create button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('create')}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-white/20 flex items-center gap-3 hover:border-yellow-500/40 hover:bg-white/5 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Create Your Club</p>
                  <p className="text-white/50 text-xs">Build your own Teen Patti community</p>
                </div>
              </motion.button>

              {/* Club list */}
              <div className="space-y-3">
                {filteredClubs.map((club, index) => {
                  const canJoin = userLevel >= club.minLevel;
                  return (
                    <motion.div
                      key={club.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={cn(
                            'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl font-bold text-white',
                            getClubGradient(club.name)
                          )}>
                            {club.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-white font-bold text-sm truncate">{club.name}</h4>
                              {!club.isOpen && <Lock className="w-3 h-3 text-white/40" />}
                            </div>
                            <p className="text-white/50 text-xs line-clamp-1">{club.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-white/50">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {club.memberCount}/{club.maxMembers}
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-yellow-400" />
                              {formatChips(club.totalWinnings)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Lvl {club.minLevel}+
                            </span>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => canJoin && onJoinClub?.(club.id)}
                            disabled={!canJoin}
                            className={cn(
                              'px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                              canJoin
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                                : 'bg-white/10 text-white/30'
                            )}
                          >
                            {canJoin ? 'Join' : `Lvl ${club.minLevel} req.`}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredClubs.length === 0 && (
                <div className="flex flex-col items-center py-12 text-white/40">
                  <Search className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No clubs found</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Create Club View ───────────────────────────────────────── */}
          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <button
                onClick={() => setView('browse')}
                className="flex items-center gap-1 text-white/50 text-sm hover:text-white/70 transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to browse
              </button>

              {/* Club name */}
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Club Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Royal Flush Kings"
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-white/50 block mb-1.5">Description</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What is your club about?"
                  rows={3}
                  className="w-full bg-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
                />
              </div>

              {/* Min level */}
              <div>
                <label className="text-xs text-white/50 block mb-2">Minimum Level to Join</label>
                <div className="flex gap-2">
                  {[1, 5, 10, 20, 30].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCreateMinLevel(lvl)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                        createMinLevel === lvl
                          ? 'bg-yellow-500 text-yellow-900'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      )}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Open / Closed */}
              <div>
                <label className="text-xs text-white/50 block mb-2">Join Policy</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCreateIsOpen(true)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
                      createIsOpen
                        ? 'bg-green-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Open
                  </button>
                  <button
                    onClick={() => setCreateIsOpen(false)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all',
                      !createIsOpen
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/15'
                    )}
                  >
                    <Lock className="w-4 h-4" />
                    Invite Only
                  </button>
                </div>
              </div>

              {/* Create button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateClub}
                disabled={!createName.trim()}
                className={cn(
                  'w-full py-3.5 rounded-xl font-bold text-sm transition-all',
                  createName.trim()
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'bg-white/10 text-white/30'
                )}
              >
                Create Club
              </motion.button>
            </motion.div>
          )}

          {/* No club state */}
          {view === 'myClub' && !currentClub && (
            <motion.div
              key="noClub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-white/40"
            >
              <Shield className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-white font-medium mb-1">No Club Yet</p>
              <p className="text-xs mb-4">Join or create a club to play with a team</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('browse')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  Browse Clubs
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setView('create')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold"
                >
                  Create Club
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
