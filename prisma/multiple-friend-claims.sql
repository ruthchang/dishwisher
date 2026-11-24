BEGIN;
ALTER TABLE "FriendProfile" DROP CONSTRAINT IF EXISTS "FriendProfile_claimedUserId_key";
DROP INDEX IF EXISTS "FriendProfile_claimedUserId_key";
CREATE INDEX IF NOT EXISTS "FriendProfile_claimedUserId_idx" ON "FriendProfile"("claimedUserId");
COMMIT;
