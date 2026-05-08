'use strict';

const { prisma } = require('../db/prisma');
const { getCombatState, setCombatState, deleteCombatState, deleteDungeonState, getDungeonState, setDungeonState } = require('../cache/redis');
const { resolveTurn } = require('../engines/combatEngine');
const { applyLoot } = require('../engines/lootEngine');
const { addXp, addGold, computeRegenedHp } = require('./player.service');
const { computeStats, xpRequired } = require('../utils/stats');
const { buildCombatEmbed, buildCombatRow, buildDungeonNextRow, errorEmbed } = require('../utils/embed');
const { animateCombatLogs, sleep, animateXpGain } = require('../utils/animate');
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { DUNGEONS } = require('../data/dungeons');

/**
 * Build combat state from character + list of enemies.
 * Uses the character's current HP (with regen applied).
 */
function buildCombatState({ characterId, guildId, messageId, channelId, character, loadout, enemies, allies = [], dungeonChapter, currentRoom, totalRooms, replayMode = false }) {
  const stats = computeStats(character, loadout);
  const maxHp = stats.hp;
  const currentHp = computeRegenedHp(character.hp, character.hpUpdatedAt, maxHp);

  return {
    characterId,
    guildId,
    messageId,
    channelId,
    dungeonChapter: dungeonChapter ?? null,
    currentRoom: currentRoom ?? null,
    totalRooms: totalRooms ?? null,
    player: {
      hp: currentHp,
      maxHp,
      atk: stats.atk,
      def: stats.def,
      spd: stats.spd,
      crit: stats.crit,
      critMult: stats.critMult,
      consumables: [],
      activeSkills:  stats.activeSkills  ?? [],
      activePassives: stats.activePassives ?? [],
      skillCooldowns: {}, // { skillKey: turnsRemaining }
      usedOnceSkills: [],
      buffs: [],
      dots: [],
    },
    allies: allies.map((a) => ({ ...a })),
    enemies: enemies.map((e) => ({
      id: e.id,
      name: e.name,
      hp: e.hp,
      maxHp: e.maxHp ?? e.hp,
      atk: e.atk,
      def: e.def,
      spd: e.spd,
      ability: e.ability ?? null,
      stunned: false,
      xp: e.xp ?? 0,
      gold: e.gold ?? null,
      loot: e.loot ?? [],
    })),
    turn: 1,
    log: [],
    status: 'active',
    replayMode,
  };
}

