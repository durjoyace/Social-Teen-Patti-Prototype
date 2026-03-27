import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX,
  Settings, Users, Radio
} from 'lucide-react';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { cn } from '../utils/cn';

interface VoiceChatControlsProps {
  roomId: string;
  className?: string;
}

export function VoiceChatControls({ roomId, className }: VoiceChatControlsProps) {
  const {
    isConnected,
    isConnecting,
    isMuted,
    isSpeaking,
    peers,
    error,
    joinVoice,
    leaveVoice,
    toggleMute,
    setPushToTalk,
  } = useVoiceChat();

  const [showPanel, setShowPanel] = useState(false);
  const [pushToTalkActive, setPushToTalkActive] = useState(false);

  const handleJoin = () => {
    joinVoice(roomId);
  };

  const handlePTTDown = () => {
    setPushToTalkActive(true);
    setPushToTalk(true);
  };

  const handlePTTUp = () => {
    setPushToTalkActive(false);
    setPushToTalk(false);
  };

  // Not connected — show join button
  if (!isConnected) {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleJoin}
        disabled={isConnecting}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl',
          'bg-green-500/20 border border-green-500/30 text-green-400',
          'hover:bg-green-500/30 transition-colors',
          isConnecting && 'opacity-50',
          className
        )}
      >
        {isConnecting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 border-green-400/20 border-t-green-400 rounded-full"
            />
            <span className="text-xs font-medium">Connecting...</span>
          </>
        ) : (
          <>
            <Phone className="w-4 h-4" />
            <span className="text-xs font-medium">Join Voice</span>
          </>
        )}
      </motion.button>
    );
  }

  // Connected — show controls
  return (
    <div className={cn('relative', className)}>
      {/* Compact control bar */}
      <div className="flex items-center gap-1.5">
        {/* Speaking indicator */}
        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium',
          isSpeaking && !isMuted
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-white/5 text-white/40'
        )}>
          <motion.div
            animate={isSpeaking && !isMuted ? {
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            } : {}}
            transition={{ repeat: Infinity, duration: 0.6 }}
          >
            <Radio className="w-3 h-3" />
          </motion.div>
          <span>{peers.length + 1}</span>
        </div>

        {/* Mute toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className={cn(
            'p-2 rounded-xl transition-colors',
            isMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          )}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </motion.button>

        {/* Disconnect */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={leaveVoice}
          className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30"
        >
          <PhoneOff className="w-4 h-4" />
        </motion.button>

        {/* Expand panel */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowPanel(!showPanel)}
          className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition"
        >
          <Users className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Peer speaking indicators (floating above the control bar) */}
      <AnimatePresence>
        {peers.filter(p => p.isSpeaking && !p.isMuted).map(peer => (
          <motion.div
            key={peer.odic}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-8 left-0 right-0 flex justify-center"
          >
            <div className="px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
              <span className="text-[10px] text-green-400 font-medium">
                {peer.odic.slice(0, 8)} speaking
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 right-0 w-64 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Voice Chat</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400">Connected</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
              {/* Self */}
              <VoicePeerRow
                name="You"
                isMuted={isMuted}
                isSpeaking={isSpeaking}
                isSelf
              />

              {/* Other peers */}
              {peers.map(peer => (
                <VoicePeerRow
                  key={peer.odic}
                  name={peer.odic.slice(0, 12)}
                  isMuted={peer.isMuted}
                  isSpeaking={peer.isSpeaking}
                />
              ))}

              {peers.length === 0 && (
                <p className="text-center text-white/30 text-xs py-3">
                  No other voice participants yet
                </p>
              )}
            </div>

            {/* Push-to-Talk option */}
            <div className="p-3 border-t border-white/5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onPointerDown={handlePTTDown}
                onPointerUp={handlePTTUp}
                onPointerLeave={handlePTTUp}
                className={cn(
                  'w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
                  pushToTalkActive
                    ? 'bg-green-500 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/15'
                )}
              >
                {pushToTalkActive ? 'Speaking...' : 'Hold to Talk'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-12 left-0 right-0 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Peer Row ──────────────────────────────────────────────────────────────

function VoicePeerRow({
  name,
  isMuted,
  isSpeaking,
  isSelf,
}: {
  name: string;
  isMuted: boolean;
  isSpeaking: boolean;
  isSelf?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-xl',
      isSpeaking && !isMuted ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5'
    )}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
        isSelf
          ? 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white'
          : 'bg-gradient-to-br from-red-600 to-red-900 text-white'
      )}>
        {name[0].toUpperCase()}
      </div>

      {/* Name */}
      <span className={cn(
        'flex-1 text-sm font-medium truncate',
        isSelf ? 'text-yellow-400' : 'text-white'
      )}>
        {name}
      </span>

      {/* Status */}
      {isSpeaking && !isMuted ? (
        <div className="flex items-center gap-0.5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-0.5 bg-green-400 rounded-full"
              animate={{ height: [4, 12, 4] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
            />
          ))}
        </div>
      ) : isMuted ? (
        <MicOff className="w-3.5 h-3.5 text-red-400" />
      ) : (
        <Mic className="w-3.5 h-3.5 text-white/30" />
      )}
    </div>
  );
}
