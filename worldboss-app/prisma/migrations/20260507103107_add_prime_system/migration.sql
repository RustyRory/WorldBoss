-- CreateTable
CREATE TABLE "PrimeRun" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "primeId" INTEGER NOT NULL,
    "leaderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'recruiting',
    "messageId" TEXT,
    "channelId" TEXT,
    "roomIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrimeRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrimeParticipant" (
    "id" SERIAL NOT NULL,
    "primeRunId" INTEGER NOT NULL,
    "characterId" INTEGER NOT NULL,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrimeParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrimeParticipant_primeRunId_characterId_key" ON "PrimeParticipant"("primeRunId", "characterId");

-- AddForeignKey
ALTER TABLE "PrimeParticipant" ADD CONSTRAINT "PrimeParticipant_primeRunId_fkey" FOREIGN KEY ("primeRunId") REFERENCES "PrimeRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrimeParticipant" ADD CONSTRAINT "PrimeParticipant_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
