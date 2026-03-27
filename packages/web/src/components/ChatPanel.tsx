import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Smile, Sparkles } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';

interface ChatPanelProps {
  onClose: () => void;
}

const quickEmojis = ['👍', '👏', '🔥', '😎', '😂', '🤔', '💪', '🎉'];
const quickMessages = ['Good luck!', 'Nice hand!', 'Chaal!', 'Pack it!', 'All in!', 'GG!'];

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { chatMessages, addChatMessage, currentRoom } = useGameStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (text?: string) => {
    const message = text || input.trim();
    if (!message || !user) return;

    addChatMessage({
      id: crypto.randomUUID(),
      roomId: currentRoom?.id || '',
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      message,
      createdAt: new Date()
    });

    setInput('');
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 h-[70%] z-50 flex flex-col overflow-hidden"
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-xl rounded-t-3xl border-t border-white/10" />

        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white">Table Chat</h3>
              <span className="text-xs text-white/40">
                {chatMessages.length} messages
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Quick messages */}
          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide border-b border-white/5">
            {quickMessages.map((msg) => (
              <button
                key={msg}
                onClick={() => handleSend(msg)}
                className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs whitespace-nowrap hover:bg-white/20 transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/40">
                <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.userId === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn('flex gap-2', isMe ? 'flex-row-reverse' : '')}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {msg.avatarUrl ? (
                        <img
                          src={msg.avatarUrl}
                          alt={msg.username}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10">
                          {msg.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div className={cn('flex flex-col max-w-[70%]', isMe ? 'items-end' : 'items-start')}>
                      <span className="text-[10px] text-white/40 mb-1 px-1">
                        {isMe ? 'You' : msg.username}
                      </span>
                      <div
                        className={cn(
                          'px-4 py-2 rounded-2xl text-sm',
                          isMe
                            ? 'bg-gradient-to-r from-red-700 to-red-800 text-white rounded-tr-sm'
                            : 'bg-white/10 text-white/90 rounded-tl-sm'
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-white/30 mt-0.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji picker */}
          <AnimatePresence>
            {showEmojis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10"
              >
                <div className="flex flex-wrap gap-2 p-3 bg-black/40">
                  {quickEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSend(emoji)}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xl flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex items-center gap-2">
            <button
              onClick={() => setShowEmojis(!showEmojis)}
              className={cn(
                'p-2.5 rounded-xl transition-colors',
                showEmojis ? 'bg-yellow-500 text-yellow-900' : 'bg-white/10 text-white/60 hover:text-white'
              )}
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className={cn(
                'p-2.5 rounded-xl transition-colors',
                input.trim()
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                  : 'bg-white/10 text-white/30'
              )}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
