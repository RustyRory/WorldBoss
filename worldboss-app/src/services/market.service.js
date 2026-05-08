'use strict';

const { Queue, Worker } = require('bullmq');
const { prisma } = require('../db/prisma');
const { ITEMS } = require('../data/items');
const { consumeAP } = require('./actionPoints.service');
const { grantItem } = require('./inventory.service');

const MERCHANT_RATE  = 0.1;
const MARKET_MIN_LVL = 3;
const MARKET_UNLOCK_DUNGEON = 3;

async function checkMarketAccess(characterId) {
  const [character, completedDungeon] = await Promise.all([
    prisma.character.findUnique({ where: { id: characterId }, select: { level: true } }),
    prisma.dungeonRun.findFirst({ where: { characterId, chapter: MARKET_UNLOCK_DUNGEON, status: 'completed' } }),
  ]);
  const level = character?.level ?? 0;
  if (level < MARKET_MIN_LVL) return { ok: false, message: `Le marché est accessible à partir du **niveau ${MARKET_MIN_LVL}**.` };
  if (!completedDungeon) return { ok: false, message: `Le marché est verrouillé. Complétez **Les Routes Infestées** (donjon 3) pour y accéder.` };
  return { ok: true };
}

const redisConnection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? undefined,
};

const auctionQueue   = new Queue('auction-expiry',  { connection: redisConnection });
const auctionRefresh = new Queue('auction-refresh', { connection: redisConnection });

let workerStarted = false;

function startAuctionWorker(discordClient) {
  if (workerStarted) return;
  workerStarted = true;

  new Worker(
    'auction-expiry',
    async (job) => { await finaliseAuction(job.data.listingId, discordClient); },
    { connection: redisConnection },
  );

  new Worker(
    'auction-refresh',
    async (job) => {
      const listing = await prisma.marketListing.findUnique({ where: { id: job.data.listingId } });
      if (listing?.status === 'active') await refreshAuctionEmbed(listing, discordClient);
    },
    { connection: redisConnection },
  );
}

async function getMarketChannel(guildId, discordClient) {
  const channels = await prisma.guildChannels.findUnique({ where: { guildId } });
  if (!channels?.marketChannelId) return null;
  return discordClient.channels.fetch(channels.marketChannelId).catch(() => null);
}

function itemEmoji(rarity) {
  return { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠' }[rarity] ?? '⚪';
}

function formatDuration(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h${m > 0 ? `${m}m` : ''}`;
  return `${m}m`;
}

// ── Vente marchant ────────────────────────────────────────────────────────────

async function sellToMerchant(characterId, itemId, guildId, discordClient) {
  const access = await checkMarketAccess(characterId);
  if (!access.ok) return { success: false, message: access.message };

  const itemDef = ITEMS[itemId];
  if (!itemDef) return { success: false, message: `Item **${itemId}** inconnu.` };

  const charItem = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId } },
  });
  if (!charItem || charItem.quantity < 1) {
    return { success: false, message: `Tu ne possèdes pas **${itemDef.name}**.` };
  }

  const ap = await consumeAP(characterId, 'sell');
  if (!ap.success) {
    const minutes = Math.ceil(ap.msUntilNext / 60000);
    return {
      success: false,
      message: `Plus de points d'action (**${ap.currentAP}/10** PA).\nProchain PA dans **${minutes} min**.`,
    };
  }

  const goldEarned = Math.max(1, Math.floor(itemDef.price * MERCHANT_RATE));

  await prisma.$transaction([
    charItem.quantity > 1
      ? prisma.characterItem.update({
          where: { characterId_itemId: { characterId, itemId } },
          data: { quantity: { decrement: 1 } },
        })
      : prisma.characterItem.delete({ where: { characterId_itemId: { characterId, itemId } } }),
    prisma.character.update({ where: { id: characterId }, data: { gold: { increment: goldEarned } } }),
  ]);

  // Le marchand paie ce qu'il rachète — son or diminue
  await prisma.$executeRaw`
    UPDATE "MerchantShop"
    SET gold = GREATEST(gold - ${goldEarned}, 0)
    WHERE "guildId" = ${guildId}
  `;

  return { success: true, message: `**${itemDef.name}** vendu pour **${goldEarned}** 🪙`, goldEarned };
}

