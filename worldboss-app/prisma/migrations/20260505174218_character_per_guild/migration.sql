-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "hp" INTEGER NOT NULL DEFAULT 120,
    "actionPoints" INTEGER NOT NULL DEFAULT 10,
    "actionPointsUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "statsJson" JSONB NOT NULL DEFAULT '{}',
    "skillJson" JSONB,
    "effectJson" JSONB,
    "price" INTEGER NOT NULL DEFAULT 0,
    "levelRequired" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterItem" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CharacterItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loadout" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "weaponId" TEXT,
    "armorId" TEXT,
    "helmetId" TEXT,
    "bootsId" TEXT,
    "accessory1Id" TEXT,
    "accessory2Id" TEXT,

    CONSTRAINT "Loadout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonRun" (
    "id" SERIAL NOT NULL,
    "characterId" INTEGER NOT NULL,
    "chapter" INTEGER NOT NULL,
    "currentRoom" INTEGER NOT NULL DEFAULT 1,
    "totalRooms" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lootJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DungeonRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildChannels" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "categoryId" TEXT,
    "infoChannelId" TEXT,
    "generalChannelId" TEXT,
    "dungeonChannelId" TEXT,
    "marketChannelId" TEXT,

    CONSTRAINT "GuildChannels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketListing" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "startPrice" INTEGER NOT NULL,
    "buyoutPrice" INTEGER,
    "currentBid" INTEGER,
    "bidderId" INTEGER,
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_userId_guildId_key" ON "Character"("userId", "guildId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterItem_characterId_itemId_key" ON "CharacterItem"("characterId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Loadout_characterId_key" ON "Loadout"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "GuildChannels_guildId_key" ON "GuildChannels"("guildId");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterItem" ADD CONSTRAINT "CharacterItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loadout" ADD CONSTRAINT "Loadout_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonRun" ADD CONSTRAINT "DungeonRun_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuildChannels" ADD CONSTRAINT "GuildChannels_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
