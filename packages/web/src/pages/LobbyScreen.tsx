import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  CircleUserRound,
  Coins,
  Copy,
  Diamond,
  DoorOpen,
  Hash,
  Heart,
  HelpCircle,
  Link2,
  LockKeyhole,
  Play,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Spade,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { analytics } from '../services/analytics';
import { api } from '../services/api';
import { socketService, type SocketConnectionState } from '../services/socket';
import type { GameRoom, GameVariant } from '../types';
import { cn } from '../utils/cn';

interface LobbyScreenProps {
  onJoinGame: (room: GameRoom) => Promise<void>;
  onCreateGame: () => void;
  onQuickPlay: () => Promise<void>;
  onJoinByCode: () => void;
  onLeaveTable: () => void;
  onNavigate: (screen: string) => void;
}

type ShareState = 'idle' | 'sharing' | 'shared' | 'error';
type RoomsState = 'idle' | 'loading' | 'ready' | 'error';

const seatPositions = [
  'club-seat--host',
  'club-seat--upper-right',
  'club-seat--lower-right',
  'club-seat--lower-center',
  'club-seat--lower-left',
  'club-seat--upper-left',
];

function makeInviteUrl(roomCode: string) {
  const inviteUrl = new URL(window.location.origin);
  inviteUrl.searchParams.set('room', roomCode);
  return inviteUrl.toString();
}

