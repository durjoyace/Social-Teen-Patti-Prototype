/**
 * VOICE CHAT SERVICE
 *
 * WebRTC-based voice chat for game tables.
 * Server acts as signaling server — audio is peer-to-peer.
 *
 * Architecture:
 * - SFU (Selective Forwarding Unit) model for groups
 * - Peer-to-peer for 2 players
 * - Server handles signaling (offer/answer/ICE candidates)
 * - Audio tracks are forwarded between peers
 * - Mute/unmute is client-side (just stop sending audio track)
 * - Push-to-talk is client-side (hold to unmute)
 */

import { Server, Socket } from 'socket.io';

// WebRTC types (these run in browser, server just forwards the data)
type RTCSessionDescriptionInit = { type: string; sdp: string };
type RTCIceCandidateInit = { candidate: string; sdpMid?: string; sdpMLineIndex?: number };
type RTCIceServer = { urls: string | string[]; username?: string; credential?: string };

interface VoicePeer {
  odic: string;
  socketId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

interface VoiceRoom {
  roomId: string;
  peers: Map<string, VoicePeer>;  // odic -> peer
  maxPeers: number;
}

export class VoiceChatService {
  private rooms: Map<string, VoiceRoom> = new Map();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  setupHandlers(socket: Socket) {
    const userId = socket.data.user?.userId;
    if (!userId) return;

    // Join voice channel for a game room
    socket.on('voice:join', (data: { roomId: string }, callback) => {
      const { roomId } = data;

      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          roomId,
          peers: new Map(),
          maxPeers: 9,
        });
      }

      const room = this.rooms.get(roomId)!;

      if (room.peers.size >= room.maxPeers) {
        callback({ success: false, error: 'Voice room full' });
        return;
      }

      // Add peer
      room.peers.set(userId, {
        odic: userId,
        socketId: socket.id,
        isMuted: false,
        isSpeaking: false,
      });

      // Join socket.io room for voice
      socket.join(`voice:${roomId}`);

      // Notify existing peers about new participant
      socket.to(`voice:${roomId}`).emit('voice:peer_joined', {
        odic: userId,
        socketId: socket.id,
      });

      // Send list of existing peers to new participant
      const existingPeers = Array.from(room.peers.values())
        .filter(p => p.odic !== userId)
        .map(p => ({ odic: p.odic, socketId: p.socketId, isMuted: p.isMuted }));

      callback({
        success: true,
        peers: existingPeers,
        iceServers: getIceServers(),
      });
    });

    // Leave voice channel
    socket.on('voice:leave', (data: { roomId: string }) => {
      this.removePeer(data.roomId, userId, socket);
    });

    // WebRTC signaling: send offer
    socket.on('voice:offer', (data: { targetSocketId: string; offer: RTCSessionDescriptionInit }) => {
      this.io.to(data.targetSocketId).emit('voice:offer', {
        fromSocketId: socket.id,
        fromUserId: userId,
        offer: data.offer,
      });
    });

    // WebRTC signaling: send answer
    socket.on('voice:answer', (data: { targetSocketId: string; answer: RTCSessionDescriptionInit }) => {
      this.io.to(data.targetSocketId).emit('voice:answer', {
        fromSocketId: socket.id,
        fromUserId: userId,
        answer: data.answer,
      });
    });

    // WebRTC signaling: ICE candidate exchange
    socket.on('voice:ice_candidate', (data: { targetSocketId: string; candidate: RTCIceCandidateInit }) => {
      this.io.to(data.targetSocketId).emit('voice:ice_candidate', {
        fromSocketId: socket.id,
        fromUserId: userId,
        candidate: data.candidate,
      });
    });

    // Mute/unmute
    socket.on('voice:mute', (data: { roomId: string; isMuted: boolean }) => {
      const room = this.rooms.get(data.roomId);
      if (!room) return;

      const peer = room.peers.get(userId);
      if (peer) {
        peer.isMuted = data.isMuted;
        socket.to(`voice:${data.roomId}`).emit('voice:peer_muted', {
          odic: userId,
          isMuted: data.isMuted,
        });
      }
    });

    // Speaking indicator (voice activity detection)
    socket.on('voice:speaking', (data: { roomId: string; isSpeaking: boolean }) => {
      const room = this.rooms.get(data.roomId);
      if (!room) return;

      const peer = room.peers.get(userId);
      if (peer) {
        peer.isSpeaking = data.isSpeaking;
        socket.to(`voice:${data.roomId}`).emit('voice:peer_speaking', {
          odic: userId,
          isSpeaking: data.isSpeaking,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from all voice rooms
      for (const [roomId, room] of this.rooms) {
        if (room.peers.has(userId)) {
          this.removePeer(roomId, userId, socket);
        }
      }
    });
  }

  private removePeer(roomId: string, userId: string, socket: Socket) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.peers.delete(userId);
    socket.leave(`voice:${roomId}`);

    // Notify others
    this.io.to(`voice:${roomId}`).emit('voice:peer_left', {
      odic: userId,
    });

    // Cleanup empty rooms
    if (room.peers.size === 0) {
      this.rooms.delete(roomId);
    }
  }
}

// ─── ICE Server Configuration ──────────────────────────────────────────────

function getIceServers(): RTCIceServer[] {
  return [
    // Free STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    // In production, add TURN servers for NAT traversal:
    // {
    //   urls: 'turn:turn.yourserver.com:3478',
    //   username: 'user',
    //   credential: 'pass',
    // },
  ];
}

// ─── Type Exports for Client ───────────────────────────────────────────────

export interface VoicePeerInfo {
  odic: string;
  socketId: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface VoiceJoinResult {
  success: boolean;
  error?: string;
  peers?: VoicePeerInfo[];
  iceServers?: RTCIceServer[];
}