// ── Création d'enchère ────────────────────────────────────────────────────────

const DURATIONS_MS = {
  '1h':  1 * 3_600_000,
  '6h':  6 * 3_600_000,
  '24h': 24 * 3_600_000,
};

async function createAuction(characterId, itemId, guildId, startPrice, buyoutPrice, durationKey, discordClient) {
  const access = await checkMarketAccess(characterId);
  if (!access.ok) return { success: false, message: access.message };
  const itemDef = ITEMS[itemId];
  if (!itemDef) return { success: false, message: `Item **${itemId}** inconnu.` };

  const durationMs = DURATIONS_MS[durationKey];
  if (!durationMs) return { success: false, message: 'Durée invalide.' };

  const charItem = await prisma.characterItem.findUnique({
    where: { characterId_itemId: { characterId, itemId } },
  });
  if (!charItem || charItem.quantity < 1) {
    return { success: false, message: `Tu ne possèdes pas **${itemDef.name}**.` };
  }

  if (charItem.quantity > 1) {
    await prisma.characterItem.update({
      where: { characterId_itemId: { characterId, itemId } },
      data: { quantity: { decrement: 1 } },
    });
  } else {
    await prisma.characterItem.delete({ where: { characterId_itemId: { characterId, itemId } } });
  }

  const expiresAt = new Date(Date.now() + durationMs);

  const listing = await prisma.marketListing.create({
    data: { guildId, sellerId: characterId, itemId, quantity: 1, type: 'auction', startPrice, buyoutPrice: buyoutPrice ?? null, expiresAt, status: 'active' },
  });

  const seller = await prisma.character.findUnique({
    where: { id: characterId },
    include: { user: { select: { username: true } } },
  });

  const channel = await getMarketChannel(guildId, discordClient);
  if (channel) {
    const { embed, row } = buildAuctionEmbed(listing, itemDef, characterId, seller?.user.username, null);
    const msg = await channel.send({ embeds: [embed], components: [row] });
    await prisma.marketListing.update({ where: { id: listing.id }, data: { messageId: msg.id } });
    listing.messageId = msg.id;
  }

  await auctionQueue.add('expire', { listingId: listing.id }, { delay: durationMs, jobId: `auction-expire-${listing.id}` });

  const refreshIntervalMs = durationMs <= 3_600_000 ? 5 * 60_000
    : durationMs <= 6 * 3_600_000 ? 30 * 60_000
    : 60 * 60_000;

  const refreshCount = Math.floor(durationMs / refreshIntervalMs) - 1;
  for (let i = 1; i <= refreshCount; i++) {
    await auctionRefresh.add('refresh', { listingId: listing.id }, { delay: i * refreshIntervalMs, jobId: `auction-refresh-${listing.id}-${i}` });
  }

  return { success: true, listing };
}

// ── Enchère ───────────────────────────────────────────────────────────────────

