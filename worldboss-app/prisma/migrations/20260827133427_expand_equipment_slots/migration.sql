/*
  Warnings:

  - You are about to drop the column `accessory1Id` on the `Loadout` table. All the data in the column will be lost.
  - You are about to drop the column `accessory2Id` on the `Loadout` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Loadout" DROP COLUMN "accessory1Id",
DROP COLUMN "accessory2Id",
ADD COLUMN     "amuletId" TEXT,
ADD COLUMN     "beltId" TEXT,
ADD COLUMN     "glovesId" TEXT,
ADD COLUMN     "ring1Id" TEXT,
ADD COLUMN     "ring2Id" TEXT,
ADD COLUMN     "shieldId" TEXT;
