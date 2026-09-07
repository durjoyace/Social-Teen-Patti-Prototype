import assert from "node:assert/strict";
import test from "node:test";
import bcrypt from "bcryptjs";
import { claimDailyReward } from "./dailyReward.js";
import {
  issueSession,
  rotateSession,
  sessionActive,
  exchangeLegacyAccess,
} from "./authSessions.js";
import { equipReward } from "./referralService.js";
import { RoomManager } from "../game/roomManager.js";
import { PostgresRoomStorage } from "./roomStorage.js";
import type { Server, Socket } from "socket.io";
import { verifyToken, generateToken } from "../middleware/auth.js";
import { prisma } from "../config/database.js";
import {
  AccountDeletionError,
  deleteAccount,
  deletedUsername,
} from "./accountDeletion.js";
import {
  attributeReferral,
  ensureReferralCode,
  getReferralSummary,
  qualifyReferralForGame,
  redeemBeliReward,
} from "./referralService.js";

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL);
if (
  hasTestDatabase &&
  (process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL ||
    !new URL(process.env.TEST_DATABASE_URL!).pathname.includes("test"))
)
  throw new Error(
    "Integration tests require matching DATABASE_URL and TEST_DATABASE_URL targeting a test database",
  );

async function cleanDatabase() {
  await prisma.authSession.deleteMany();
  await prisma.tableReservation.deleteMany();
  await prisma.runtimeRoom.deleteMany();
  await prisma.handSettlement.deleteMany();
  await prisma.dailyReward.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.beliTransaction.deleteMany();
  await prisma.rewardEntitlement.deleteMany();
  await prisma.referralShare.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.paymentReceipt.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
}

test(
  "account deletion requires the password and scrubs identity plus social content",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const password = "correct-horse-battery-staple";
    const account = await prisma.user.create({
      data: {
        username: "delete_integration",
        email: "delete@example.com",
        phone: "+15555550100",
        passwordHash: await bcrypt.hash(password, 4),
        avatarUrl: "https://example.com/avatar.png",
        adultConfirmedAt: new Date(),
      },
    });
    const other = await prisma.user.create({
      data: { username: "delete_other" },
    });
    await prisma.friendship.create({
      data: { requesterId: account.id, receiverId: other.id },
    });
    await prisma.chatMessage.create({
      data: { userId: account.id, content: "personal message" },
    });
    await prisma.gift.create({
      data: {
        senderId: account.id,
        receiverId: other.id,
        giftType: "emoji",
        message: "personal note",
      },
    });

    await assert.rejects(
      () => deleteAccount(account.id, "wrong-password"),
      (error: unknown) =>
        error instanceof AccountDeletionError && error.statusCode === 403,
    );

    await deleteAccount(account.id, password);
    const deleted = await prisma.user.findUniqueOrThrow({
      where: { id: account.id },
    });
    assert.equal(deleted.username, deletedUsername(account.id));
    assert.equal(deleted.email, null);
    assert.equal(deleted.phone, null);
    assert.equal(deleted.passwordHash, null);
    assert.equal(deleted.avatarUrl, null);
    assert.equal(deleted.adultConfirmedAt, null);
    assert.equal(deleted.isBanned, true);
    assert.equal(deleted.banReason, "account_deleted");
    assert.equal(
      await prisma.friendship.count({ where: { requesterId: account.id } }),
      0,
    );
    assert.equal(
      (
        await prisma.chatMessage.findFirstOrThrow({
          where: { userId: account.id },
        })
      ).content,
      "[deleted]",
    );
    assert.equal(
      (await prisma.gift.findFirstOrThrow({ where: { senderId: account.id } }))
        .message,
      null,
    );

    await cleanDatabase();
  },
);