async function handleCombatButton(interaction) {
  const userId  = interaction.user.id;
  const guildId = interaction.guildId;

  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId, guildId } },
    select: { id: true },
  });
  if (!character) {
    return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
  }

  const characterId = character.id;
  const state = await getCombatState(characterId);

  if (!state || state.status !== 'active') {
    return interaction.reply({ embeds: [errorEmbed('Aucun combat en cours.')], flags: MessageFlags.Ephemeral });
  }
  if (state.characterId !== characterId) {
    return interaction.reply({ embeds: [errorEmbed('Ce combat ne vous appartient pas.')], flags: MessageFlags.Ephemeral });
  }

  await interaction.deferUpdate();

  // Parse action and optional target index from customId e.g. "combat_attack:1"
  const raw = interaction.customId.replace('combat_', '');
  const colonIdx = raw.indexOf(':');
  const action      = colonIdx !== -1 ? raw.substring(0, colonIdx) : raw;
  const targetIndex = colonIdx !== -1 ? parseInt(raw.substring(colonIdx + 1), 10) : 0;

  // Snapshot consumable quantities before turn to detect usage
  const consumablesBefore = (state.player.consumables ?? []).map((c) => ({ ...c }));

  const result    = resolveTurn(state, action, targetIndex);
  const newLogs   = result.logs;
  const frames    = result.frames;
  const snap      = result.initialSnapshot;
  const prevLog   = [...state.log];

  // preAnimState: post-turn HP values but pre-turn HP from snapshot for animation
  const preAnimState = {
    ...state,
    log: prevLog,
    player:  { ...state.player,  ...snap && { hp: snap.playerHp } },
    enemies: state.enemies.map((e, i) => ({ ...e, hp: snap?.enemiesHp[i] ?? e.hp })),
    allies:  (state.allies ?? []).map((a, i) => ({ ...a, hp: snap?.alliesHp?.[i] ?? a.hp })),
  };

  state.player  = result.playerState;
  state.enemies = result.enemiesState;
  state.allies  = result.alliesState ?? state.allies ?? [];
  state.log     = [...prevLog, ...newLogs];
  state.turn   += 1;

  // Sync consumed items to DB (skip infiniteUse items)
  for (const before of consumablesBefore) {
    const after = state.player.consumables?.find((c) => c.itemId === before.itemId);
    const usedQty = before.quantity - (after?.quantity ?? 0);
    if (usedQty > 0 && !before.infiniteUse) {
      const { ITEMS } = require('../data/items');
      if (ITEMS[before.itemId]?.infiniteUse) continue;
      const charItem = await prisma.characterItem.findUnique({
        where: { characterId_itemId: { characterId, itemId: before.itemId } },
      });
      if (charItem) {
        const newQty = charItem.quantity - usedQty;
        if (newQty <= 0) {
          await prisma.characterItem.delete({ where: { characterId_itemId: { characterId, itemId: before.itemId } } });
        } else {
          await prisma.characterItem.update({
            where: { characterId_itemId: { characterId, itemId: before.itemId } },
            data: { quantity: newQty },
          });
        }
      }
    }
  }

  // ── FLEE ──────────────────────────────────────────────────────────────────
  if (result.fled) {
    state.status = 'fled';
    await deleteCombatState(characterId);
    await deleteDungeonState(characterId);
    await prisma.character.update({
      where: { id: characterId },
      data: { hp: Math.max(1, state.player.hp), hpUpdatedAt: new Date() },
    });
    await prisma.dungeonRun.updateMany({
      where: { characterId, chapter: state.dungeonChapter, status: 'active' },
      data: { status: 'failed' },
    });

    const embed = new EmbedBuilder()
      .setTitle('🏃 Fuite réussie !')
      .setDescription(`Vous quittez les catacombes avec **${Math.max(1, state.player.hp)} HP** restants.\n\n*Votre progression est perdue.*`)
      .setColor(0xf39c12);
    return interaction.editReply({ embeds: [embed], components: [] });
  }

  // ── PLAYER DIED ───────────────────────────────────────────────────────────
  if (result.playerDied) {
    state.status = 'defeat';
    await deleteCombatState(characterId);
    await deleteDungeonState(characterId);
    await prisma.character.update({ where: { id: characterId }, data: { hp: 1, hpUpdatedAt: new Date() } });
    await prisma.dungeonRun.updateMany({
      where: { characterId, chapter: state.dungeonChapter, status: 'active' },
      data: { status: 'failed' },
    });

    const defeatEmbed = new EmbedBuilder()
      .setTitle('💀 Défaite')
      .setDescription('*Vous vous réveillez à l\'entrée avec 1 HP...*')
      .setColor(0x2c2c2c);

    await animateCombatLogs((p) => interaction.editReply(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
    await sleep(600);
    return interaction.editReply({ embeds: [defeatEmbed], components: [] });
  }

  // ── ALL ENEMIES DEAD (room cleared) ───────────────────────────────────────
  if (result.allEnemiesDead) {
    state.status = 'victory';
    await deleteCombatState(characterId);

    const totalXp   = state.enemies.reduce((sum, e) => sum + (e.xp ?? 0), 0);
    const roomGold  = state.enemies.reduce((sum, e) => {
      if (!e.gold) return sum;
      return sum + Math.floor(Math.random() * (e.gold.max - e.gold.min + 1)) + e.gold.min;
    }, 0);
    const { xp: startXp, level: startLevel } = await prisma.character.findUnique({
      where:  { id: characterId },
      select: { xp: true, level: true },
    });
    const xpResult = await addXp(characterId, totalXp);

    const levelUpText = xpResult.leveledUp
      ? `\n🎉 **Level Up !** Niveau **${xpResult.newLevel}** !`
      : '';

    // ── Dungeon context ──────────────────────────────────────────────────────
    if (state.dungeonChapter) {
      const dungeonState = await getDungeonState(characterId);
      const isLastRoom   = state.currentRoom >= state.totalRooms;

      if (isLastRoom) {
        // ── DUNGEON COMPLETE ────────────────────────────────────────────────
        // Accumulate all enemies fought (current room + previous rooms)
        const allEnemiesFought = [...(dungeonState?.enemiesFought ?? []), ...state.enemies.map((e) => e.id)];

        await deleteDungeonState(characterId);
        await prisma.dungeonRun.updateMany({
          where: { characterId, chapter: state.dungeonChapter, status: 'active' },
          data: { status: 'completed' },
        });

        // Dungeon-specific gold override (e.g. dungeon 3 has its own goldRange)
        const dungeon = DUNGEONS[state.dungeonChapter];
        let finalGold = roomGold;
        if (dungeon?.reward?.gold) {
          const { min, max } = dungeon.reward.gold;
          finalGold = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        await addGold(characterId, finalGold);

        // Loot lottery (désactivé en rejeu)
        const droppedNames = [];
        if (!state.replayMode) {
          const { ENEMIES } = require('../data/enemies');
          const { ITEMS } = require('../data/items');
          const pool = [];
          for (const enemyId of allEnemiesFought) {
            const enemyDef = ENEMIES[enemyId];
            if (!enemyDef?.loot?.length) continue;
            pool.push(enemyDef.loot[Math.floor(Math.random() * enemyDef.loot.length)]);
          }
          if (pool.length > 0) {
            const itemId = pool[Math.floor(Math.random() * pool.length)];
            await applyLoot(prisma, characterId, itemId);
            droppedNames.push(ITEMS[itemId]?.name ?? itemId);
          }
        }

        // Si level up, addXp a déjà mis les HP à fond — ne pas écraser
        if (!xpResult.leveledUp) {
          await prisma.character.update({
            where: { id: characterId },
            data: { hp: state.player.hp, hpUpdatedAt: new Date() },
          });
        }

        const { baseStats, computeStats } = require('../utils/stats');
        const finalChar  = await prisma.character.findUnique({ where: { id: characterId }, include: { loadout: true } });
        const finalMaxHp = computeStats(finalChar, finalChar.loadout ?? {}).hp;
        const finalHp    = finalChar.hp;

        const lootLines  = droppedNames.map((n) => `> 🎁 **${n}**`).join('\n');
        const specialMsg = !state.replayMode ? (dungeon?.reward?.message ?? null) : null;

        const buildVictoryEmbed = (xpBarLine) => new EmbedBuilder()
          .setTitle('🏆 Donjon terminé !')
          .setDescription(
            (specialMsg ? specialMsg + '\n\n' : '') +
            `+**${totalXp}** XP${levelUpText}\n\n` +
            `**Récompenses**\n` +
            `> 🪙 **${finalGold}** or\n` +
            (lootLines ? lootLines + '\n' : '') +
            (state.replayMode ? `> *Mode rejeu — items désactivés*\n` : '') +
            `\n> \`${xpBarLine}\`\n` +
            `\n*Vous ressortez avec ${finalHp}/${finalMaxHp} HP.*`,
          )
          .setColor(0xf1c40f);

        await animateCombatLogs((p) => interaction.editReply(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
        await sleep(600);
        await interaction.editReply({ embeds: [buildVictoryEmbed(`${'▱'.repeat(12)} 0/${xpRequired(xpResult.leveledUp ? xpResult.newLevel : startLevel)} XP`)], components: [] });
        return animateXpGain((p) => interaction.editReply(p), buildVictoryEmbed, startXp, startLevel, xpResult, xpRequired);

      } else {
        // ── NEXT ROOM ───────────────────────────────────────────────────────
        await addGold(characterId, roomGold);

        let newHp, newMaxHp, healDesc;
        if (xpResult.leveledUp) {
          const afterLvl = await prisma.character.findUnique({ where: { id: characterId }, include: { loadout: true } });
          const { computeStats } = require('../utils/stats');
          newMaxHp = computeStats(afterLvl, afterLvl.loadout ?? {}).hp;
          newHp    = afterLvl.hp;
          healDesc = `✨ Level up — HP restaurés à **${newHp}/${newMaxHp}** !`;
        } else if (state.replayMode) {
          // Rejeu : pas de heal entre les salles
          newMaxHp = state.player.maxHp;
          newHp    = state.player.hp;
          healDesc = `*Mode rejeu — pas de soin entre les salles.*`;
          await prisma.character.update({
            where: { id: characterId },
            data: { hp: newHp, hpUpdatedAt: new Date() },
          });
        } else {
          // Heal 15% maxHp entre les salles
          const healAmt = Math.max(5, Math.floor(state.player.maxHp * 0.15));
          newMaxHp = state.player.maxHp;
          newHp    = Math.min(newMaxHp, state.player.hp + healAmt);
          healDesc = `💚 Vous récupérez **${healAmt}** HP.`;
          await prisma.character.update({
            where: { id: characterId },
            data: { hp: newHp, hpUpdatedAt: new Date() },
          });
        }

        // Advance dungeon room, track enemies fought
        if (dungeonState) {
          dungeonState.currentRoom   = state.currentRoom + 1;
          dungeonState.enemiesFought = [...(dungeonState.enemiesFought ?? []), ...state.enemies.map((e) => e.id)];
          await setDungeonState(characterId, dungeonState);
        }

        const buildNextRoomEmbed = (xpBarLine) => new EmbedBuilder()
          .setTitle(`✅ Salle ${state.currentRoom}/${state.totalRooms} terminée !`)
          .setDescription(
            `+**${totalXp}** XP${levelUpText}\n` +
            (roomGold > 0 ? `+**${roomGold}** 🪙\n` : '') +
            `\n${healDesc}\n` +
            `❤️ HP : **${newHp}/${newMaxHp}**\n\n` +
            `> \`${xpBarLine}\``,
          )
          .setColor(0x2ecc71);

        await animateCombatLogs((p) => interaction.editReply(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
        await sleep(600);
        await interaction.editReply({ embeds: [buildNextRoomEmbed(`${'▱'.repeat(12)} 0/${xpRequired(xpResult.leveledUp ? xpResult.newLevel : startLevel)} XP`)], components: [] });
        return animateXpGain((p) => interaction.editReply(p), buildNextRoomEmbed, startXp, startLevel, xpResult, xpRequired, [buildDungeonNextRow('Salle suivante ➡️')]);
      }
    }

    // ── Standalone fight (no dungeon context) ────────────────────────────────
    if (!xpResult.leveledUp) {
      await prisma.character.update({
        where: { id: characterId },
        data: { hp: state.player.hp, hpUpdatedAt: new Date() },
      });
    }
    const buildStandaloneEmbed = (xpBarLine) => new EmbedBuilder()
      .setTitle('🏆 Victoire !')
      .setDescription(`+**${totalXp}** XP${levelUpText}\n\n> \`${xpBarLine}\``)
      .setColor(0x2ecc71);

    await animateCombatLogs((p) => interaction.editReply(p), preAnimState, newLogs, frames, buildCombatEmbed, []);
    await sleep(600);
    await interaction.editReply({ embeds: [buildStandaloneEmbed(`${'▱'.repeat(12)} 0/${xpRequired(xpResult.leveledUp ? xpResult.newLevel : startLevel)} XP`)], components: [] });
    return animateXpGain((p) => interaction.editReply(p), buildStandaloneEmbed, startXp, startLevel, xpResult, xpRequired);
  }

  // ── ONGOING ───────────────────────────────────────────────────────────────
  await setCombatState(characterId, state);
  await animateCombatLogs(
    (p) => interaction.editReply(p),
    preAnimState,
    newLogs,
    frames,
    buildCombatEmbed,
    buildCombatRow(state),
  );
}

module.exports = { buildCombatState, handleCombatButton };
