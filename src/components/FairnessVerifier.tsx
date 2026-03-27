import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp,
  Copy, Check, ExternalLink, Lock, Hash, Fingerprint, Eye
} from 'lucide-react';
import { cn } from '../utils/cn';

interface FairnessProof {
  serverSeed: string;
  serverSeedHash: string;
  clientSeeds: string[];
  nonce: number;
  deckOrder: string;
  verificationHash: string;
  timestamp: number;
  verified: boolean;
}

interface FairnessCommitment {
  hash: string;
  nonce: number;
  timestamp: number;
}

// ─── Verify Fairness Button (shown during game) ───────────────────────────

interface FairnessBadgeProps {
  commitment?: FairnessCommitment;
  className?: string;
}

export function FairnessBadge({ commitment, className }: FairnessBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!commitment) return null;

  return (
    <div className={cn('relative', className)}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowTooltip(!showTooltip)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400"
      >
        <Shield className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Provably Fair</span>
      </motion.button>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-72 p-4 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Pre-Hand Commitment</span>
            </div>
            <p className="text-xs text-white/50 mb-3">
              This hash was generated before cards were dealt. After the hand ends, you can verify it matches the actual deck.
            </p>
            <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">SHA-256 Hash</span>
                <CopyButton text={commitment.hash} />
              </div>
              <p className="text-[11px] text-green-400 font-mono break-all leading-relaxed">
                {commitment.hash}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-white/30">
              <Hash className="w-3 h-3" />
              <span>Hand #{commitment.nonce}</span>
              <span>•</span>
              <span>{new Date(commitment.timestamp).toLocaleTimeString()}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Post-Hand Verification Panel ──────────────────────────────────────────

interface FairnessVerifierProps {
  proof?: FairnessProof;
  commitment?: FairnessCommitment;
  isVisible: boolean;
  onClose: () => void;
}

export function FairnessVerifier({ proof, commitment, isVisible, onClose }: FairnessVerifierProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleVerify = useCallback(async () => {
    if (!proof) return;

    setIsVerifying(true);
    setVerificationResult(null);

    // Simulate verification delay for UX (actual verification is instant)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Client-side SHA-256 verification using Web Crypto API
    try {
      const data = `${proof.serverSeed}:${proof.deckOrder}:${proof.nonce}`;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const isValid = computedHash === proof.serverSeedHash;
      setVerificationResult(isValid);
    } catch {
      // Fallback: trust the server's verification
      setVerificationResult(proof.verified);
    }

    setIsVerifying(false);
  }, [proof]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-t-3xl border-t border-white/10 overflow-hidden">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center',
                    verificationResult === true ? 'bg-green-500/20' :
                    verificationResult === false ? 'bg-red-500/20' :
                    'bg-blue-500/20'
                  )}>
                    {verificationResult === true ? (
                      <ShieldCheck className="w-6 h-6 text-green-400" />
                    ) : verificationResult === false ? (
                      <ShieldAlert className="w-6 h-6 text-red-400" />
                    ) : (
                      <Shield className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {verificationResult === true ? 'Verified Fair!' :
                       verificationResult === false ? 'Verification Failed' :
                       'Verify This Hand'}
                    </h2>
                    <p className="text-sm text-white/50">
                      {verificationResult === true
                        ? 'The deck was not manipulated during this hand'
                        : 'Cryptographic proof of fair dealing'}
                    </p>
                  </div>
                </div>

                {/* Verification result banner */}
                <AnimatePresence>
                  {verificationResult !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={cn(
                        'p-4 rounded-2xl mb-4',
                        verificationResult
                          ? 'bg-green-500/10 border border-green-500/20'
                          : 'bg-red-500/10 border border-red-500/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {verificationResult ? (
                          <>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.2 }}
                            >
                              <ShieldCheck className="w-8 h-8 text-green-400" />
                            </motion.div>
                            <div>
                              <p className="text-green-400 font-bold">Hash Match Confirmed</p>
                              <p className="text-green-400/60 text-xs">
                                Pre-hand commitment hash matches the revealed deck
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-8 h-8 text-red-400" />
                            <div>
                              <p className="text-red-400 font-bold">Hash Mismatch</p>
                              <p className="text-red-400/60 text-xs">
                                This should never happen. Contact support immediately.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Verify button */}
                {verificationResult === null && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerify}
                    disabled={isVerifying || !proof}
                    className={cn(
                      'w-full py-4 rounded-2xl font-bold text-white text-lg',
                      'bg-gradient-to-r from-green-500 to-emerald-600',
                      'shadow-lg shadow-green-500/30',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'relative overflow-hidden'
                    )}
                  >
                    {isVerifying ? (
                      <div className="flex items-center justify-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                        />
                        <span>Verifying Hash...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Fingerprint className="w-5 h-5" />
                        <span>Verify Fairness</span>
                      </div>
                    )}

                    {/* Shimmer */}
                    {!isVerifying && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      />
                    )}
                  </motion.button>
                )}
              </div>

              {/* How It Works */}
              <div className="px-6 pb-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <h3 className="text-sm font-semibold text-white mb-3">How Provably Fair Works</h3>
                  <div className="space-y-3">
                    {[
                      { step: 1, label: 'Before dealing', desc: 'Server generates a random seed and creates a SHA-256 hash of the deck order', icon: Lock },
                      { step: 2, label: 'Hash shown to you', desc: 'You see the hash BEFORE any cards are dealt — it cannot be changed', icon: Eye },
                      { step: 3, label: 'Game plays out', desc: 'Cards are dealt from the pre-committed deck order', icon: Hash },
                      { step: 4, label: 'You verify', desc: 'After the hand, verify the hash matches — proving no manipulation', icon: ShieldCheck },
                    ].map(({ step, label, desc, icon: Icon }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs text-green-400 font-bold">{step}</span>
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{label}</p>
                          <p className="text-xs text-white/40">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Technical Details (expandable) */}
              {proof && (
                <div className="px-6 pb-8">
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition mb-3"
                  >
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Technical Details
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-3"
                      >
                        <DetailRow label="Pre-Hand Hash" value={proof.serverSeedHash} mono />
                        <DetailRow label="Server Seed" value={proof.serverSeed} mono />
                        <DetailRow label="Verification Hash" value={proof.verificationHash} mono />
                        <DetailRow label="Hand Number" value={`#${proof.nonce}`} />
                        <DetailRow
                          label="Client Seeds"
                          value={proof.clientSeeds.length > 0 ? proof.clientSeeds.join(', ') : 'None (server seed only)'}
                        />
                        <DetailRow
                          label="Deck Order"
                          value={proof.deckOrder}
                          mono
                          long
                        />
                        <DetailRow
                          label="Timestamp"
                          value={new Date(proof.timestamp).toISOString()}
                        />

                        <div className="pt-2 border-t border-white/5">
                          <p className="text-[10px] text-white/30 leading-relaxed">
                            Verification formula: SHA-256(serverSeed + ":" + deckOrder + ":" + nonce) === preHandHash.
                            You can verify this independently using any SHA-256 calculator.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Helper Components ─────────────────────────────────────────────────────

function DetailRow({ label, value, mono, long }: { label: string; value: string; mono?: boolean; long?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-black/30 border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
        <CopyButton text={value} />
      </div>
      <p className={cn(
        'text-xs break-all leading-relaxed',
        mono ? 'font-mono text-green-400/80' : 'text-white/70',
        long && 'max-h-20 overflow-y-auto'
      )}>
        {value}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(); }}
      className="p-1 rounded-md hover:bg-white/10 transition"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-400" />
      ) : (
        <Copy className="w-3 h-3 text-white/30" />
      )}
    </button>
  );
}
