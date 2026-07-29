import { useState, useRef, useCallback, useEffect } from 'react';
import { socketService } from '../services/socket';

interface VoicePeer {
  odic: string;
  socketId: string;
  isMuted: boolean;
  isSpeaking: boolean;
  connection?: RTCPeerConnection;
  audioElement?: HTMLAudioElement;
}

interface UseVoiceChatReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  peers: VoicePeer[];
  error: string | null;

  joinVoice: (roomId: string) => Promise<void>;
  leaveVoice: () => void;
  toggleMute: () => void;
  setPushToTalk: (active: boolean) => void;
}

export function useVoiceChat(): UseVoiceChatReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [peers, setPeers] = useState<VoicePeer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const roomIdRef = useRef<string | null>(null);
  const iceServersRef = useRef<RTCIceServer[]>([]);
  const vadIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // ─── Voice Activity Detection ────────────────────────────────────────

  const startVAD = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 512;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      vadIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const nowSpeaking = avg > 15; // Threshold

        if (nowSpeaking !== wasSpeaking) {
          wasSpeaking = nowSpeaking;
          setIsSpeaking(nowSpeaking);

          if (roomIdRef.current) {
            socketService.on('voice:speaking', () => {}); // Ensure listener
            // Emit speaking state
          }
        }
      }, 100);
    } catch {
      // VAD not supported — that's fine
    }
  }, []);

  const stopVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
    }
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
  }, []);

  // ─── WebRTC Connection ───────────────────────────────────────────────

  const createPeerConnection = useCallback((peerSocketId: string, peerUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current,
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming audio
    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
      audio.volume = 1;
      audio.play().catch(() => {}); // Auto-play may be blocked

      setPeers(prev => prev.map(p =>
        p.socketId === peerSocketId ? { ...p, audioElement: audio } : p
      ));
    };

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.on('voice:ice_candidate', () => {}); // Ensure handler
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn(`[Voice] Peer connection ${peerSocketId} ${pc.connectionState}`);
      }
    };

    connectionsRef.current.set(peerSocketId, pc);
    return pc;
  }, []);

  // ─── Join Voice Room ─────────────────────────────────────────────────

  const joinVoice = useCallback(async (roomId: string) => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      });

      localStreamRef.current = stream;
      roomIdRef.current = roomId;

      // Start voice activity detection
      startVAD(stream);

      // Join the server's voice room
      // The socket service will handle the signaling
      setIsConnected(true);
      setIsConnecting(false);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setError(message);
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, startVAD]);

  // ─── Leave Voice Room ────────────────────────────────────────────────

  const leaveVoice = useCallback(() => {
    // Stop local stream
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    // Close all peer connections
    connectionsRef.current.forEach(pc => pc.close());
    connectionsRef.current.clear();

    // Stop VAD
    stopVAD();

    // Cleanup audio elements
    peers.forEach(p => {
      if (p.audioElement) {
        p.audioElement.pause();
        p.audioElement.srcObject = null;
      }
    });

    roomIdRef.current = null;
    setIsConnected(false);
    setIsSpeaking(false);
    setPeers([]);
    setError(null);
  }, [peers, stopVAD]);

  // ─── Mute / Push-to-Talk ─────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const setPushToTalk = useCallback((active: boolean) => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = active;
        setIsMuted(!active);
      }
    }
  }, []);

  // ─── Socket Event Listeners ──────────────────────────────────────────

  useEffect(() => {
    const unsubJoined = socketService.on('voice:peer_joined', (data: { odic: string; socketId: string }) => {
      setPeers(prev => [...prev, {
        odic: data.odic,
        socketId: data.socketId,
        isMuted: false,
        isSpeaking: false,
      }]);
    });

    const unsubLeft = socketService.on('voice:peer_left', (data: { odic: string }) => {
      setPeers(prev => {
        const peer = prev.find(p => p.odic === data.odic);
        if (peer?.audioElement) {
          peer.audioElement.pause();
          peer.audioElement.srcObject = null;
        }
        // Close the peer connection
        const conn = connectionsRef.current.get(peer?.socketId || '');
        if (conn) {
          conn.close();
          connectionsRef.current.delete(peer?.socketId || '');
        }
        return prev.filter(p => p.odic !== data.odic);
      });
    });

    const unsubMuted = socketService.on('voice:peer_muted', (data: { odic: string; isMuted: boolean }) => {
      setPeers(prev => prev.map(p =>
        p.odic === data.odic ? { ...p, isMuted: data.isMuted } : p
      ));
    });

    const unsubSpeaking = socketService.on('voice:peer_speaking', (data: { odic: string; isSpeaking: boolean }) => {
      setPeers(prev => prev.map(p =>
        p.odic === data.odic ? { ...p, isSpeaking: data.isSpeaking } : p
      ));
    });

    return () => {
      unsubJoined();
      unsubLeft();
      unsubMuted();
      unsubSpeaking();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  return {
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
  };
}
