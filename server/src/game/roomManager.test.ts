import assert from 'node:assert/strict';
import test from 'node:test';
import type { Server, Socket } from 'socket.io';
import { RoomManager } from './roomManager.js';

function createFakeSocket(id: string): Socket {
  return {
    id,
    join: () => undefined,
    leave: () => undefined,
    emit: () => true,
  } as unknown as Socket;
}

function createFakeServer() {
  const sockets = new Map<string, Socket>();
  const io = {
    to: () => ({ emit: () => undefined }),
    sockets: { sockets },
  } as unknown as Server;
  return { io, sockets };
}

test('a disconnected current player remains eligible for timeout and reconnect does not revive folded state', async () => {
  const { io, sockets } = createFakeServer();
  const manager = new RoomManager(io);
  const firstSocket = createFakeSocket('socket-1');
  const secondSocket = createFakeSocket('socket-2');
  sockets.set(firstSocket.id, firstSocket);
  sockets.set(secondSocket.id, secondSocket);

  const room = manager.createRoom({
    name: 'Disconnect test',
    variant: 'CLASSIC',
    bootAmount: 50,
    minBuyIn: 500,
    maxBuyIn: 5000,
    maxPlayers: 2,
    isPrivate: true,
    createdBy: 'user-1',
  });

  try {
    manager.joinRoom(room.id, firstSocket, 'user-1', 'First', 5000);
    manager.joinRoom(room.id, secondSocket, 'user-2', 'Second', 5000);
    await new Promise<void>(resolve => queueMicrotask(resolve));

    const gameState = room.gameState;
    assert.ok(gameState);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const currentSocket = currentPlayer.odic === 'user-1' ? firstSocket : secondSocket;

    manager.handleDisconnect(currentSocket.id);

    assert.equal(currentPlayer.status, 'playing');
    assert.equal(typeof currentPlayer.disconnectedAt, 'number');
    assert.equal(manager.isPlayerInRoom(room.id, currentPlayer.odic), true);

    currentPlayer.status = 'folded';
    const reconnectSocket = createFakeSocket('socket-reconnected');
    sockets.set(reconnectSocket.id, reconnectSocket);
    assert.equal(manager.handleReconnect(currentPlayer.odic, reconnectSocket), true);
    assert.equal(currentPlayer.status, 'folded');
    assert.equal(currentPlayer.disconnectedAt, undefined);
  } finally {
    (manager as unknown as { cleanupRoom(roomToClean: unknown): void }).cleanupRoom(room);
  }
});