async function placeBid(characterId, listingId, amount, discordClient) {
  const access = await checkMarketAccess(characterId);
  if (!access.ok) return { success: false, message: access.message };

  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== 'active') {
    return { success: false, message: "Cette enchère n'est plus active." };
  }
  if (listing.sellerId === characterId) {
    return { success: false, message: 'Tu ne peux pas enchérir sur ton propre item.' };
  }
  if (listing.expiresAt && new Date() > listing.expiresAt) {
    await finaliseAuction(listingId, discordClient);
    return { success: false, message: "L'enchère vient d'expirer." };
  }

  const minBid = (listing.currentBid ?? listing.startPrice - 1) + 1;
  if (amount < minBid) {
    return { success: false, message: `L'enchère minimale est de **${minBid}** 🪙.` };
  }

  const bidder = await prisma.character.findUnique({ where: { id: characterId }, select: { gold: true } });
  if (!bidder || bidder.gold < amount) {
    return { success: false, message: "Tu n'as pas assez d'or." };
  }

  if (listing.bidderId && listing.currentBid) {
    await prisma.character.update({
      where: { id: listing.bidderId },
      data: { gold: { increment: listing.currentBid } },
    });
  }

  await prisma.character.update({ where: { id: characterId }, data: { gold: { decrement: amount } } });

  const updated = await prisma.marketListing.update({
    where: { id: listingId },
    data: { currentBid: amount, bidderId: characterId },
  });

  await refreshAuctionEmbed(updated, discordClient);

  if (listing.buyoutPrice && amount >= listing.buyoutPrice) {
    return finaliseBuyout(characterId, listingId, discordClient, true);
  }

  return { success: true, message: `Enchère de **${amount}** 🪙 placée !` };
}

// ── Achat direct ──────────────────────────────────────────────────────────────

async function finaliseBuyout(characterId, listingId, discordClient, fromBid = false) {
  if (!fromBid) {
    const access = await checkMarketAccess(characterId);
    if (!access.ok) return { success: false, message: access.message };
  }
  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== 'active') {
    return { success: false, message: "Cette enchère n'est plus disponible." };
  }
  if (listing.expiresAt && new Date() > listing.expiresAt) {
    await finaliseAuction(listingId, discordClient);
    return { success: false, message: "L'enchère vient d'expirer." };
  }
  if (!listing.buyoutPrice) {
    return { success: false, message: "Pas de prix d'achat direct sur cette enchère." };
  }
  if (listing.sellerId === characterId) {
    return { success: false, message: 'Tu ne peux pas acheter ton propre item.' };
  }

  if (!fromBid) {
    const buyer = await prisma.character.findUnique({ where: { id: characterId }, select: { gold: true } });
    if (!buyer || buyer.gold < listing.buyoutPrice) {
      return { success: false, message: "Tu n'as pas assez d'or." };
    }
    if (listing.bidderId && listing.currentBid) {
      await prisma.character.update({
        where: { id: listing.bidderId },
        data: { gold: { increment: listing.currentBid } },
      });
    }
    await prisma.character.update({ where: { id: characterId }, data: { gold: { decrement: listing.buyoutPrice } } });
  }

  await transferListing(listing, characterId, listing.buyoutPrice, 'sold', discordClient);

  await consumeAP(listing.sellerId, 'sell').catch(() => {});
  await consumeAP(characterId, 'sell').catch(() => {});

  return { success: true, message: `Item acheté pour **${listing.buyoutPrice}** 🪙 !` };
}

// ── Finalisation enchère expirée ──────────────────────────────────────────────

async function finaliseAuction(listingId, discordClient) {
  const listing = await prisma.marketListing.findUnique({ where: { id: listingId } });
  if (!listing || listing.status !== 'active') return;

  if (listing.bidderId && listing.currentBid) {
    await transferListing(listing, listing.bidderId, listing.currentBid, 'sold', discordClient);
    await consumeAP(listing.sellerId, 'sell').catch(() => {});
    await consumeAP(listing.bidderId, 'sell').catch(() => {});
  } else {
    await grantItem(listing.sellerId, listing.itemId, 1);
    await prisma.marketListing.update({ where: { id: listingId }, data: { status: 'expired' } });
    await refreshAuctionEmbed({ ...listing, status: 'expired' }, discordClient);
  }
}

async function transferListing(listing, buyerCharacterId, price, status, discordClient) {
  await prisma.$transaction([
    prisma.marketListing.update({ where: { id: listing.id }, data: { status, bidderId: buyerCharacterId } }),
    prisma.character.update({ where: { id: listing.sellerId }, data: { gold: { increment: price } } }),
  ]);
  await grantItem(buyerCharacterId, listing.itemId, 1);
  await refreshAuctionEmbed({ ...listing, status, bidderId: buyerCharacterId, currentBid: price }, discordClient);
}

