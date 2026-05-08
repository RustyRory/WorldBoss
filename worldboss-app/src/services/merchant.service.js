'use strict';

const { Queue, Worker } = require('bullmq');
const { prisma } = require('../db/prisma');
const { ITEMS } = require('../data/items');
const { grantItem } = require('./inventory.service');
const { checkMarketAccess } = require('./market.service');

const RESET_INTERVAL_MS  = 8 * 3_600_000; // 60_000 = 1 min (test) — mettre 8 * 3_600_000 en prod
const INITIAL_GOLD       = 200;
const MIN_SLOTS          = 4;   // minimum si aucun personnage sur le serveur
const MERCHANT_NAME      = 'Aldric le Marchand';
const SHOP_PRICE_MULT   = 3;

const EQUIP_TYPES = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];

const _redisUrl = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : null;
const redisConnection = {
  host: _redisUrl?.hostname ?? process.env.REDIS_HOST ?? 'localhost',
  port: _redisUrl ? parseInt(_redisUrl.port || '6379', 10) : parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: _redisUrl?.password || process.env.REDIS_PASSWORD || undefined,
};

const shopResetQueue   = new Queue('shop-reset',   { connection: redisConnection });
const shopRefreshQueue = new Queue('shop-refresh', { connection: redisConnection });

let workerStarted = false;

// ── Tiers de richesse ─────────────────────────────────────────────────────────

function getWealthTier(gold) {
  if (gold >= 10000) return { label: 'Opulent',  emoji: '👑', color: 0xf1c40f, maxPrice: Infinity };
  if (gold >= 5000)  return { label: 'Prospère', emoji: '💎', color: 0x9b59b6, maxPrice: 1200 };
  if (gold >= 2000)  return { label: 'Aisé',     emoji: '💰', color: 0x3498db, maxPrice: 450  };
  if (gold >= 500)   return { label: 'Modeste',  emoji: '🪙', color: 0x95a5a6, maxPrice: 200  };
  return                     { label: 'Démuni',   emoji: '💸', color: 0x7f8c8d, maxPrice: 100  };
}

// ── Génération du stock ───────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const EQUIP_TYPE_ORDER = ['weapon', 'armor', 'helmet', 'boots', 'accessory'];

// Retourne le stock acheté et l'or dépensé.
// Slots totaux = nombre de personnages sur le serveur (min MIN_SLOTS).
// Achat alterné : 1 équipement (rotation des types) / 1 consommable.
async function generateStock(merchantGold, guildId) {
  const charCount  = await prisma.character.count({ where: { guildId } });
  const totalSlots = Math.max(MIN_SLOTS, charCount);
  const equipSlots = Math.ceil(totalSlots / 2);
  const consSlots  = Math.floor(totalSlots / 2);

  let budget = merchantGold;

  // Pools par type d'équipement (items abordables, mélangés)
  const poolsByType = {};
  for (const type of EQUIP_TYPE_ORDER) {
    poolsByType[type] = shuffle(
      Object.values(ITEMS).filter((i) => i.type === type && i.price > 0 && i.price <= budget),
    );
  }
  let poolCons = shuffle(
    Object.values(ITEMS).filter((i) => i.type === 'consumable' && i.price > 0 && i.price <= budget),
  );

  const stock = [];
  let typeIdx    = 0;
  let equipCount = 0;
  let consCount  = 0;

  // Achat alterné : 1 équipement + 1 consommable jusqu'à remplir les slots ou épuiser le budget
  while (equipCount < equipSlots || consCount < consSlots) {
    // ── 1 équipement (rotation des types) ───────────────────────────────────
    if (equipCount < equipSlots) {
      let added = false;
      for (let t = 0; t < EQUIP_TYPE_ORDER.length; t++) {
        const type = EQUIP_TYPE_ORDER[(typeIdx + t) % EQUIP_TYPE_ORDER.length];
        const pool = poolsByType[type];
        const idx  = pool.findIndex((i) => i.price <= budget);
        if (idx !== -1) {
          const item = pool.splice(idx, 1)[0];
          stock.push({ itemId: item.id, available: true });
          budget -= item.price;
          equipCount++;
          typeIdx = (EQUIP_TYPE_ORDER.indexOf(type) + 1) % EQUIP_TYPE_ORDER.length;
          added = true;
          break;
        }
      }
      if (!added) break; // plus aucun équipement abordable
    }

    // ── 1 consommable ────────────────────────────────────────────────────────
    if (consCount < consSlots) {
      const idx = poolCons.findIndex((i) => i.price <= budget);
      if (idx !== -1) {
        const item = poolCons.splice(idx, 1)[0];
        stock.push({ itemId: item.id, available: true });
        budget -= item.price;
        consCount++;
      }
    }

    // Si plus rien n'est achetable, on sort
    const nothingLeft =
      EQUIP_TYPE_ORDER.every((t) => poolsByType[t].every((i) => i.price > budget)) &&
      poolCons.every((i) => i.price > budget);
    if (nothingLeft) break;
  }

  const goldSpent = merchantGold - budget;
  return { stock, goldSpent, totalSlots };
}

