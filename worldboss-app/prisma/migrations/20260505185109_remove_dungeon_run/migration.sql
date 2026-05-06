/*
  Warnings:

  - You are about to drop the `DungeonRun` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DungeonRun" DROP CONSTRAINT "DungeonRun_characterId_fkey";

-- DropTable
DROP TABLE "DungeonRun";
