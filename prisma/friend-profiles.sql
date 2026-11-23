-- Additive migration: run against a backed-up Postgres database, after review.
ALTER TABLE "Dish" ADD COLUMN IF NOT EXISTS "cuisine" TEXT;
CREATE TABLE IF NOT EXISTS "FriendProfile" (
 "id" TEXT PRIMARY KEY, "displayName" TEXT NOT NULL, "email" TEXT,
 "createdById" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "claimedUserId" TEXT UNIQUE REFERENCES "User"("id") ON DELETE SET NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "claimedAt" TIMESTAMP(3)
);
CREATE INDEX IF NOT EXISTS "FriendProfile_createdById_idx" ON "FriendProfile"("createdById");
CREATE TABLE IF NOT EXISTS "FriendRating" (
 "id" TEXT PRIMARY KEY, "friendProfileId" TEXT NOT NULL REFERENCES "FriendProfile"("id") ON DELETE CASCADE,
 "dishId" TEXT NOT NULL REFERENCES "Dish"("id") ON DELETE CASCADE,
 "value" DOUBLE PRECISION, "enteredById" TEXT NOT NULL,
 "confirmedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "FriendRating_friendProfileId_dishId_key" UNIQUE ("friendProfileId","dishId"),
 CONSTRAINT "FriendRating_value_check" CHECK ("value" IS NULL OR ("value" >= 1 AND "value" <= 5))
);
CREATE TABLE IF NOT EXISTS "FriendInvitation" (
 "id" TEXT PRIMARY KEY, "friendProfileId" TEXT NOT NULL REFERENCES "FriendProfile"("id") ON DELETE CASCADE,
 "email" TEXT NOT NULL, "tokenHash" TEXT NOT NULL UNIQUE,
 "expiresAt" TIMESTAMP(3) NOT NULL, "acceptedAt" TIMESTAMP(3),
 "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "FriendInvitation_friendProfileId_idx" ON "FriendInvitation"("friendProfileId");
ALTER TABLE "DishWish" ADD COLUMN IF NOT EXISTS "friendProfileId" TEXT REFERENCES "FriendProfile"("id") ON DELETE SET NULL;
ALTER TABLE "CuisineWish" ADD COLUMN IF NOT EXISTS "friendProfileId" TEXT REFERENCES "FriendProfile"("id") ON DELETE SET NULL;
-- Legacy cuisine wish names/emails are retained. Backfill requires owner-scoped
-- identity reconciliation; do not merge people merely because names match.
