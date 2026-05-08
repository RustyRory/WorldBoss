# Feature : World Boss coopératif

Le World Boss est la fonctionnalité centrale côté serveur. Chaque guilde (serveur Discord) a son propre boss hebdomadaire que tous les membres peuvent attaquer ensemble.

---

## Concept

- **Un boss par serveur** — stocké dans `WorldBoss` lié à `Guild`
- **Reset hebdomadaire** — le boss est réinitialisé chaque semaine (manuel ou cron BullMQ en Phase 2)
- **Progression** — si la guilde a vaincu le boss, il monte d'un niveau au prochain reset
- **Leaderboard** — classement des dégâts par joueur pour ce cycle

---

## Commandes

| Commande | Description |
|---|---|
| `/worldboss status` | Voir HP, phase, stats du boss |
| `/worldboss attack` | Attaquer (une fois par invocation) |
| `/worldboss leaderboard` | Top 10 contributeurs |

---

## Phases de combat

Le boss devient plus dangereux à mesure qu'il perd des HP.

| Phase | Seuil HP | Multiplicateur ATK | Couleur embed |
|---|---|---|---|
| Normal | > 30% | ×1.0 | Rouge sombre |
| Enragé | ≤ 30% | ×1.25 | Orange |
| Berserk | ≤ 15% | ×1.5 | Rouge vif |

La phase est recalculée en temps réel à chaque attaque et persistée dans `WorldBoss.phase`.

---

## Scaling par niveau

Chaque reset, si le boss a été vaincu, son niveau augmente :

```
HP max  = 5000 × 1.4^(level − 1)
ATK     = 80   × 1.2^(level − 1)
DEF     = 40   × 1.2^(level − 1)
```

Exemples :

| Niveau | HP max | ATK | DEF |
|---|---|---|---|
| 1 | 5 000 | 80 | 40 |
| 2 | 7 000 | 96 | 48 |
| 3 | 9 800 | 115 | 58 |
| 5 | 19 200 | 166 | 83 |
| 7+ | > 37 000 | 239+ | 120+ |

---

## Boss thématiques

Le nom et le lore changent selon le niveau, par paliers de 3 :

| Niveaux | Biome | Nom | Lore |
|---|---|---|---|
| 1 | Catacombes | Seigneur des Ossements | Il régnait sur les catacombes bien avant que votre guilde ne les foule. |
| 2 | Catacombes | Liche Écarlate | La mort ne lui suffit plus — il dévore l'âme de ses victimes. |
| 3 | Catacombes | Roi Squelette Maudit | Sa couronne maudite rayonne d'une sombre magie immémoriale. |
| 4 | Forêt Corrompue | Sylvanide Corrompu | La forêt elle-même pleure sous son étreinte vénéneuse. |
| 5 | Forêt Corrompue | Chasseur Maudit | Il traque ses proies depuis des siècles, jamais rassasié. |
| 6 | Forêt Corrompue | Esprit de la Forêt Noire | Jadis gardien bienveillant, désormais dévoré par la rage. |
| 7+ | Citadelle des Ténèbres | Seigneur des Ténèbres | L'entité ultime qui tisse la corruption à travers les royaumes. |

---

## Formule de dégâts

Cohérente avec le moteur de donjon solo (`combatEngine.js`) :

```
rawDmg   = playerATK × (100 / (100 + bossDefense))
finalDmg = rawDmg × critMult  (si critique)
bossHit  = bossATK_effectif × (100 / (100 + playerDEF))
```

`bossATK_effectif` = `boss.attack × phaseMultiplier`.

---

## Transaction DB par attaque

```js
await prisma.$transaction([
  prisma.worldBoss.update({
    where: { guildId },
    data: { currentHp: newHp, phase, status, defeatedAt },
  }),
  prisma.worldBossParticipant.upsert({
    where: { bossId_userId: { bossId, userId } },
    create: { bossId, userId, damage: finalDmg, hits: 1 },
    update: { damage: { increment: finalDmg }, hits: { increment: 1 } },
  }),
]);
```

La transaction garantit la cohérence HP / participation même en cas d'attaques simultanées.

---

## Reset (Phase 2 — cron BullMQ)

La fonction `resetBoss(guildId)` dans `worldboss.service.js` :

1. Lit le boss actuel
2. Si `status = 'defeated'` → `newLevel = level + 1`, sinon `newLevel = level`
3. Calcule les nouveaux stats avec la formule de scaling
4. Met à jour le boss : nouveau nom/lore, HP, ATK, DEF, phase → `normal`, status → `alive`
5. Supprime tous les `WorldBossParticipant` (nouveau cycle)

À automatiser avec un job BullMQ planifié tous les lundis à 00h00 UTC.

---

## Embed visual

### `/worldboss status`

```
👹 Seigneur des Ossements — Niveau 1
*Il régnait sur les catacombes bien avant que votre guilde ne les foule.*

⚔️ Phase normale

❤️ Points de Vie
🟩🟩🟩🟩🟩🟩🟩🟩🟩⬛ 4 200 / 5 000 HP

⚔️ Attaque   🛡️ Défense   👥 Participants
     80            40             7
```

### `/worldboss attack`

```
⚔️ Assaut sur le World Boss

Tu frappes Seigneur des Ossements pour 143 dégâts 💥 CRITIQUE !
Il riposte et t'inflige 67 dégâts.

👹 Boss HP
🟨🟨🟨🟨🟨⬛⬛⬛⬛⬛ 2 100 / 5 000 HP

💚 Vos HP    ⚔️ Dégâts    💢 Reçus
    53           143          67
```
