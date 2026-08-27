-- CreateTable
CREATE TABLE "Servant" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "loyalty" INTEGER NOT NULL DEFAULT 0,
    "task" TEXT NOT NULL DEFAULT 'idle',
    "taskStartedAt" TIMESTAMP(3),
    "taskEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Servant_characterId_key" ON "Servant"("characterId");

-- AddForeignKey
ALTER TABLE "Servant" ADD CONSTRAINT "Servant_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