// ── Accès au channel market ───────────────────────────────────────────────────

async function getMarketChannel(guildId, discordClient) {
  const channels = await prisma.guildChannels.findUnique({ where: { guildId } });
  if (!channels?.marketChannelId) return null;
  return discordClient.channels.fetch(channels.marketChannelId).catch(() => null);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function itemEmoji(rarity) {
  return { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠' }[rarity] ?? '⚪';
}

function itemTypeFr(type) {
  return { weapon: 'Arme', armor: 'Armure', helmet: 'Casque', boots: 'Bottes', accessory: 'Accessoire', consumable: 'Consommable' }[type] ?? type;
}

function typeEmoji(type) {
  return { weapon: '⚔️', armor: '🛡️', helmet: '🪖', boots: '👢', accessory: '💍', consumable: '🧪' }[type] ?? '📦';
}

// ── Construction de l'embed boutique ─────────────────────────────────────────

function buildShopEmbed(shop) {
  const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
  } = require('discord.js');

  const stock = JSON.parse(shop.stockJson);
  const tier  = getWealthTier(shop.gold);

  const equipSlots = stock.filter((s) => {
    const item = ITEMS[s.itemId];
    return item && EQUIP_TYPES.includes(item.type);
  });
  const consSlots = stock.filter((s) => {
    const item = ITEMS[s.itemId];
    return item && item.type === 'consumable';
  });

  const availableEquip = equipSlots.filter((s) => s.available);
  const availableCons  = consSlots.filter((s) => s.available);

  const resetTs = Math.floor(new Date(shop.resetAt).getTime() / 1000);
  const SEP = '┄'.repeat(28);

  function fmtSlot(slot) {
    const item = ITEMS[slot.itemId];
    if (!item) return null;
    const shopPrice = item.price * SHOP_PRICE_MULT;
    const lvl    = item.levelRequired > 1 ? ` · Niv. ${item.levelRequired}` : '';
    const prefix = `${typeEmoji(item.type)} ${itemEmoji(item.rarity)} **${item.name}** *(${itemTypeFr(item.type)}${lvl})*`;
    const plain  = `${typeEmoji(item.type)} ${itemEmoji(item.rarity)} ${item.name} (${itemTypeFr(item.type)}${lvl})`;
    return slot.available
      ? `${prefix} — **${shopPrice}** 🪙`
      : `~~${plain} — ${shopPrice} 🪙~~`;
  }

  // Tous les items triés : équipements par type puis consommables
  const TYPE_ORDER_ALL = [...EQUIP_TYPE_ORDER, 'consumable'];
  const allSorted = [...stock].sort(
    (a, b) => TYPE_ORDER_ALL.indexOf(ITEMS[a.itemId]?.type) - TYPE_ORDER_ALL.indexOf(ITEMS[b.itemId]?.type),
  );

  const totalAvailable = stock.filter((s) => s.available).length;
  const allText = allSorted.map(fmtSlot).filter(Boolean).join('\n') || '*Vide*';

  const embed = new EmbedBuilder()
    .setTitle(`🏪 ${MERCHANT_NAME}`)
    .setDescription(
      `${tier.emoji} **Trésor :** ${shop.gold.toLocaleString('fr-FR')} 🪙 *(${tier.label})*\n` +
      `⏳ **Renouvellement** <t:${resetTs}:R> *(le <t:${resetTs}:f>)*\n` +
      `\`${SEP}\``,
    )
    .setColor(tier.color)
    .addFields({
      name: `🛒 Stock (${totalAvailable}/${stock.length} disponible${stock.length > 1 ? 's' : ''})`,
      value: allText,
      inline: false,
    })
    .setFooter({ text: 'WorldBoss Market · Boutique du Marchand' })
    .setTimestamp();

  const rows = [];

  const availableAll = allSorted.filter((s) => s.available);
  if (availableAll.length > 0) {
    const options = availableAll.slice(0, 25).map((slot) => {
      const item = ITEMS[slot.itemId];
      const lvl  = item.levelRequired > 1 ? ` · Niv. ${item.levelRequired}` : '';
      return new StringSelectMenuOptionBuilder()
        .setLabel(`${typeEmoji(item.type)} ${itemEmoji(item.rarity)} ${item.name}`)
        .setValue(slot.itemId)
        .setDescription(`${item.price * SHOP_PRICE_MULT} 🪙 · ${itemTypeFr(item.type)}${lvl}`);
    });
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('shop_buy')
          .setPlaceholder('🛒 Acheter un item...')
          .addOptions(options),
      ),
    );
  } else {
    embed.addFields({ name: '🚫 Stock épuisé', value: '*Le marchand attend le prochain renouvellement pour se réapprovisionner.*', inline: false });
  }

  return { embed, rows };
}