// ── Embed enchère ─────────────────────────────────────────────────────────────

function buildAuctionEmbed(listing, itemDef, sellerId, sellerName, bidderName) {
  const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const SEP = '┄'.repeat(28);

  const isActive  = listing.status === 'active';
  const isSold    = listing.status === 'sold';

  const color = isActive ? 0xf39c12 : isSold ? 0x2ecc71 : 0x95a5a6;

  const expiresTimestamp = listing.expiresAt
    ? Math.floor(new Date(listing.expiresAt).getTime() / 1000)
    : null;

  const statusLine = isActive && expiresTimestamp
    ? `> ⏳ Expire <t:${expiresTimestamp}:R>`
    : isActive
      ? '> ⏳ En cours'
      : isSold
      ? `> ✅ Vendu à **${bidderName ?? 'un joueur'}** pour **${listing.currentBid}** 🪙`
      : '> ❌ Expirée — aucune enchère';

  const embed = new EmbedBuilder()
    .setTitle(`🔨 Enchère — ${itemEmoji(itemDef.rarity)} ${itemDef.name}`)
    .setDescription(
      `> Vendeur : **${sellerName ?? sellerId}**\n` +
      statusLine + '\n' +
      `\`${SEP}\``,
    )
    .setColor(color)
    .addFields(
      {
        name: '📦 Item',
        value: [`> ${itemEmoji(itemDef.rarity)} **${itemDef.name}**`, `> Type : ${itemDef.type} · Rareté : ${itemDef.rarity}`].join('\n'),
        inline: true,
      },
      {
        name: '💰 Prix',
        value: [
          `> Départ : **${listing.startPrice}** 🪙`,
          listing.buyoutPrice ? `> Achat direct : **${listing.buyoutPrice}** 🪙` : '> Achat direct : *—*',
          `> Enchère actuelle : **${listing.currentBid ?? '—'}** 🪙`,
        ].join('\n'),
        inline: true,
      },
    )
    .setFooter({ text: `WorldBoss Market · Enchère #${listing.id}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`market_bid:${listing.id}`)
      .setLabel('Enchérir')
      .setEmoji('📈')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!isActive),
    new ButtonBuilder()
      .setCustomId(`market_buyout:${listing.id}`)
      .setLabel('Acheter directement')
      .setEmoji('🛒')
      .setStyle(ButtonStyle.Success)
      .setDisabled(!isActive || !listing.buyoutPrice),
  );

  return { embed, row };
}

async function refreshAuctionEmbed(listing, discordClient) {
  try {
    const channels = await prisma.guildChannels.findUnique({ where: { guildId: listing.guildId } });
    if (!channels?.marketChannelId || !listing.messageId) return;

    const channel = await discordClient.channels.fetch(channels.marketChannelId).catch(() => null);
    if (!channel) return;

    const msg = await channel.messages.fetch(listing.messageId).catch(() => null);
    if (!msg) return;

    const itemDef = ITEMS[listing.itemId];
    const seller  = await prisma.character.findUnique({
      where: { id: listing.sellerId },
      include: { user: { select: { username: true } } },
    });
    const bidder  = listing.bidderId
      ? await prisma.character.findUnique({
          where: { id: listing.bidderId },
          include: { user: { select: { username: true } } },
        })
      : null;

    const { embed, row } = buildAuctionEmbed(
      listing, itemDef, listing.sellerId,
      seller?.user.username, bidder?.user.username,
    );
    await msg.edit({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[Market] refreshAuctionEmbed:', err.message);
  }
}

module.exports = { startAuctionWorker, checkMarketAccess, sellToMerchant, createAuction, placeBid, finaliseBuyout, buildAuctionEmbed, DURATIONS_MS };