test(
  "referral activation is multiplayer-only, double-sided, and idempotent",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const inviter = await prisma.user.create({
      data: { username: "integration_inviter" },
    });
    const invitee = await prisma.user.create({
      data: { username: "integration_invitee" },
    });
    const other = await prisma.user.create({
      data: { username: "integration_other" },
    });
    const code = await ensureReferralCode(inviter.id);

    const attribution = await attributeReferral(invitee.id, code, {
      source: "integration",
      campaign: "test",
      deviceId: "invitee-device",
      ip: "127.0.0.2",
    });
    assert.equal(attribution.attributed, true);

    const botOnly = await qualifyReferralForGame(invitee.id, "bot-session", [
      invitee.id,
    ]);
    assert.equal(botOnly.rewarded, false);

    const rewarded = await qualifyReferralForGame(invitee.id, "human-session", [
      invitee.id,
      other.id,
    ]);
    assert.equal(rewarded.rewarded, true);
    assert.equal(rewarded.inviteeBalance, 100);
    assert.equal(rewarded.inviterBalance, 100);
    assert.equal(rewarded.milestone?.beli, 50);

    const duplicate = await qualifyReferralForGame(
      invitee.id,
      "second-session",
      [invitee.id, other.id],
    );
    assert.equal(duplicate.rewarded, false);

    const summary = await getReferralSummary(inviter.id);
    assert.equal(summary.beliBalance, 150);
    assert.deepEqual(summary.stats, { invited: 1, pending: 0, activated: 1 });

    const duplicateDeviceInvitee = await prisma.user.create({
      data: { username: "integration_duplicate_device" },
    });
    const duplicateAttribution = await attributeReferral(
      duplicateDeviceInvitee.id,
      code,
      {
        deviceId: "invitee-device",
        ip: "127.0.0.3",
      },
    );
    assert.equal(duplicateAttribution.attributed, true);
    const blocked = await qualifyReferralForGame(
      duplicateDeviceInvitee.id,
      "duplicate-device-session",
      [duplicateDeviceInvitee.id, other.id],
    );
    assert.deepEqual(blocked, { rewarded: false, reason: "risk_review" });

    const ipVelocityInvitees = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        prisma.user.create({ data: { username: `integration_ip_${index}` } }),
      ),
    );
    for (const [index, ipInvitee] of ipVelocityInvitees.entries()) {
      const ipAttribution = await attributeReferral(ipInvitee.id, code, {
        deviceId: `ip-device-${index}`,
        ip: "192.0.2.5",
      });
      assert.equal(ipAttribution.attributed, true);
    }
    const ipBlocked = await qualifyReferralForGame(
      ipVelocityInvitees[3].id,
      "ip-velocity-session",
      [ipVelocityInvitees[3].id, other.id],
    );
    assert.deepEqual(ipBlocked, { rewarded: false, reason: "risk_review" });

    const redemption = await redeemBeliReward(inviter.id, "dhol-reaction");
    assert.equal(redemption.beliBalance, 0);
    await assert.rejects(
      () => redeemBeliReward(inviter.id, "dhol-reaction"),
      /already owned/i,
    );

    await cleanDatabase();
    await prisma.$disconnect();
  },
);

test(
  "concurrent daily claims credit once with correct UTC date and ledger balances",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const u = await prisma.user.create({
      data: { username: "daily_race", chips: 1000n },
    });
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        claimDailyReward(u.id, new Date("2026-09-07T23:59:59.000Z")),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const ledger = await prisma.transaction.findMany({
      where: { userId: u.id, type: "DAILY_REWARD" },
    });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].balanceBefore, 1000n);
    assert.equal(ledger[0].balanceAfter, 1500n);
    const next = await claimDailyReward(
      u.id,
      new Date("2026-09-08T00:00:00.000Z"),
    );
    assert.equal(next.streak, 2);
    assert.equal(next.amount, 750);
    await cleanDatabase();
  },
);