// ── Poster / rafraîchir l'embed dans le channel ───────────────────────────────

async function postShopMessage(guildId, discordClient, shop) {
  const channel = await getMarketChannel(guildId, discordClient);
  if (!channel) return null;

  const { embed, rows } = buildShopEmbed(shop);
  const msg = await channel.send({ embeds: [embed], components: rows });

  await msg.pin().catch(() => {});

  await prisma.merchantShop.update({ where: { guildId }, data: { messageId: msg.id } });
  return msg;
}

async function refreshShopEmbed(guildId, discordClient) {
  try {
    const shop = await prisma.merchantShop.findUnique({ where: { guildId } });
    if (!shop?.messageId) return;

    const channel = await getMarketChannel(guildId, discordClient);
    if (!channel) return;

    const msg = await channel.messages.fetch(shop.messageId).catch(() => null);
    if (!msg) return;

    const { embed, rows } = buildShopEmbed(shop);
    await msg.edit({ embeds: [embed], components: rows });
  } catch (err) {
    console.error('[Merchant] refreshShopEmbed:', err.message);
  }
}

// ── Création / récupération de la boutique ────────────────────────────────────

async function getOrCreateShop(guildId, discordClient) {
  let shop = await prisma.merchantShop.findUnique({ where: { guildId } });

  if (!shop) {
    const { stock, goldSpent } = await generateStock(INITIAL_GOLD, guildId);
    const resetAt = new Date(Date.now() + RESET_INTERVAL_MS);
    shop = await prisma.merchantShop.create({
      data: { guildId, gold: INITIAL_GOLD - goldSpent, stockJson: JSON.stringify(stock), resetAt },
    });
    if (discordClient) await postShopMessage(guildId, discordClient, shop);
    await scheduleReset(guildId, RESET_INTERVAL_MS);
  }

  return shop;
}

// ── Reset de la boutique (toutes les 8h) ─────────────────────────────────────

async function resetShop(guildId, discordClient) {
  const shop = await prisma.merchantShop.findUnique({ where: { guildId } });

  // Les invendus sont rachetés au prix de base (le marchand récupère sa mise)
  let merchantGold = Math.max(0, shop?.gold ?? INITIAL_GOLD);
  if (shop?.stockJson) {
    const unsold    = JSON.parse(shop.stockJson).filter((s) => s.available);
    const recovered = unsold.reduce((sum, s) => sum + (ITEMS[s.itemId]?.price ?? 0), 0);
    merchantGold   += recovered;
    if (recovered > 0) console.log(`[Merchant] ${guildId} — invendus récupérés : +${recovered} 🪙`);
  }

  // Prix du moins cher de tous les items disponibles
  const cheapestPrice = Math.min(
    ...Object.values(ITEMS).filter((i) => i.price > 0).map((i) => i.price),
  );

  // Si le marchand ne peut même plus acheter l'item le moins cher → renflouement
  if (merchantGold < cheapestPrice) {
    console.log(`[Merchant] ${guildId} — économie bloquée (${merchantGold} 🪙 < ${cheapestPrice} 🪙), renflouement à ${INITIAL_GOLD} 🪙`);
    merchantGold = INITIAL_GOLD;
  }

  // Supprimer l'ancien message épinglé
  if (shop?.messageId && discordClient) {
    const channel = await getMarketChannel(guildId, discordClient);
    if (channel) {
      const old = await channel.messages.fetch(shop.messageId).catch(() => null);
      if (old) {
        await old.unpin().catch(() => {});
        await old.delete().catch(() => {});
      }
    }
  }

  const { stock: newStock, goldSpent } = await generateStock(merchantGold, guildId);
  const goldAfter = merchantGold - goldSpent;
  const resetAt   = new Date(Date.now() + RESET_INTERVAL_MS);

  const updated = await prisma.merchantShop.upsert({
    where:  { guildId },
    update: { gold: goldAfter, stockJson: JSON.stringify(newStock), resetAt, messageId: null },
    create: { guildId, gold: goldAfter, stockJson: JSON.stringify(newStock), resetAt },
  });

  if (discordClient) await postShopMessage(guildId, discordClient, updated);

  await scheduleReset(guildId, RESET_INTERVAL_MS);

  console.log(`[Merchant] Boutique renouvelée pour guild ${guildId} — or du marchand: ${merchantGold}`);
}

