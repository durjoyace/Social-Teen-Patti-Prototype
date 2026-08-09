import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Send, Smile, MessageCircle } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { socketService } from '../services/socket';
import { cn } from '../utils/cn';

interface ChatPanelProps {
  onClose: () => void;
}

const quickEmojis = ['👍', '👏', '🔥', '😎', '😂', '🤔', '💪', '🎉'];
const quickMessages = ['Good luck!', 'Nice hand!', 'Chaal!', 'Pack it!', 'All in!', 'GG!'];

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { chatMessages, currentRoom } = useGameStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const titleId = useId();
  const drawerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [chatMessages, reducedMotion]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus();

    const handleDialogKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const handleSend = (text?: string) => {
    const message = (text ?? input).trim().slice(0, 240);
    if (!message || !user || !currentRoom) return;
    if (!socketService.sendChatMessage(currentRoom.id, message)) {
      if (text) setInput(message);
      setSendError('Reconnecting—your message is still here. Try again in a moment.');
      return;
    }
    setSendError(null);
    setInput('');
    setShowEmojis(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSend();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && showEmojis) {
      event.stopPropagation();
      setShowEmojis(false);
    }
  };

  return (
    <>
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', damping: 28, stiffness: 250 }}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[72%] flex-col overflow-hidden rounded-t-[28px] border-t border-[#E8B04A]/20 bg-[#0E1B17] shadow-[0_-24px_60px_rgba(0,0,0,0.55)] sm:bottom-4 sm:left-auto sm:right-4 sm:h-[min(720px,calc(100%-2rem))] sm:w-[420px] sm:rounded-[28px] sm:border"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#2A1714] text-[#E8B04A]">
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-lg font-bold text-[#F6ECD8]">Table chat</h2>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#7E8D85]">{chatMessages.length} {chatMessages.length === 1 ? 'message' : 'messages'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close table chat" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-[#A9B9B0] hover:bg-white/[0.06] hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto border-b border-white/[0.06] px-4 py-2.5" aria-label="Quick messages">
          {quickMessages.map((message) => (
            <button
              type="button"
              key={message}
              onClick={() => handleSend(message)}
              className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-[#C9D3CE] hover:border-[#E8B04A]/25 hover:text-[#F6ECD8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]"
            >
              {message}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-label="Table messages">
          {chatMessages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-[#7E8D85]">
              <MessageCircle aria-hidden="true" className="mb-3 h-8 w-8 text-[#E8B04A]/55" />
              <p className="font-display text-lg font-bold text-[#C9D3CE]">The table is quiet.</p>
              <p className="mt-1 text-xs">Wish everyone luck or send the first reaction.</p>
            </div>
          ) : (
            chatMessages.map((message, index) => {
              const isMe = message.userId === user?.id;
              return (
                <motion.article
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reducedMotion ? 0 : Math.min(index * 0.025, 0.2) }}
                  className={cn('flex gap-2', isMe && 'flex-row-reverse')}
                >
                  {message.avatarUrl ? (
                    <img src={message.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />
                  ) : (
                    <div aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#E8B04A]/25 bg-[#2A1714] text-xs font-bold text-[#E8B04A]">
                      {message.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}

                  <div className={cn('flex max-w-[78%] flex-col', isMe ? 'items-end' : 'items-start')}>
                    <span className="mb-1 px-1 text-[10px] text-[#7E8D85]">{isMe ? 'You' : message.username}</span>
                    <p className={cn(
                      'rounded-2xl px-3.5 py-2 text-sm leading-5',
                      isMe ? 'rounded-tr-sm bg-[#B74035] text-[#FFF9ED]' : 'rounded-tl-sm bg-white/[0.075] text-[#E2E9E5]',
                    )}>
                      {message.message}
                    </p>
                    <time className="mt-1 px-1 text-[9px] text-[#66736D]" dateTime={new Date(message.createdAt).toISOString()}>
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                </motion.article>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {showEmojis && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/10">
              <div className="grid grid-cols-8 gap-1 bg-[#07110E]/60 p-3" aria-label="Quick reactions">
                {quickEmojis.map((emoji) => (
                  <button type="button" key={emoji} onClick={() => handleSend(emoji)} aria-label={`Send ${emoji}`} className="grid aspect-square place-items-center rounded-lg text-xl hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {sendError && <p role="alert" className="border-t border-[#B74035]/25 bg-[#2A1714] px-4 py-2 text-xs text-[#F2B1A9]">{sendError}</p>}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:pb-3">
          <button
            type="button"
            onClick={() => setShowEmojis((visible) => !visible)}
            aria-label={showEmojis ? 'Hide quick reactions' : 'Show quick reactions'}
            aria-expanded={showEmojis}
            className={cn(
              'grid h-11 w-11 shrink-0 place-items-center rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]',
              showEmojis ? 'border-[#E8B04A]/45 bg-[#2A1714] text-[#E8B04A]' : 'border-white/10 bg-white/[0.05] text-[#A9B9B0]',
            )}
          >
            <Smile aria-hidden="true" className="h-5 w-5" />
          </button>

          <label className="min-w-0 flex-1">
            <span className="sr-only">Message</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={240}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Message the table…"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#07110E] px-3.5 text-sm text-[#F6ECD8] placeholder:text-[#66736D] focus:border-[#E8B04A]/45 focus:outline-none focus:ring-2 focus:ring-[#E8B04A]/35"
            />
          </label>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.96 }}
            disabled={!input.trim() || !currentRoom}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E8B04A] text-[#171006] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]"
          >
            <Send aria-hidden="true" className="h-5 w-5" />
          </motion.button>
        </form>
      </motion.div>
    </>
  );
}