test(
  "reservations survive restart, settle exactly once and cash out the final stack",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const users = await Promise.all(
      ["durable_a", "durable_b"].map((username) =>
        prisma.user.create({ data: { username, chips: 10000n } }),
      ),
    );
    const sockets = new Map<string, Socket>();
    const socket = (i: number) => {
      const u = users[i];
      const s = {
        id: u.id,
        data: { user: u },
        join: () => {},
        leave: () => {},
        emit: () => true,
        disconnect: () => {},
      } as unknown as Socket;
      sockets.set(s.id, s);
      return s;
    };
    const io = {
      to: () => ({ emit: () => {} }),
      sockets: { sockets },
    } as unknown as Server;
    let manager = new RoomManager(io);
    await manager.initialize();
    try {
      const room = await manager.createAndJoin(
        {
          name: "Durable",
          variant: "CLASSIC",
          bootAmount: 50,
          minBuyIn: 500,
          maxBuyIn: 5000,
          maxPlayers: 6,
          isPrivate: true,
          createdBy: users[0].id,
        },
        socket(0),
        5000,
      );
      await manager.joinRoom(
        room.id,
        socket(1),
        users[1].id,
        users[1].username,
        5000,
      );
      assert.equal(
        (await prisma.user.findUniqueOrThrow({ where: { id: users[0].id } }))
          .chips,
        5000n,
      );
      await manager.setReady(users[0].id, true);
      await manager.setReady(users[1].id, true);
      const storage = new PostgresRoomStorage();
      let saved = (await storage.load())[0];
      const firstHand = saved.gameState!;
      await manager.close();
      manager = new RoomManager(io);
      await manager.initialize();
      await manager.handleReconnect(users[0].id, socket(0));
      await manager.handleReconnect(users[1].id, socket(1));
      const p = firstHand.players[firstHand.currentPlayerIndex];
      const command = {
        sessionId: firstHand.sessionId,
        expectedVersion: firstHand.version,
        commandId: "durable-pack",
      };
      await manager.handleAction(p.odic, "pack", undefined, command);
      await manager.handleAction(p.odic, "pack", undefined, command);
      assert.equal(await prisma.handSettlement.count(), 1);
      assert.ok((await prisma.handSettlement.findFirstOrThrow()).result);
      assert.equal(
        await prisma.transaction.count({
          where: { referenceId: firstHand.sessionId },
        }),
        2,
      );
      assert.equal(
        (await prisma.user.findUniqueOrThrow({ where: { id: p.odic } }))
          .totalGames,
        1,
      );
      const reservations = await prisma.tableReservation.findMany();
      assert.equal(
        reservations.reduce((s, p) => s + p.chips, 0n),
        10000n,
      );
      saved = (await storage.load())[0];
      await storage.save(saved);
      assert.equal(await prisma.handSettlement.count(), 1);
      const cipher = await prisma.runtimeRoom.findFirstOrThrow();
      assert.ok(!cipher.snapshot.includes("cards"));
      assert.ok(!cipher.snapshot.includes(users[0].id));
      await manager.leaveRoom(users[0].id);
      await manager.leaveRoom(users[1].id);
      assert.equal(await prisma.tableReservation.count(), 0);
      assert.equal(await prisma.runtimeRoom.count(), 0);
      const balances = await prisma.user.findMany();
      assert.equal(
        balances.reduce((s, u) => s + u.chips, 0n),
        20000n,
      );
    } finally {
      await manager.close();
      await cleanDatabase();
    }
  },
);

test(
  "refresh rotation rejects replay and only owned cosmetic items may be equipped",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const u = await prisma.user.create({
      data: { username: "session_user", beliBalance: 1000 },
    });
    const original = await issueSession({
      userId: u.id,
      username: u.username,
      isGuest: true,
    });
    const rotated = await rotateSession(original.refreshToken);
    assert.equal(await sessionActive(verifyToken(rotated.token)), true);
    await assert.rejects(rotateSession(original.refreshToken));
    assert.equal(await sessionActive(verifyToken(rotated.token)), false);
    const legacy = generateToken({
      userId: u.id,
      username: u.username,
      isGuest: true,
    });
    const exchanged = await exchangeLegacyAccess(legacy);
    assert.equal(await sessionActive(verifyToken(exchanged.token)), true);
    await assert.rejects(exchangeLegacyAccess(legacy));
    await assert.rejects(equipReward(u.id, "saffron-frame"));
    await redeemBeliReward(u.id, "saffron-frame");
    assert.equal(
      (await equipReward(u.id, "saffron-frame")).equippedItems.AVATAR_FRAME,
      "saffron-frame",
    );
    assert.deepEqual(
      (await equipReward(u.id, "saffron-frame", false)).equippedItems,
      {},
    );
    await cleanDatabase();
  },
);