// ── Restauration au démarrage du bot ─────────────────────────────────────────

async function restoreMerchantShops(discordClient) {
  const shops = await prisma.merchantShop.findMany();
  const now   = Date.now();

  for (const shop of shops) {
    const remaining = new Date(shop.resetAt).getTime() - now;
    if (remaining <= 0) {
      await resetShop(shop.guildId, discordClient).catch((err) =>
        console.error(`[Merchant] resetShop on restore (${shop.guildId}):`, err.message),
      );
    } else {
      await scheduleReset(shop.guildId, remaining);
    }
  }
}

async function scheduleReset(guildId, delayMs) {
  await shopResetQueue.add(
    'reset',
    { guildId },
    { delay: delayMs, jobId: `shop-reset-${guildId}`, removeOnComplete: true, removeOnFail: true },
  );
}

// ── Achat au marchand ─────────────────────────────────────────────────────────

async function buyFromShop(characterId, itemId, guildId, discordClient) {
  const access = await checkMarketAccess(characterId);
  if (!access.ok) return { success: false, message: access.message };

  const shop = await prisma.merchantShop.findUnique({ where: { guildId } });
  if (!shop) return { success: false, message: 'La boutique n\'est pas disponible.' };

  const stock = JSON.parse(shop.stockJson);
  const slot  = stock.find((s) => s.itemId === itemId && s.available);
  if (!slot) return { success: false, message: 'Cet item n\'est plus disponible en boutique.' };

  const itemDef = ITEMS[itemId];
  if (!itemDef) return { success: false, message: 'Item inconnu.' };

  const shopPrice = itemDef.price * SHOP_PRICE_MULT;

  const character = await prisma.character.findUnique({ where: { id: characterId }, select: { gold: true } });
  if (!character || character.gold < shopPrice) {
    return { success: false, message: `Or insuffisant. Il te faut **${shopPrice}** 🪙 (tu as **${character?.gold ?? 0}** 🪙).` };
  }

  // Marquer l'item comme vendu
  slot.available = false;

  await prisma.$transaction([
    prisma.character.update({
      where: { id: characterId },
      data:  { gold: { decrement: shopPrice } },
    }),
    prisma.merchantShop.update({
      where: { guildId },
      data:  { gold: { increment: shopPrice }, stockJson: JSON.stringify(stock) },
    }),
  ]);

  await grantItem(characterId, itemId, 1);

  // Mettre à jour l'embed boutique
  if (discordClient) await refreshShopEmbed(guildId, discordClient);

  return {
    success: true,
    message: `**${itemDef.name}** acheté pour **${shopPrice}** 🪙 !`,
  };
}

// ── Worker BullMQ ─────────────────────────────────────────────────────────────

function startMerchantWorker(discordClient) {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    'shop-reset',
    async (job) => {
      await resetShop(job.data.guildId, discordClient);
    },
    { connection: redisConnection },
  );

  new Worker(
    'shop-refresh',
    async (job) => {
      await refreshShopEmbed(job.data.guildId, discordClient);
    },
    { connection: redisConnection },
  );
}

module.exports = {
  startMerchantWorker,
  getOrCreateShop,
  resetShop,
  restoreMerchantShops,
  buyFromShop,
  refreshShopEmbed,
};
