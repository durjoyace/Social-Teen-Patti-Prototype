SET TIME ZONE 'UTC';
ALTER TABLE "User" ADD COLUMN "equippedItems" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "DailyReward" ADD COLUMN "rewardDay" DATE;
-- Historical duplicate claims remain auditable; claim dates are deduplicated going forward.
UPDATE "DailyReward" d SET "rewardDay" = (d."claimedAt" AT TIME ZONE 'UTC')::date
WHERE d.id = (SELECT d2.id FROM "DailyReward" d2 WHERE d2."userId"=d."userId" AND (d2."claimedAt" AT TIME ZONE 'UTC')::date=(d."claimedAt" AT TIME ZONE 'UTC')::date ORDER BY d2."claimedAt", d2.id LIMIT 1);
CREATE UNIQUE INDEX "DailyReward_userId_rewardDay_key" ON "DailyReward"("userId","rewardDay");
CREATE TABLE "RuntimeRoom" ("id" TEXT PRIMARY KEY,"snapshot" TEXT NOT NULL,"updatedAt" TIMESTAMP(3) NOT NULL);
CREATE TABLE "TableReservation" ("userId" TEXT PRIMARY KEY REFERENCES "User"("id"),"roomId" TEXT NOT NULL,"chips" BIGINT NOT NULL CHECK ("chips">=0));
CREATE INDEX "TableReservation_roomId_idx" ON "TableReservation"("roomId");
CREATE TABLE "HandSettlement" ("id" TEXT PRIMARY KEY,"roomId" TEXT NOT NULL,"participants" JSONB NOT NULL,"qualified" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "HandSettlement_qualified_createdAt_idx" ON "HandSettlement"("qualified","createdAt");
CREATE TABLE "AuthSession" ("id" TEXT PRIMARY KEY,"userId" TEXT NOT NULL REFERENCES "User"("id"),"refreshHash" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,"revokedAt" TIMESTAMP(3));
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
