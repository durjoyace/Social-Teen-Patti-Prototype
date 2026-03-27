import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bell, UserPlus, Gamepad2, Gift, Trophy, Coins,
  CheckCheck, ChevronRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatChips } from '../game/gameEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'friend_request'
  | 'game_invite'
  | 'daily_reward'
  | 'achievement'
  | 'gift_received';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  data?: {
    fromUsername?: string;
    fromAvatarUrl?: string | null;
    roomCode?: string;
    rewardAmount?: number;
    achievementName?: string;
    giftEmoji?: string;
    deepLink?: string;
  };
}

export interface NotificationCenterProps {
  isOpen: boolean;
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onClose: () => void;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1', type: 'friend_request', title: 'Friend Request', message: 'AnanyaSingh wants to be your friend',
    isRead: false, createdAt: new Date(Date.now() - 120000),
    data: { fromUsername: 'AnanyaSingh', deepLink: '/friends' },
  },
  {
    id: 'n2', type: 'game_invite', title: 'Game Invite', message: 'RahulKapoor invited you to Classic Table',
    isRead: false, createdAt: new Date(Date.now() - 300000),
    data: { fromUsername: 'RahulKapoor', roomCode: 'TEEN-7X4K', deepLink: '/game/TEEN-7X4K' },
  },
  {
    id: 'n3', type: 'gift_received', title: 'Gift Received', message: 'PriyaSharma sent you a Crown!',
    isRead: false, createdAt: new Date(Date.now() - 900000),
    data: { fromUsername: 'PriyaSharma', giftEmoji: '👑' },
  },
  {
    id: 'n4', type: 'daily_reward', title: 'Daily Reward', message: 'Claim your Day 5 reward: 5,000 chips!',
    isRead: false, createdAt: new Date(Date.now() - 3600000),
    data: { rewardAmount: 5000, deepLink: '/rewards' },
  },
  {
    id: 'n5', type: 'achievement', title: 'Achievement Unlocked', message: 'You earned "Trail Master" - Get 10 trails!',
    isRead: true, createdAt: new Date(Date.now() - 7200000),
    data: { achievementName: 'Trail Master', deepLink: '/profile/achievements' },
  },
  {
    id: 'n6', type: 'game_invite', title: 'Game Invite', message: 'VikramJoshi invited you to High Stakes Joker',
    isRead: true, createdAt: new Date(Date.now() - 14400000),
    data: { fromUsername: 'VikramJoshi', roomCode: 'TEEN-9M2P', deepLink: '/game/TEEN-9M2P' },
  },
  {
    id: 'n7', type: 'friend_request', title: 'Friend Request', message: 'MeghaNair accepted your friend request',
    isRead: true, createdAt: new Date(Date.now() - 86400000),
    data: { fromUsername: 'MeghaNair', deepLink: '/friends' },
  },
  {
    id: 'n8', type: 'gift_received', title: 'Gift Received', message: 'AmitSingh sent you 1K Chips!',
    isRead: true, createdAt: new Date(Date.now() - 172800000),
    data: { fromUsername: 'AmitSingh', giftEmoji: '🪙' },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getNotificationConfig(type: NotificationType) {
  switch (type) {
    case 'friend_request':
      return {
        icon: UserPlus,
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        accentBorder: 'border-l-blue-500',
      };
    case 'game_invite':
      return {
        icon: Gamepad2,
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        accentBorder: 'border-l-green-500',
      };
    case 'daily_reward':
      return {
        icon: Coins,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        accentBorder: 'border-l-yellow-500',
      };
    case 'achievement':
      return {
        icon: Trophy,
        color: 'text-purple-400',
        bg: 'bg-purple-500/20',
        accentBorder: 'border-l-purple-500',
      };
    case 'gift_received':
      return {
        icon: Gift,
        color: 'text-pink-400',
        bg: 'bg-pink-500/20',
        accentBorder: 'border-l-pink-500',
      };
  }
}

// ── Badge Component ──────────────────────────────────────────────────────────

export function NotificationBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center px-1',
        className
      )}
    >
      <span className="text-[10px] text-white font-bold">
        {count > 99 ? '99+' : count}
      </span>
    </motion.div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function NotificationCenter({
  isOpen,
  notifications = MOCK_NOTIFICATIONS,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onClose,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    const list = filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;
    return [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [notifications, filter]);

  // Group by time
  const grouped = useMemo(() => {
    const today: Notification[] = [];
    const earlier: Notification[] = [];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    filteredNotifications.forEach((n) => {
      if (n.createdAt >= todayStart) {
        today.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, earlier };
  }, [filteredNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Slide-in panel from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 flex flex-col"
          >
            {/* Glass background */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-xl border-l border-white/10" />

            {/* Content */}
            <div className="relative flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Bell className="w-5 h-5 text-yellow-400" />
                    {unreadCount > 0 && (
                      <NotificationBadge count={unreadCount} />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">Notifications</h2>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={onMarkAllAsRead}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs font-medium hover:bg-white/15 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Read all
                    </motion.button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1 mx-4 mt-3 mb-2 p-1 bg-white/5 rounded-xl">
                {([
                  { id: 'all' as const, label: 'All' },
                  { id: 'unread' as const, label: `Unread (${unreadCount})` },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                      filter === f.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white/70'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto px-4 pb-6">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-white/40">
                    <Bell className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">All caught up!</p>
                    <p className="text-xs mt-1">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
                  </div>
                ) : (
                  <>
                    {/* Today */}
                    {grouped.today.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 mt-2">
                          Today
                        </h3>
                        <div className="space-y-2">
                          {grouped.today.map((notification, index) => {
                            const config = getNotificationConfig(notification.type);
                            const Icon = config.icon;
                            return (
                              <motion.button
                                key={notification.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                  'w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all border-l-2',
                                  notification.isRead
                                    ? 'bg-white/3 border-l-transparent'
                                    : cn('bg-white/5', config.accentBorder)
                                )}
                              >
                                {/* Icon */}
                                <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                                  {notification.data?.giftEmoji ? (
                                    <span className="text-lg block w-5 h-5 flex items-center justify-center">
                                      {notification.data.giftEmoji}
                                    </span>
                                  ) : (
                                    <Icon className={cn('w-5 h-5', config.color)} />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                      'text-sm truncate',
                                      notification.isRead ? 'text-white/70' : 'text-white font-medium'
                                    )}>
                                      {notification.title}
                                    </p>
                                    <span className="text-[10px] text-white/30 whitespace-nowrap flex-shrink-0">
                                      {formatTimeRelative(notification.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>

                                  {/* Contextual data */}
                                  {notification.type === 'daily_reward' && notification.data?.rewardAmount && (
                                    <div className="mt-1.5 flex items-center gap-1">
                                      <Coins className="w-3 h-3 text-yellow-400" />
                                      <span className="text-yellow-400 text-xs font-bold">
                                        +{formatChips(notification.data.rewardAmount)} chips
                                      </span>
                                    </div>
                                  )}

                                  {notification.type === 'game_invite' && notification.data?.roomCode && (
                                    <div className="mt-1.5 flex items-center gap-1">
                                      <span className="text-green-400/70 font-mono text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded">
                                        {notification.data.roomCode}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Unread dot + arrow */}
                                <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                                  {!notification.isRead && (
                                    <div className={cn('w-2 h-2 rounded-full', config.bg.replace('/20', ''))} />
                                  )}
                                  {notification.data?.deepLink && (
                                    <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Earlier */}
                    {grouped.earlier.length > 0 && (
                      <div>
                        <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2 mt-2">
                          Earlier
                        </h3>
                        <div className="space-y-2">
                          {grouped.earlier.map((notification, index) => {
                            const config = getNotificationConfig(notification.type);
                            const Icon = config.icon;
                            return (
                              <motion.button
                                key={notification.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (grouped.today.length + index) * 0.04 }}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                  'w-full flex items-start gap-3 p-3 rounded-2xl text-left transition-all border-l-2',
                                  notification.isRead
                                    ? 'bg-white/3 border-l-transparent opacity-70'
                                    : cn('bg-white/5', config.accentBorder)
                                )}
                              >
                                <div className={cn('p-2 rounded-xl flex-shrink-0 mt-0.5', config.bg)}>
                                  {notification.data?.giftEmoji ? (
                                    <span className="text-lg block w-5 h-5 flex items-center justify-center">
                                      {notification.data.giftEmoji}
                                    </span>
                                  ) : (
                                    <Icon className={cn('w-5 h-5', config.color)} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                      'text-sm truncate',
                                      notification.isRead ? 'text-white/70' : 'text-white font-medium'
                                    )}>
                                      {notification.title}
                                    </p>
                                    <span className="text-[10px] text-white/30 whitespace-nowrap flex-shrink-0">
                                      {formatTimeRelative(notification.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>

                                  {notification.type === 'daily_reward' && notification.data?.rewardAmount && (
                                    <div className="mt-1.5 flex items-center gap-1">
                                      <Coins className="w-3 h-3 text-yellow-400" />
                                      <span className="text-yellow-400 text-xs font-bold">
                                        +{formatChips(notification.data.rewardAmount)} chips
                                      </span>
                                    </div>
                                  )}

                                  {notification.type === 'game_invite' && notification.data?.roomCode && (
                                    <div className="mt-1.5 flex items-center gap-1">
                                      <span className="text-green-400/70 font-mono text-[10px] bg-green-500/10 px-1.5 py-0.5 rounded">
                                        {notification.data.roomCode}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                                  {!notification.isRead && (
                                    <div className={cn('w-2 h-2 rounded-full', config.bg.replace('/20', ''))} />
                                  )}
                                  {notification.data?.deepLink && (
                                    <ChevronRight className="w-3.5 h-3.5 text-white/20" />
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