export function LobbyScreen({
  onJoinGame,
  onCreateGame,
  onQuickPlay,
  onJoinByCode,
  onLeaveTable,
  onNavigate,
}: LobbyScreenProps) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const { currentRoom, availableRooms, setRooms } = useGameStore();
  const [shareState, setShareState] = useState<ShareState>('idle');
  const [shareMessage, setShareMessage] = useState('');
  const [roomsState, setRoomsState] = useState<RoomsState>('idle');
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(() => socketService.connectionState);

  useEffect(() => socketService.on('connection:state', (nextState: SocketConnectionState) => {
    setConnectionState(nextState);
  }), []);

  const roomCode = currentRoom?.roomCode || null;
  const isActiveTable = Boolean(currentRoom && roomCode);
  const maxSeats = Math.min(Math.max(currentRoom?.maxPlayers || 6, 2), 6);
  const occupiedSeats = currentRoom ? Math.min(Math.max(currentRoom.currentPlayers, 1), maxSeats) : 0;
  const connectionView = {
    connected: { label: currentRoom ? 'Table connected' : 'Clubhouse ready', mobileLabel: 'Ready', Icon: Wifi },
    connecting: { label: currentRoom ? 'Connecting table…' : 'Connecting clubhouse…', mobileLabel: 'Connecting…', Icon: RefreshCw },
    reconnecting: { label: currentRoom ? 'Reconnecting table…' : 'Reconnecting clubhouse…', mobileLabel: 'Reconnecting…', Icon: RefreshCw },
    offline: { label: currentRoom ? 'Table offline' : 'Clubhouse offline', mobileLabel: 'Offline', Icon: WifiOff },
  }[connectionState];

  const seatLabels = useMemo(() => {
    return Array.from({ length: maxSeats }, (_, index) => {
      const player = currentRoom?.players?.[index];
      if (player?.user?.username) return player.user.username;
      if (index === 0 && currentRoom) return user?.username || 'You';
      if (index < occupiedSeats) return 'Friend seated';
      return 'Invite a friend';
    });
  }, [currentRoom, maxSeats, occupiedSeats, user?.username]);

  const recordShare = useCallback((platform: 'NATIVE' | 'COPY') => {
    analytics.inviteShared(platform.toLowerCase());
    void api.recordReferralShare(platform).catch(() => undefined);
  }, []);

  const copyInvite = useCallback(async () => {
    if (!roomCode) return false;
    try {
      await navigator.clipboard.writeText(makeInviteUrl(roomCode));
      recordShare('COPY');
      setShareState('shared');
      setShareMessage('Invite copied. Send it to your friends.');
      addToast({ message: 'Invite link copied', type: 'success', duration: 3000 });
      return true;
    } catch {
      setShareState('error');
      setShareMessage('Could not copy the invite. Copy the room code instead.');
      return false;
    }
  }, [addToast, recordShare, roomCode]);

  const shareInvite = useCallback(async () => {
    if (!roomCode || shareState === 'sharing') return;
    setShareState('sharing');
    setShareMessage('Opening sharing options…');
    const url = makeInviteUrl(roomCode);
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentRoom?.name || 'My private Teen Patti table',
          text: `Join my private Teen Patti table with code ${roomCode}. Adults 18+; social play only.`,
          url,
        });
        recordShare('NATIVE');
        setShareState('shared');
        setShareMessage('Invite ready. Waiting for your friends.');
        return;
      }
      await copyInvite();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setShareState('idle');
        setShareMessage('');
        return;
      }
      await copyInvite();
    }
  }, [copyInvite, currentRoom?.name, recordShare, roomCode, shareState]);

  const copyRoomCode = useCallback(async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setShareState('shared');
      setShareMessage('Room code copied.');
      addToast({ message: 'Room code copied', type: 'success', duration: 2500 });
    } catch {
      setShareState('error');
      setShareMessage(`Copy failed. Select this code manually: ${roomCode}`);
    }
  }, [addToast, roomCode]);

  const loadPracticeRooms = useCallback(async () => {
    if (roomsState === 'loading') return;
    setRoomsState('loading');
    try {
      if (!socketService.isConnected) await socketService.connect();
      const result = await socketService.listRooms();
      setRooms(result.rooms.map((room) => ({
        id: room.id,
        name: room.name,
        variant: String(room.variant).toLowerCase() as GameVariant,
        minBuyIn: Number(room.minBuyIn || room.bootAmount || 500),
        maxBuyIn: Number(room.maxBuyIn || 5000),
        minBet: Number(room.bootAmount || 50),
        maxPlayers: Number(room.maxPlayers || 6),
        currentPlayers: Number(room.currentPlayers || 0),
        status: room.status,
        isPrivate: false,
        createdBy: '',
      })));
      setRoomsState('ready');
    } catch {
      setRoomsState('error');
    }
  }, [roomsState, setRooms]);

  const startPractice = useCallback(async () => {
    if (pendingAction) return;
    setPendingAction('practice');
    try {
      await onQuickPlay();
    } finally {
      setPendingAction(null);
    }
  }, [onQuickPlay, pendingAction]);

  const joinPracticeRoom = useCallback(async (room: GameRoom) => {
    if (pendingAction) return;
    setPendingAction(room.id);
    try {
      await onJoinGame(room);
    } finally {
      setPendingAction(null);
    }
  }, [onJoinGame, pendingAction]);

  const openPractice = useCallback(() => {
    setPracticeOpen(true);
    window.requestAnimationFrame(() => {
      document.getElementById('practice-and-rules')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const closeActiveTable = () => {
    onLeaveTable();
    setConfirmLeave(false);
    setShareState('idle');
    setShareMessage('');
    addToast({ message: 'You left the table. The invite is no longer active for you.', type: 'info', duration: 4000 });
  };

  return (
    <Layout wide>
      <div className="clubhouse-page h-full overflow-y-auto text-[#FFFBEA]">
        <div className="mx-auto w-full max-w-[1505px] px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-6 lg:px-8">
          <header className="clubhouse-header">
            <div className="flex min-w-0 items-center gap-3">
              <div className="brand-mark" aria-hidden="true">TP</div>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold leading-tight text-[#FFFBEA] sm:text-xl">Teen Patti Social</p>
                <p className="hidden text-xs font-medium text-[#AFC2B8] sm:block">Private tables for friends</p>
              </div>
            </div>

            <nav aria-label="Clubhouse navigation" className="hidden items-center gap-1 lg:flex">
              <span aria-current="page" className="clubhouse-nav-link clubhouse-nav-link--active">Clubhouse</span>
              <button type="button" onClick={openPractice} className="clubhouse-nav-link">How to play</button>
            </nav>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onNavigate('profile')} className="profile-control" aria-label={`Open ${user?.username || 'guest'} profile`}>
                <span className="profile-control__avatar">{user?.username?.[0]?.toUpperCase() || 'G'}</span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-28 truncate text-sm font-semibold text-[#FFFBEA]">{user?.username || 'Guest'}</span>
                  <span className="flex items-center gap-1 text-xs text-[#E0BD76]"><Coins className="h-3 w-3" aria-hidden="true" /> {Number(user?.chips || 0).toLocaleString()} play chips</span>
                </span>
              </button>
              <button type="button" aria-label="Open settings" onClick={() => onNavigate('settings')} className="icon-control">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main>
            <div className="clubhouse-grid">
              <motion.section
                aria-labelledby="friend-table-title"
                initial={{ opacity: 0.85, y: 14, clipPath: 'inset(0 0 7% 0 round 42px)' }}
                animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 42px)' }}
                transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
                className="club-table-shell"
              >
                <div className="club-table-felt">
                  <div className="club-table-topline">
                    <span className="privacy-status">
                      <LockKeyhole className="h-4 w-4" />
                      <span className="status-label--wide">Private · friends only</span>
                      <span className="status-label--compact">Friends only</span>
                    </span>
                    <span role="status" aria-live="polite" className={cn('connection-status', `connection-status--${connectionState}`)}>
                      <connectionView.Icon className={cn('h-4 w-4', (connectionState === 'connecting' || connectionState === 'reconnecting') && 'animate-spin')} />
                      <span className="status-label--wide">{connectionView.label}</span>
                      <span className="status-label--compact">{connectionView.mobileLabel}</span>
                    </span>
                  </div>

                  {Array.from({ length: maxSeats }, (_, index) => {
                    const occupied = index < occupiedSeats;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.86 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.12 + index * 0.045, duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        className={cn('club-seat', seatPositions[index], occupied && 'club-seat--occupied', index === 0 && occupied && 'club-seat--you')}
                      >
                        <span className="club-seat__medallion">
                          {occupied && index === 0 ? <UserRound className="h-6 w-6" /> : <CircleUserRound className="h-6 w-6" />}
                        </span>
                        <span className="club-seat__label">{seatLabels[index]}</span>
                      </motion.div>
                    );
                  })}

                  <div className="club-table-center">
                    {currentRoom ? (
                      <>
                        <h1 id="friend-table-title" className="club-table-title">{currentRoom.name || 'Your friend table'}</h1>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[#C7D8CF]">
                          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-[#E0BD76]" /> {occupiedSeats} of {maxSeats} seated</span>
                          <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-[#6F877B] sm:block" />
                          <span>Waiting for your people</span>
                        </div>
                        {roomCode && (
                          <button type="button" onClick={() => void copyRoomCode()} className="room-code-control" aria-label={`Copy room code ${roomCode}`}>
                            <span>Room code</span>
                            <strong>{roomCode}</strong>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="table-card-fan" aria-hidden="true">
                          <span className="table-card table-card--left"><strong>A</strong><Spade /></span>
                          <span className="table-card table-card--center"><strong>A</strong><Heart /></span>
                          <span className="table-card table-card--right"><strong>A</strong><Diamond /></span>
                        </div>
                        <h1 id="friend-table-title" className="club-table-title">Ready for your people.</h1>
                        <p className="club-table-subtitle">Start one private table, then share one link with the friends you already know.</p>
                        <div className="club-table-assurance"><ShieldCheck className="h-4 w-4" /> Adults 18+ · social play only</div>
                      </>
                    )}
                  </div>

                  {isActiveTable ? (
                    <button type="button" onClick={() => void shareInvite()} disabled={shareState === 'sharing'} className="table-rail-action" aria-describedby="share-status" aria-busy={shareState === 'sharing'}>
                      {shareState === 'shared' ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                      {shareState === 'sharing' ? 'Opening share…' : shareState === 'shared' ? 'Invite ready' : 'Share invite'}
                    </button>
                  ) : (
                    <button type="button" onClick={onCreateGame} className="table-rail-action">
                      <Plus className="h-5 w-5" /> Create a friend table
                    </button>
                  )}
                </div>
              </motion.section>

              <aside className="table-utility-rail" aria-label="Table actions">
                {currentRoom ? (
                  <>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#FFFBEA]">Your table is open.</h2>
                      <p className="mt-2 text-sm leading-6 text-[#B7C9C0]">Keep this page open while friends join. The table starts from live server state.</p>
                    </div>

                    <div className="utility-status" aria-live="polite">
                      <span className="utility-status__icon">{shareState === 'shared' ? <Check className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}</span>
                      <span id="share-status">{shareMessage || 'Invite not shared yet. Your code remains available here.'}</span>
                    </div>

                    {roomCode && (
                      <button type="button" onClick={() => void copyRoomCode()} className="utility-button utility-button--secondary">
                        <Copy className="h-4 w-4" /> Copy room code
                      </button>
                    )}

                    <div className="mt-auto border-t border-[#395044] pt-5">
                      {confirmLeave ? (
                        <div role="group" aria-label="Confirm leaving table">
                          <p className="text-sm leading-6 text-[#E9C8BE]">Leave this waiting table? You will lose quick access to its invite.</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setConfirmLeave(false)} className="utility-button utility-button--secondary"><X className="h-4 w-4" /> Stay</button>
                            <button type="button" onClick={closeActiveTable} className="utility-button utility-button--danger"><DoorOpen className="h-4 w-4" /> Leave</button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirmLeave(true)} className="text-button"><DoorOpen className="h-4 w-4" /> Leave this table</button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#FFFBEA]">Join your friends.</h2>
                      <p className="mt-2 text-sm leading-6 text-[#B7C9C0]">Enter the six-character code from the person hosting your table.</p>
                      <button type="button" onClick={onJoinByCode} className="utility-button utility-button--primary mt-5"><Hash className="h-4 w-4" /> Join with a code</button>
                    </div>
                    <div className="utility-divider"><span>or</span></div>
                    <div className="utility-rail-host">
                      <h2 className="text-base font-semibold text-[#FFFBEA]">Host the table</h2>
                      <p className="mt-2 text-sm leading-6 text-[#B7C9C0]">Choose the recommended setup now; change the rules only if your group needs to.</p>
                      <button type="button" onClick={onCreateGame} className="utility-button utility-button--secondary mt-5"><Plus className="h-4 w-4" /> Create a table</button>
                    </div>
                  </>
                )}
              </aside>
            </div>

            <div className="table-trust-strip" aria-label="Table trust and value information">
              <span><ShieldCheck className="h-4 w-4" /> Server dealt</span>
              <span><Check className="h-4 w-4" /> Table state verified</span>
              <span><Coins className="h-4 w-4" /> Play chips have no cash value</span>
            </div>

            <details
              id="practice-and-rules"
              open={practiceOpen}
              onToggle={(event) => {
                const open = event.currentTarget.open;
                setPracticeOpen(open);
                if (open && roomsState === 'idle') void loadPracticeRooms();
              }}
              className="practice-disclosure"
            >
              <summary>
                <span className="practice-disclosure__icon"><HelpCircle className="h-5 w-5" /></span>
                <span>
                  <strong>Practice &amp; learn the table</strong>
                  <small>Optional AI practice, rules, and public practice tables</small>
                </span>
                <ChevronDown className="practice-disclosure__chevron h-5 w-5" />
              </summary>

              <div className="practice-disclosure__body">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#FFFBEA]">Learn without holding up your friends.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#B7C9C0]">Practice is clearly separate from your private table. A turn lasts 30 seconds; if time runs out, the server packs that hand automatically.</p>
                  <button type="button" disabled={pendingAction !== null} onClick={() => void startPractice()} className="utility-button utility-button--secondary mt-5 max-w-xs">
                    <Play className="h-4 w-4" /> {pendingAction === 'practice' ? 'Opening practice…' : 'Practice with AI'}
                  </button>
                </div>

                <div className="practice-room-list" aria-live="polite">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-[#FFFBEA]">Public practice tables</h2>
                    {roomsState === 'error' && <button type="button" onClick={() => void loadPracticeRooms()} className="text-button">Try again</button>}
                  </div>
                  {roomsState === 'loading' && <p className="mt-3 text-sm text-[#B7C9C0]">Checking for practice tables…</p>}
                  {roomsState === 'error' && <p role="alert" className="mt-3 text-sm leading-6 text-[#E9C8BE]">Practice tables could not be loaded. Your private-table controls still work.</p>}
                  {roomsState === 'ready' && availableRooms.length === 0 && <p className="mt-3 text-sm text-[#B7C9C0]">No public practice tables are open right now.</p>}
                  {roomsState === 'ready' && availableRooms.slice(0, 3).map((room) => (
                    <button
                      type="button"
                      key={room.id}
                      disabled={pendingAction !== null || room.status !== 'waiting' || room.currentPlayers >= room.maxPlayers}
                      onClick={() => void joinPracticeRoom(room)}
                      className="practice-room-row"
                    >
                      <span><strong>{room.name}</strong><small>{room.currentPlayers} of {room.maxPlayers} seated · {room.variant.replace(/_/g, ' ')}</small></span>
                      <span>{pendingAction === room.id ? 'Joining…' : 'Join'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </details>
          </main>
        </div>
      </div>
    </Layout>
  );
}