test(
  "HTTP and Socket.IO journey: guests, invite, ready, hidden cards, hand, replay, cash-out",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const { app, httpServer, roomManager } = await import("../index.js");
    const { io: connect } = await import("socket.io-client");
    const { requestAck } = await import(
      "../../../packages/shared/src/rules/protocol.js"
    );
    await roomManager.initialize();
    await new Promise<void>((resolve) =>
      httpServer.listen(0, "127.0.0.1", resolve),
    );
    const address = httpServer.address() as { port: number };
    const url = `http://127.0.0.1:${address.port}`;
    const clients: ReturnType<typeof connect>[] = [];
    const states = new Map<string, any>();
    try {
      const accounts = [];
      for (const username of ["journey_host", "journey_friend"]) {
        const response = await fetch(`${url}/api/auth/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, adultConfirmed: true }),
        });
        assert.equal(response.status, 201);
        accounts.push((await response.json()) as any);
      }
      for (const path of [
        "transactions?page=-1",
        "transactions?limit=0",
        "leaderboard?period=WEEKLY",
      ]) {
        const response = await fetch(`${url}/api/users/${path}`, {
          headers: { Authorization: `Bearer ${accounts[0].token}` },
        });
        assert.equal(response.status, 400);
      }
      const invalidFriendAction = await fetch(
        `${url}/api/users/friends/missing`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accounts[0].token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "typo" }),
        },
      );
      assert.equal(invalidFriendAction.status, 400);
      for (const account of accounts) {
        const client = connect(url, {
          auth: { token: account.token },
          transports: ["websocket"],
          forceNew: true,
        });
        clients.push(client);
        client.on("game:state", (state) => states.set(account.user.id, state));
        await new Promise<void>((resolve, reject) => {
          client.once("connect", resolve);
          client.once("connect_error", reject);
        });
      }
      assert.deepEqual(await requestAck(clients[0], "room:list"), {
        rooms: [],
      });
      const created = await requestAck<any>(clients[0], "room:create", {
        name: "Journey table",
        variant: "CLASSIC",
        bootAmount: 50,
        minBuyIn: 500,
        maxBuyIn: 5000,
        maxPlayers: 6,
        isPrivate: true,
        buyIn: 5000,
      });
      assert.equal(created.success, true);
      assert.equal(
        (
          await requestAck<any>(clients[1], "room:join_by_code", {
            code: created.room.roomCode,
          })
        ).success,
        true,
      );
      assert.equal(states.size, 0);
      await requestAck(clients[0], "room:ready", { ready: true });
      await requestAck(clients[1], "room:ready", { ready: true });
      for (let i = 0; i < 100 && states.size < 2; i++)
        await new Promise((r) => setTimeout(r, 10));
      assert.equal(states.size, 2);
      for (const state of states.values()) {
        assert.ok(state.viewerPlayerId);
        assert.ok(state.players.every((p: any) => !p.cards && !p.handResult));
      }
      let state = states.get(accounts[0].user.id);
      await requestAck(clients[0], "game:action", {
        action: "see_cards",
        sessionId: state.sessionId,
        expectedVersion: state.version,
        commandId: "journey-see",
      });
      state = states.get(accounts[0].user.id);
      assert.equal(
        state.players.find((p: any) => p.id === state.viewerPlayerId).cards
          .length,
        3,
      );
      for (
        let i = 0;
        i < 100 && [...states.values()].some((s) => s.version < 1);
        i++
      )
        await new Promise((r) => setTimeout(r, 10));
      const turnIndex = accounts.findIndex((a) =>
        states.get(a.user.id).availableActions.includes("pack"),
      );
      state = states.get(accounts[turnIndex].user.id);
      const command = {
        action: "pack",
        sessionId: state.sessionId,
        expectedVersion: state.version,
        commandId: "journey-pack",
      };
      assert.equal(
        (await requestAck<any>(clients[turnIndex], "game:action", command))
          .success,
        true,
      );
      assert.equal(
        (await requestAck<any>(clients[turnIndex], "game:action", command))
          .success,
        true,
      );
      assert.equal(await prisma.handSettlement.count(), 1);
      assert.equal(states.get(accounts[0].user.id).status, "finished");
      await requestAck(clients[0], "room:ready", { ready: true });
      await requestAck(clients[1], "room:ready", { ready: true });
      assert.notEqual(
        states.get(accounts[1].user.id).sessionId,
        command.sessionId,
      );
      await requestAck(clients[0], "room:leave");
      await requestAck(clients[1], "room:leave");
      assert.equal(await prisma.tableReservation.count(), 0);
      assert.equal(await prisma.runtimeRoom.count(), 0);
      const total = await prisma.user.aggregate({ _sum: { chips: true } });
      assert.equal(total._sum.chips, 20000n);
    } finally {
      for (const client of clients) client.disconnect();
      await roomManager.close();
      await new Promise<void>((resolve) => app.get("io").close(resolve));
      await cleanDatabase();
    }
  },
);

test(
  "four concurrent tables complete three hands each without cross-table chip changes",
  { skip: !hasTestDatabase },
  async () => {
    await cleanDatabase();
    const users = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        prisma.user.create({ data: { username: `load_${i}`, chips: 10000n } }),
      ),
    );
    const io = {
      to: () => ({ emit: () => {} }),
      sockets: { sockets: new Map() },
    } as unknown as Server;
    const manager = new RoomManager(io);
    const storage = new PostgresRoomStorage();
    await manager.initialize();
    const durations: number[] = [];
    const timed = async <T>(work: () => Promise<T>) => {
      const start = performance.now();
      const result = await work();
      durations.push(performance.now() - start);
      return result;
    };
    const socket = (i: number) =>
      ({
        id: users[i].id,
        data: { user: users[i] },
        join: () => {},
        leave: () => {},
        emit: () => {},
        disconnect: () => {},
      }) as unknown as Socket;
    try {
      await Promise.all(
        Array.from({ length: 4 }, (_, i) =>
          timed(async () => {
            const room = await manager.createAndJoin(
              {
                name: `Load ${i}`,
                variant: "CLASSIC",
                bootAmount: 50,
                minBuyIn: 500,
                maxBuyIn: 5000,
                maxPlayers: 6,
                isPrivate: true,
                createdBy: users[i * 2].id,
              },
              socket(i * 2),
              5000,
            );
            await manager.joinRoom(
              room.id,
              socket(i * 2 + 1),
              users[i * 2 + 1].id,
              users[i * 2 + 1].username,
              5000,
            );
          }),
        ),
      );
      for (let hand = 0; hand < 3; hand++) {
        await Promise.all(
          users.map((u) => timed(() => manager.setReady(u.id, true))),
        );
        await Promise.all(
          (await storage.load()).map((room) =>
            timed(() => {
              const game = room.gameState!;
              return manager.handleAction(
                game.players[game.currentPlayerIndex].odic,
                "pack",
                undefined,
                {
                  sessionId: game.sessionId,
                  expectedVersion: game.version,
                  commandId: `load-pack-${hand}`,
                },
              );
            }),
          ),
        );
      }
      assert.equal(await prisma.handSettlement.count(), 12);
      await Promise.all(users.map((u) => manager.leaveRoom(u.id)));
      assert.equal(
        (await prisma.user.aggregate({ _sum: { chips: true } }))._sum.chips,
        80000n,
      );
      assert.equal(await prisma.tableReservation.count(), 0);
      durations.sort((a, b) => a - b);
      console.log(
        JSON.stringify({
          type: "local_concurrency_result",
          tables: 4,
          players: 8,
          hands: 12,
          samples: durations.length,
          p95Ms: Math.round(durations[Math.floor(durations.length * 0.95)]),
        }),
      );
    } finally {
      await manager.close();
      await cleanDatabase();
    }
  },
);
