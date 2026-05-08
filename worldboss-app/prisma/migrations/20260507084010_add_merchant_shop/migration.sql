-- CreateTable
CREATE TABLE "MerchantShop" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "gold" INTEGER NOT NULL DEFAULT 5000,
    "stockJson" TEXT NOT NULL DEFAULT '[]',
    "messageId" TEXT,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantShop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantShop_guildId_key" ON "MerchantShop"("guildId");

-- AddForeignKey
ALTER TABLE "MerchantShop" ADD CONSTRAINT "MerchantShop_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
