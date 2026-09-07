import assert from "node:assert/strict";
import test from "node:test";
import type { Server, Socket } from "socket.io";
import { RoomManager, type Room } from "./roomManager.js";
import { cloneRoom, type RoomStorage } from "../services/roomStorage.js";
class Storage implements RoomStorage {
  rooms = new Map<string, Room>();
  fail = false;
  async load() {
    return [...this.rooms.values()].map(cloneRoom);
  }
  async save(r: Room) {
    if (this.fail) throw new Error("injected disk failure");
    if (r.players.size) this.rooms.set(r.id, cloneRoom(r));
    else this.rooms.delete(r.id);
  }
  async qualify() {}
}
function setup(storage = new Storage()) {
  const sockets = new Map<string, Socket>();
  const events: Array<{ event: string; data: any }> = [];
  const io = {
    to: () => ({
      emit: (event: string, data: any) => events.push({ event, data }),
    }),
    sockets: { sockets },
  } as unknown as Server;
  const socket = (id: string) => {
    const s = {
      id,
      data: { user: { username: id } },
      join: () => {},
      leave: () => {},
      emit: (event: string, data: any) => events.push({ event, data }),
      disconnect: () => {},
    } as unknown as Socket;
    sockets.set(id, s);
    return s;
  };
  return { manager: new RoomManager(io, storage), storage, socket, events };
}
const config = {
  name: "Friends",
  variant: "CLASSIC",
  bootAmount: 50,
  minBuyIn: 500,
  maxBuyIn: 5000,
  maxPlayers: 6,
  isPrivate: true,
  createdBy: "a",
};
test("ready, late join, stale commands, persistence failure, replay and restart recovery", async () => {
  const x = setup();
  await x.manager.initialize();
  try {
    const room = await x.manager.createAndJoin(config, x.socket("a"), 5000);
    await x.manager.joinRoom(room.id, x.socket("b"), "b", "Bea", 5000);
    assert.equal(x.storage.rooms.get(room.id)!.gameState, undefined);
    await x.manager.setReady("a", true);
    await x.manager.setReady("b", true);
    let saved = x.storage.rooms.get(room.id)!;
    assert.equal(saved.status, "playing");
    await x.manager.joinRoom(room.id, x.socket("c"), "c", "Chris", 5000);
    assert.equal(x.storage.rooms.get(room.id)!.gameState!.players.length, 2);
    const game = saved.gameState!;
    const p = game.players[game.currentPlayerIndex];
    const command = {
      sessionId: game.sessionId,
      expectedVersion: game.version,
      commandId: "test-command",
    };
    x.storage.fail = true;
    await assert.rejects(
      x.manager.handleAction(p.odic, "pack", undefined, command),
    );
    assert.equal(x.storage.rooms.get(room.id)!.gameState!.status, "playing");
    x.storage.fail = false;
    await x.manager.handleAction(p.odic, "pack", undefined, command);
    assert.equal(x.storage.rooms.get(room.id)!.gameState!.status, "finished");
    await x.manager.handleAction(p.odic, "pack", undefined, command);
    assert.equal(x.manager.stats.settledHands, 1);
    await x.manager.setReady("a", true);
    await x.manager.setReady("b", true);
    assert.equal(x.storage.rooms.get(room.id)!.status, "waiting");
    await x.manager.setReady("c", true);
    saved = x.storage.rooms.get(room.id)!;
    assert.equal(saved.gameState!.players.length, 3);
    assert.notEqual(saved.gameState!.sessionId, game.sessionId);
    await assert.rejects(
      x.manager.handleAction(p.odic, "pack", undefined, {
        ...command,
        commandId: "stale-command",
      }),
    );
    await x.manager.handleDisconnect("b");
    await x.manager.close();
    const recovered = setup(x.storage);
    await recovered.manager.initialize();
    try {
      assert.equal(
        await recovered.manager.handleReconnect("b", recovered.socket("b-new")),
        true,
      );
      assert.equal(recovered.manager.stats.rooms, 1);
      assert.equal(
        x.storage.rooms.get(room.id)!.players.get("b")!.disconnectedAt,
        undefined,
      );
    } finally {
      await recovered.manager.close();
    }
  } finally {
    await x.manager.close();
  }
});
test("waiting-room leave removes the seat and persists an empty room", async () => {
  const x = setup();
  await x.manager.initialize();
  try {
    const r = await x.manager.createAndJoin(config, x.socket("a"), 5000);
    assert.equal((await x.manager.leaveRoom("a")).pending, false);
    assert.equal(x.storage.rooms.has(r.id), false);
  } finally {
    await x.manager.close();
  }
});
test("bots advance without human room membership", async () => {
  const x = setup();
  await x.manager.initialize();
  try {
    const room = await x.manager.quickPlay(x.socket("a"), "a", "Alice");
    let game = room.gameState!;
    if (!game.players[game.currentPlayerIndex].isBot)
      await x.manager.handleAction("a", "blind", undefined, {
        sessionId: game.sessionId,
        expectedVersion: game.version,
        commandId: "human-blind",
      });
    const before = x.storage.rooms.get(room.id)!.gameState!.version;
    await new Promise((r) => setTimeout(r, 1400));
    assert.ok(x.storage.rooms.get(room.id)!.gameState!.version > before);
  } finally {
    await x.manager.close();
  }
});
