# Contribuer à WorldBoss

---

## Prérequis

- Node.js 20+
- PostgreSQL 16
- Redis 7
- Un bot Discord de test (token + application)

---

## Mise en place de l'environnement

```bash
git clone https://github.com/rustyrory/WorldBoss.git
cd WorldBoss/worldboss-app
cp .env.example .env
npm install
npx prisma migrate dev
npm run deploy   # déployer les commandes sur ton serveur de test
npm run dev      # nodemon — rechargement automatique
```

Renseigne `DEPLOY_GUILD_IDS` dans `.env` avec l'ID de ton serveur de test pour que les commandes slash soient disponibles instantanément (mode guild). Sans cette variable, le déploiement est global (délai jusqu'à 1h).

---

## Workflow

1. **Ouvre une issue** avant de commencer un changement non trivial — pour aligner sur l'approche.
2. **Crée une branche** depuis `main` :
   ```bash
   git checkout -b feat/<numéro-issue>-description-courte
   # ou fix/<numéro-issue>-description
   ```
3. **Code** — voir les conventions ci-dessous.
4. **Teste** sur ton serveur Discord de dev avant de soumettre.
5. **Ouvre une Pull Request** vers `main` avec une description claire.

---

## Conventions de commit

Ce projet suit **Conventional Commits** :

```
feat(dungeon): ajouter salle de boss au chapitre 3
fix(combat): corriger HP négatifs après stun
chore(deps): mettre à jour discord.js v14.14.1
docs: mettre à jour CHANGELOG
```

Types courants : `feat` · `fix` · `chore` · `docs` · `refactor` · `perf`

Pour fermer une issue automatiquement : `Fixes #<numéro>` dans le corps du commit ou la PR.

---

## Conventions de code

- `'use strict';` en tête de chaque fichier
- Pas de commentaires sauf pour les invariants non-obvieux
- `Math.max(0, hp - dmg)` — les HP ne passent jamais en négatif
- Les logs de combat incluent `*(HP courant/maxHP)*` après chaque action
- Les données statiques (ennemis, items, skills) restent dans `src/data/`
- La logique métier va dans `src/services/`, les calculs purs dans `src/engines/`

---

## Ajouter un ennemi

1. Créer ou modifier le fichier `src/data/enemies/arc<N>_<nom>.js`
2. Si l'ennemi a une capacité spéciale, l'ajouter dans `src/data/abilities/arc<N>_<nom>.js`
3. Exporter depuis `src/data/enemies/index.js` et `src/data/abilities/index.js`
4. Référencer l'ennemi dans une salle de `src/data/dungeons.js` ou `src/data/primes.js`

Structure minimale d'un ennemi :
```js
module.exports = {
  mon_ennemi: {
    id: 'mon_ennemi',
    name: 'Mon Ennemi',
    hp: 120, maxHp: 120,
    atk: 18, def: 6, spd: 10, crit: 5,
    restHeal: 12,
    xp: 40,
    ability: 'ma_capacite',          // optionnel
    gold: { min: 4, max: 8 },
    loot: ['item_id_1', 'item_id_2'],
  },
};
```

---

## Signaler un bug

Ouvre une issue avec :
- Les étapes exactes pour reproduire
- Le comportement attendu vs observé
- Les logs Discord si disponibles (message d'erreur, embed)

---

## Questions

Ouvre une issue avec le label `question`.
