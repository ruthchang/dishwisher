CREATE TABLE IF NOT EXISTS "CuisineWish" (
 "id" TEXT PRIMARY KEY,
 "ownerId" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "cuisine" TEXT NOT NULL,
 "friendName" TEXT NOT NULL,
 "friendEmail" TEXT,
 "notes" TEXT NOT NULL DEFAULT '',
 "triedDishIds" JSONB NOT NULL DEFAULT '[]'::jsonb,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "CuisineWish_ownerId_idx" ON "CuisineWish"("ownerId");
