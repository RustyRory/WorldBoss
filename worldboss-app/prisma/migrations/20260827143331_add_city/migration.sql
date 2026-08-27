-- AlterTable
ALTER TABLE "GuildChannels" ADD COLUMN     "cityChannelId" TEXT;

-- CreateTable
CREATE TABLE "City" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "wood" INTEGER NOT NULL DEFAULT 0,
    "stone" INTEGER NOT NULL DEFAULT 0,
    "iron" INTEGER NOT NULL DEFAULT 0,
    "food" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConstructionJob" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "buildingType" TEXT NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completesAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConstructionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_guildId_key" ON "City"("guildId");

-- CreateIndex
CREATE UNIQUE INDEX "Building_cityId_type_key" ON "Building"("cityId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ConstructionJob_cityId_key" ON "ConstructionJob"("cityId");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructionJob" ADD CONSTRAINT "ConstructionJob_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;
