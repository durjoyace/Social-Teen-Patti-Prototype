import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Hash, X } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}

export function JoinRoomModal({ isOpen, onClose, onJoin }: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRoomCode('');
    setError('');
    setIsJoining(false);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !isJoining) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])') || []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (roomCode.length !== 6 || isJoining) return;
    setError('');
    setIsJoining(true);
    try {
      await onJoin(roomCode);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'That table could not be joined. Check the code and try again.');
      setIsJoining(false);
      inputRef.current?.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isJoining && onClose()} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-room-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            onKeyDown={handleKeyDown}
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 mx-auto w-auto max-w-md rounded-[30px] border border-white/10 bg-[#0E1B17] p-5 text-[#F6ECD8] shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E8B04A]">Friend table</p>
                <h2 id="join-room-title" className="mt-1 font-display text-3xl font-black text-[#FFF9ED]">Take your seat.</h2>
                <p className="mt-2 text-sm leading-6 text-[#7E8D85]">Enter the six-character code from your friend.</p>
              </div>
              <button type="button" aria-label="Close join table dialog" disabled={isJoining} onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-[#8E9C94] hover:bg-white/5 hover:text-[#F6ECD8] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B04A]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-[0.16em] text-[#8E9C94]">
                Room code
                <span className="relative mt-2 block">
                  <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#66736D]" />
                  <input
                    ref={inputRef}
                    value={roomCode}
                    onChange={(event) => {
                      setRoomCode(event.target.value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6));
                      setError('');
                    }}
                    aria-describedby={error ? 'join-room-error' : 'join-room-help'}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    inputMode="text"
                    maxLength={6}
                    placeholder="ABC123"
                    className="min-h-[64px] w-full rounded-[20px] border border-white/10 bg-[#07110E] px-12 text-center font-mono text-2xl font-black tracking-[0.28em] text-[#E8B04A] outline-none placeholder:text-[#3F4B45] focus:border-[#E8B04A]/60 focus:ring-2 focus:ring-[#E8B04A]/20"
                  />
                </span>
              </label>
              <p id="join-room-help" className="mt-2 text-xs text-[#66736D]">Letters and numbers only.</p>
              {error && <p id="join-room-error" role="alert" className="mt-3 rounded-xl border border-[#B74035]/30 bg-[#2A1714] px-3 py-2 text-sm leading-5 text-[#F2B1A9]">{error}</p>}
              <button type="submit" disabled={roomCode.length !== 6 || isJoining} className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#E8B04A] px-5 font-bold text-[#171006] transition-colors hover:bg-[#F0C268] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9ED]">
                {isJoining ? 'Joining table…' : 'Join table'} {!isJoining && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
