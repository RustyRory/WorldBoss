'use strict';

// Percentage bonuses applied to (base + equipment) stats.
// hpPct/atkPct/defPct/spdPct : 0.10 = +10%
// critFlat : flat crit% points added after scaling (crit is already a % so flat makes sense)
const RACE_BONUSES = {
  humain:   { hpPct: 0.05, atkPct: 0.03, defPct: 0.03, spdPct: 0.03, critFlat:  0 },
  elfe:     { hpPct: 0,    atkPct: 0.10, defPct: 0,    spdPct: 0.10, critFlat:  8 },
  nain:     { hpPct: 0.20, atkPct: 0.05, defPct: 0.15, spdPct: 0,    critFlat:  0 },
  orque:    { hpPct: 0.08, atkPct: 0.15, defPct: 0,    spdPct: 0,    critFlat: 10 },
  halfelin: { hpPct: 0.10, atkPct: 0,    defPct: 0.08, spdPct: 0.15, critFlat:  0 },
};

const GENDER_BONUSES = {
  male:   { hpPct: 0,    atkPct: 0.05, defPct: 0,    spdPct: 0,    critFlat: 5 },
  female: { hpPct: 0.08, atkPct: 0,    defPct: 0.05, spdPct: 0,    critFlat: 0 },
};

const RACES = {
  humain:   { label: 'Humain',   description: 'Polyvalent et adaptable.',  emojiMale: '👨', emojiFemale: '👩' },
  elfe:     { label: 'Elfe',     description: 'Agile et offensif.',        emojiMale: '🧝', emojiFemale: '🧝' },
  nain:     { label: 'Nain',     description: 'Robuste et endurant.',      emojiMale: '⛏️', emojiFemale: '⛏️' },
  orque:    { label: 'Orque',    description: 'Brutal, spé dégâts.',       emojiMale: '👹', emojiFemale: '👹' },
  halfelin: { label: 'Halfelin', description: 'Rapide et insaisissable.',  emojiMale: '🍀', emojiFemale: '🍀' },
};

function getCharacterEmoji(race, gender) {
  const raceDef = RACES[race] ?? RACES.humain;
  return gender === 'female' ? raceDef.emojiFemale : raceDef.emojiMale;
}

function getRaceBonuses(race, gender) {
  const r = RACE_BONUSES[race]    ?? RACE_BONUSES.humain;
  const g = GENDER_BONUSES[gender] ?? GENDER_BONUSES.male;
  return {
    hpPct:    r.hpPct    + g.hpPct,
    atkPct:   r.atkPct   + g.atkPct,
    defPct:   r.defPct   + g.defPct,
    spdPct:   r.spdPct   + g.spdPct,
    critFlat: r.critFlat + g.critFlat,
  };
}

// Returns a display string like "HP+13% · ATK+8% · CRIT+5"
function formatRaceBonuses(race, gender) {
  const b = getRaceBonuses(race, gender);
  return [
    b.hpPct    ? `HP+${Math.round(b.hpPct    * 100)}%` : null,
    b.atkPct   ? `ATK+${Math.round(b.atkPct  * 100)}%` : null,
    b.defPct   ? `DEF+${Math.round(b.defPct  * 100)}%` : null,
    b.spdPct   ? `SPD+${Math.round(b.spdPct  * 100)}%` : null,
    b.critFlat ? `CRIT+${b.critFlat}`                   : null,
  ].filter(Boolean).join(' · ');
}

module.exports = { RACES, RACE_BONUSES, GENDER_BONUSES, getCharacterEmoji, getRaceBonuses, formatRaceBonuses };
