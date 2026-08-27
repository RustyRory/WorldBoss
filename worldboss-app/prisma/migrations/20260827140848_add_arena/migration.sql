-- AlterTable
ALTER TABLE "GuildChannels" ADD COLUMN     "arenaChannelId" TEXT;

-- CreateTable
CREATE TABLE "ArenaProfile" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "lastMatchAt" TIMESTAMP(3),

    CONSTRAINT "ArenaProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArenaMatch" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "characterAId" INTEGER NOT NULL,
    "characterBId" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "ranked" BOOLEAN NOT NULL DEFAULT true,
    "eloDeltaA" INTEGER NOT NULL DEFAULT 0,
    "eloDeltaB" INTEGER NOT NULL DEFAULT 0,
    "logJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArenaMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArenaProfile_characterId_key" ON "ArenaProfile"("characterId");

-- AddForeignKey
ALTER TABLE "ArenaProfile" ADD CONSTRAINT "ArenaProfile_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaMatch" ADD CONSTRAINT "ArenaMatch_characterAId_fkey" FOREIGN KEY ("characterAId") REFERENCES "ArenaProfile"("characterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArenaMatch" ADD CONSTRAINT "ArenaMatch_characterBId_fkey" FOREIGN KEY ("characterBId") REFERENCES "ArenaProfile"("characterId") ON DELETE CASCADE ON UPDATE CASCADE;
