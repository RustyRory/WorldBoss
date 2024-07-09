const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const {
  token,
  channelWB,
  channelCity,
  channelGraveyard,
} = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const fs = require("fs");

// Lire les données du fichier worldBoss.json
const rawBossData = fs.readFileSync("worldBoss.json");
let worldBossData = JSON.parse(rawBossData);

// Lire les données du fichier players.json
const rawPlayersData = fs.readFileSync("players.json");
let playersData = JSON.parse(rawPlayersData);

let game;

async function worldBossElapsedTime() {
  try {
    const message = await fetchMessageById(channelWB, worldBossData.id);
    if (message) {
      const elapsedTime = Date.now() - message.createdTimestamp;
      const seconds = Math.floor((elapsedTime / 1000) % 60);
      const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
      const hours = Math.floor((elapsedTime / (1000 * 60 * 60)) % 24);
      const days = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
      return { days, hours, minutes, seconds };
    } else {
      console.error("Message introuvable.");
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du temps écoulé :", error);
  }
}

function worldBossEmbedBuilder(timeleft) {
  return new EmbedBuilder()
    .setTitle("World Boss Stats")
    .setDescription("Voici les statistiques actuelles du World Boss.")
    .addFields(
      {
        name: "Niveau",
        value: worldBossData.level.toString(),
      },
      {
        name: "Dégâts",
        value: worldBossData.damages.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true },
      {
        name: "Temps restant",
        value: timeleft.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B" }
    )
    .setFooter({
      text:
        "Réagissez pour interragir\n" +
        "\n" +
        " | 🗡️ | Attaque du Boss \n" +
        " | 🏹 | Attaque spéciale (2 points d'action) \n" +
        " | 🐴 | Partir en aventure (XP + Golds)\n" +
        " | 💤 | Se reposer (Gain de vie pour des golds)",
    });
}

// Embed
async function worldBossNewMessage() {
  // Vérification channel WorldBoss
  const channel = client.channels.cache.get(channelWB);
  if (!channel) return console.error("Le canal est introuvable.");

  // Création et envoi Embed
  const message = await channel.send({
    embeds: [worldBossEmbedBuilder(worldBossData.timeout)],
  });

  // Ajouter des réactions à l'embed
  await message.react("🗡️");
  await message.react("🏹");
  await message.react("🐴");
  await message.react("💤");
  await message.react("❤️");

  // Enregistrer l'ID du message pour les futures références
  worldBossData.id = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
}

// Embed city
async function cityNewMessage() {
  // Vérification channel City
  const channel = client.channels.cache.get(channelCity);
  if (!channel) return console.error("Le canal est introuvable.");

  // Création et envoi Embed
  const message = await channel.send({
    embeds: [cityEmbedBuilder()],
  });

  // Ajouter des réactions à l'embed
  await message.react("🧑‍🚀");
  await message.react("🧙‍♂️");
  await message.react("🧝‍♀️");
  await message.react("🧑‍🎤");

  // Enregistrer l'ID du message pour les futures références
  worldBossData.cityId = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
}

// Embed guerrier
async function warriorNewMessage() {
  // Vérification channel City
  const channel = client.channels.cache.get(channelCity);
  if (!channel) return console.error("Le canal est introuvable.");

  // Création et envoi Embed
  const message = await channel.send({
    embeds: [warriorEmbedBuilder()],
  });

  // Ajouter des réactions à l'embed
  if (worldBossData.warrior > 1) {
    await message.react("🛡️");
  }
  if (worldBossData.warrior > 1001) {
    await message.react("🫡");
  }
  if (worldBossData.warrior > 100001) {
    await message.react("🪽");
  }
  if (worldBossData.warrior > 1000001) {
    await message.react("⚖️");
  }

  // Enregistrer l'ID du message pour les futures références
  worldBossData.warriorId = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
}

// Embed mage
async function mageNewMessage() {
  // Vérification channel City
  const channel = client.channels.cache.get(channelCity);
  if (!channel) return console.error("Le canal est introuvable.");

  // Création et envoi Embed
  const message = await channel.send({
    embeds: [mageEmbedBuilder()],
  });

  // Ajouter des réactions à l'embed
  if (worldBossData.mage > 1) {
    await message.react("⚡");
  }
  if (worldBossData.mage > 1001) {
    await message.react("🔥");
  }
  if (worldBossData.mage > 100001) {
    await message.react("🧬");
  }
  if (worldBossData.mage > 1000001) {
    await message.react("❄️");
  }

  // Enregistrer l'ID du message pour les futures références
  worldBossData.mageId = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
}

// Embed tireur
async function rogueNewMessage() {
  // Vérification channel City
  const channel = client.channels.cache.get(channelCity);
  if (!channel) return console.error("Le canal est introuvable.");

  // Création et envoi Embed
  const message = await channel.send({
    embeds: [rogueEmbedBuilder()],
  });

  // Ajouter des réactions à l'embed

  if (worldBossData.rogue > 1) {
    await message.react("🔭");
  }
  if (worldBossData.rogue > 1001) {
    await message.react("💣");
  }
  if (worldBossData.rogue > 100001) {
    await message.react("🕸️");
  }
  if (worldBossData.rogue > 1000001) {
    await message.react("🅰️");
  }

  // Enregistrer l'ID du message pour les futures références
  worldBossData.rogueId = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
}

// Embed tireur
async function adventurerNewMessage() {
  // Vérification channel City
  const channel = client.channels.cache.get(channelCity);
  if (!channel) return console.error("Le canal est introuvable.");

  // Création et envoi Embed
  const message = await channel.send({
    embeds: [adventurerEmbedBuilder()],
  });

  // Ajouter des réactions à l'embed
  if (worldBossData.adventurer > 1) {
    await message.react("🛡️");
  }
  if (worldBossData.adventurer > 1001) {
    await message.react("🅰️");
  }
  if (worldBossData.adventurer > 100001) {
    await message.react("💣");
  }
  if (worldBossData.adventurer > 1000001) {
    await message.react("⚖️");
  }

  // Enregistrer l'ID du message pour les futures références
  worldBossData.adventurerId = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
}

function cityEmbedBuilder() {
  return new EmbedBuilder()
    .setTitle("Ville")
    .setDescription("Voici la ville.")
    .addFields({
      name: "Choisissez votre classe",
      value:
        " | 🧑‍🚀 | Guerrier : DMG - | DMG subit - \n" +
        " | 🧙‍♂️ | Mage : DMG + | DMG subit + \n" +
        " | 🧝‍♀️ | Tireur : Critique + | DMG subit + \n" +
        " | 🧑‍🎤 | Aventurier : Exp + | Golds + \n",
    })
    .setFooter({
      text: "Réagissez pour choisir votre classe",
    });
}

function warriorEmbedBuilder() {
  const embed = new EmbedBuilder()
    .setTitle("Guerrier")
    .setDescription("Voici le repaire des guerriers.")
    .addFields(
      { name: "Fortune du repaire", value: worldBossData.warrior.toString() },
      {
        name: "Dons",
        value:
          "Vous pouvez donner des golds pour le repaire avec la commande /donate [golds]",
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Choisissez votre attaque spéciale",
        value: "\u200B",
      }
    )
    .setFooter({
      text: "Réagissez pour choisir votre attaque",
    });

  if (worldBossData.warrior > 1) {
    embed.addFields({
      name: "| 🛡️ | Coup de bouclier",
      value: "Donne un coup de bouclier (dmg x2 | +10 PV)",
      inline: true,
    });
  }
  if (worldBossData.warrior > 1001) {
    embed.addFields({
      name: "| 🫡 | En formation !",
      value: "Votre défense augmente (dmg subit - lvl joueur)",
      inline: true,
    });
  }
  if (worldBossData.warrior > 100001) {
    embed.addFields({
      name: "| 🪽 | Salut divin",
      value:
        "Vous récupérer de la vie en plus de votre attaque (dmg x2 | dmg subit x1 max)",
      inline: true,
    });
  }
  if (worldBossData.warrior > 1000001) {
    embed.addFields({
      name: "| ⚖️ | Pour la justice",
      value:
        "Attaque dévastatrice mais inflige des dégats en retour (dmg x4 | dmg subit x2)",
      inline: true,
    });
  }

  return embed;
}

function mageEmbedBuilder() {
  const embed = new EmbedBuilder()
    .setTitle("Mage")
    .setDescription("Voici le repaire des mages.")
    .addFields(
      { name: "Fortune du repaire", value: worldBossData.mage.toString() },
      {
        name: "Dons",
        value:
          "Vous pouvez donner des golds pour le repaire avec la commande /donate [golds]",
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Choisissez votre attaque spéciale",
        value: "\u200B",
      }
    )
    .setFooter({
      text: "Réagissez pour choisir votre attaque",
    });

  if (worldBossData.mage > 1) {
    embed.addFields({
      name: "| ⚡ | Éclair",
      value: "Envoi un coup d'éclair (dmg x2 + lvl joueur)",
      inline: true,
    });
  }
  if (worldBossData.mage > 1001) {
    embed.addFields({
      name: "| 🔥 | Boule de feu",
      value: "Envoi une boule de feu (dmg x3)",
      inline: true,
    });
  }
  if (worldBossData.mage > 100001) {
    embed.addFields({
      name: "| 🧬 | Transformation",
      value:
        "Vous vous transformez en une bête férroce (1 chance sur 4 (+PV | +Att | +Crit | +Res))",
      inline: true,
    });
  }
  if (worldBossData.mage > 1000001) {
    embed.addFields({
      name: "| ❄️ | Tempète de glace",
      value: "Envoi une (dmg x2 | crit x2)",
      inline: true,
    });
  }

  return embed;
}

function rogueEmbedBuilder() {
  const embed = new EmbedBuilder()
    .setTitle("Tireur")
    .setDescription("Voici le repaire des tireurs.")
    .addFields(
      { name: "Fortune du repaire", value: worldBossData.rogue.toString() },
      {
        name: "Dons",
        value:
          "Vous pouvez donner des golds pour le repaire avec la commande '/donate [golds]'",
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Choisissez votre attaque spéciale",
        value: "\u200B",
      }
    )
    .setFooter({
      text: "Réagissez pour choisir votre attaque",
    });

  if (worldBossData.rogue > 1) {
    embed.addFields({
      name: "| 🔭 | Tir précis",
      value: "Cible les points vitaux (crit x3)",
      inline: true,
    });
  }
  if (worldBossData.rogue > 1001) {
    embed.addFields({
      name: "| 💣 | A couvert !",
      value: "Envoi une bombe sur l'adversaire (Dmg x3)",
      inline: true,
    });
  }
  if (worldBossData.rogue > 100001) {
    embed.addFields({
      name: "| 🕸️ | Filet",
      value: "Vous ralentissez votre cible (Crit x2 | Dmg subit x2 max)",
      inline: true,
    });
  }
  if (worldBossData.rogue > 1000001) {
    embed.addFields({
      name: "| ? | ?",
      value: "?",
      inline: true,
    });
  }
  return embed;
}

function adventurerEmbedBuilder() {
  const embed = new EmbedBuilder()
    .setTitle("Aventurier")
    .setDescription("Voici le repaire des aventuriers.")
    .addFields(
      {
        name: "Fortune du repaire",
        value: worldBossData.adventurer.toString(),
      },
      {
        name: "Dons",
        value:
          "Vous pouvez donner des golds pour le repaire avec la commande '/donate [golds]'",
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Choisissez votre attaque spéciale",
        value: "\u200B",
      }
    )
    .setFooter({
      text: "Réagissez pour choisir votre attaque",
    });

  if (worldBossData.adventurer > 1) {
    embed.addFields({
      name: "| ? | L'ermite",
      value: "Attaque l'adversaire (Exp x4 + lvl joueur)",
      inline: true,
    });
  }
  if (worldBossData.adventurer > 1001) {
    embed.addFields({
      name: "| ? | Vous appelez ca voler ?",
      value: "Attaque l'adversaire (Golds x4 + lvl joueur)",
      inline: true,
    });
  }
  if (worldBossData.adventurer > 100001) {
    embed.addFields({
      name: "| ? | L'art de l'aventure",
      value: "Vous partez en aventure (Exp x4 | Golds x4)",
      inline: true,
    });
  }
  if (worldBossData.adventurer > 1000001) {
    embed.addFields({
      name: "| ? | ",
      value: "?",
      inline: true,
    });
  }
  return embed;
}

function passifClass(player, dataDamages, dataLife, dataExperience, dataGolds) {
  if ((player.class = "Guerrier")) {
    dataDamages = dataDamages + player.level;
    dataLife = dataLife - player.level;
  } else if ((player.class = "Mage")) {
    dataDamages = dataDamages + player.level * 2;
    dataLife = dataLife + player.level;
  } else if ((player.class = "Tireur")) {
    dataDamages = player.level * (getRandomMultiplier() + 1);
    dataLife = dataLife + player.level;
  } else if ((player.class = "Aventurier")) {
    dataExperience = dataExperience + player.level;
    dataGolds = dataGolds + player.level;
  }
}

//
function worldBossReset() {
  worldBossData.damages = 0;
  playersData.players.forEach((player) => {
    if (player.life <= 0) player.life = 100;
  });
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
  fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
}

// Timeout
function worldBossTimeout() {
  game = setTimeout(async () => {
    if (worldBossData.damages < worldBossData.life) {
      //Récup le message et le supprime
      try {
        const message = await client.channels.cache
          .get(channelWB)
          .messages.fetch(worldBossData.id);
        await message.delete();
      } catch (err) {
        console.error("Erreur en récupérant ou en supprimant le message:", err);
      }

      //Reset WB
      worldBossReset();

      //Envoi new mess + new timeout
      worldBossNewMessage();
      worldBossTimeout();
    } else {
      console.error("Error : Boss mort mais timeout tj actif");
    }
    console.log("Le timer du WB est écoulé.");
  }, worldBossData.timeout * 1000); // 60000 millisecondes = 1 minute
}

async function fetchMessageById(channelId, messageId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error("Le canal est introuvable.");
      return;
    }

    const message = await channel.messages.fetch(messageId);
    return message;
  } catch (error) {
    console.error("Erreur lors de la récupération du message :", error);
  }
}

async function worldBossMessageEdit() {
  try {
    const message = await fetchMessageById(channelWB, worldBossData.id);
    if (message) {
      const elapsedTime = await worldBossElapsedTime();
      let timeLeft = 0;
      if (elapsedTime) {
        timeLeft = worldBossData.timeout - elapsedTime.seconds;
      }
      await message.edit({ embeds: [worldBossEmbedBuilder(timeLeft)] });
      console.log("Message mis à jour avec succès.");
    } else {
      console.error("Message introuvable.");
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du message :", error);
  }

  if (worldBossData.damages >= worldBossData.life) {
    worldBossData.level += 1;
    worldBossData.life = worldBossData.level * 13;
    //save
    worldBossReset();

    clearTimeout(game);
    try {
      const message = await fetchMessageById(channelWB, worldBossData.id);
      if (message) {
        await message.delete();
        console.log("Message supprimé avec succès.");
      } else {
        console.error("Message introuvable.");
      }
    } catch (error) {
      console.error("Erreur lors de la supression du message :", error);
    }
    worldBossNewMessage();
    worldBossTimeout();
  }
}

// Fonction pour trouver un joueur par son ID
function findPlayerById(playerId) {
  return playersData.players.find((player) => player.id === playerId);
}

function getRandomMultiplier() {
  const random = Math.random(); // Génère un nombre aléatoire entre 0 et 1
  if (random < 1 / 10) return 0;
  else if (random < 6 / 10) return 1;
  else if (random < 9 / 10) return 2;
  else return 4;
}

function sendPrivateEmbed(
  dataDamages,
  dataLife,
  dataExperience,
  dataGolds,
  special,
  action
) {
  let embed = new EmbedBuilder()
    .setTitle("WorldBoss Attaque")
    .setDescription("Voici le rapport de combat de votre attaque " + special)
    .addFields(
      {
        name: "Point de dégats",
        value:
          "(" +
          dataDamages.toString() +
          ") => " +
          worldBossData.damages.toString(),
        inline: true,
      },
      {
        name: "Point de vie",
        value: "(" + dataLife.toString() + ") => " + player.life.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Point d'expériences",
        value:
          "(+" +
          dataExperience.toString() +
          ") => " +
          player.experience.toString(),
        inline: true,
      },
      {
        name: "golds",
        value: "(+" + dataGolds.toString() + ") => " + player.golds.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B" }
    );

  if (player.experience >= player.level * 13) {
    player.experience = 0;
    player.level += 1;
    player.life += 50;
    player.action += 5;
    embed.addFields(
      {
        name: "Gain de Niveau",
        value: "(+1) => " + player.level.toString(),
      },
      {
        name: "Point de vie",
        value: "(+50) => " + player.life.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true },
      {
        name: "Point d'action",
        value: "(+5) => " + player.action.toString(),
        inline: true,
      }
    );
  } else {
    embed.addFields({
      name: "Point d'action",
      value: "(-" + action + ") => " + player.action.toString(),
    });
  }

  client.users.send(player.id, { embeds: [embed] });
}

async function worldBossAttack(
  player,
  dataDamages,
  dataLife,
  dataExperience,
  dataGolds
) {
  player.action -= 1;
  player.damages = player.damages + dataDamages - worldBossData.level;
  worldBossData.damages =
    worldBossData.damages + dataDamages - worldBossData.level;
  player.life = player.life - (dataLife - player.level);
  player.experience = player.experience + dataExperience;
  player.golds = player.golds + dataGolds;

  sendPrivateEmbed(
    dataDamages - worldBossData.level,
    dataLife - player.level,
    dataExperience,
    dataGolds,
    "",
    1
  );

  //save
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
  fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

  worldBossEdit();
}

async function worldBossSpecial(
  player,
  dataDamages,
  dataLife,
  dataExperience,
  dataGolds
) {
  if (player.class === "Guerrier") {
    // Récupérer le message
    const message = fetchMessageById(channelCity, worldBossData.warriorId);
    // Récupérer toutes les réactions de l'utilisateur sur ce message
    const reactionsFromUser = message.reactions.cache.filter((r) =>
      r.users.cache.has(user.id)
    );
    // Effectuer des actions en fonction des réactions
    for (const r of reactionsFromUser.values()) {
      if (r.emoji.name === "🛡️") {
        player.action -= 2;
        player.damages = player.damages + dataDamages * 2 - worldBossData.level;
        worldBossData.damages =
          worldBossData.damages + player.level * 2 - worldBossData.level;
        player.life = player.life - dataLife + 10;
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;

        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 2 - worldBossData.level,
          -dataLife + 10,
          dataExperience,
          dataGolds,
          "🛡️",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossMessageEdit();
      } else if (r.emoji.name === "🫡") {
        player.action -= 2;
        player.damages =
          player.damages + dataDamages - worldBossData.level + player.level;
        worldBossData.damages =
          worldBossData.damages +
          dataDamages -
          worldBossData.level +
          player.level;
        player.life = player.life - (dataLife - player.level * 2);
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;

        //ENVOI MP
        sendPrivateEmbed(
          dataDamages - worldBossData.level + player.level,
          -(dataLife - player.level * 2),
          dataExperience,
          dataGolds,
          "🫡",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "🪽") {
        player.action -= 2;
        player.damages =
          player.damages + (dataDamages * 2 - worldBossData.level);
        worldBossData.damages =
          worldBossData.damages + (dataDamages * 2 - worldBossData.level);
        player.life = player.life - (worldBossData.level - player.level * 2);
        player.experience = player.experience + worldBossData.level;
        player.golds = player.golds + worldBossData.level;

        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 2 - worldBossData.level,
          -worldBossData.level,
          worldBossData.level,
          worldBossData.dataGolds,
          "🪽",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "⚖️") {
        player.action -= 2;
        player.damages =
          player.damages + (dataDamages * 4 - worldBossData.level);
        worldBossData.damages =
          worldBossData.damages + (dataDamages * 4 - worldBossData.level);
        player.life = player.life - (dataLife * 2 - player.level);
        player.experience = player.experience + worldBossData.level;
        player.golds = player.golds + worldBossData.level;
        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 4 - worldBossData.level,
          -(dataLife * 2 - player.level),
          worldBossData.level,
          worldBossData.dataGolds,
          "🪽",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else {
        return;
      }
    }
  } else if (player.class === "Mage") {
    // Récupérer le message
    const message = fetchMessageById(channelCity, worldBossData.warriorId);
    // Récupérer toutes les réactions de l'utilisateur sur ce message
    const reactionsFromUser = message.reactions.cache.filter((r) =>
      r.users.cache.has(user.id)
    );
    // Effectuer des actions en fonction des réactions
    for (const r of reactionsFromUser.values()) {
      if (r.emoji.name === "⚡") {
        player.action -= 2;
        player.damages =
          player.damages + dataDamages * 2 - worldBossData.level + player.level;
        worldBossData.damages =
          worldBossData.damages +
          (dataDamages * 2 - worldBossData.level + player.level);
        player.life = player.life - dataLife;
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;
        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 2 - worldBossData.level + player.level,
          -dataLife,
          dataExperience,
          dataGolds,
          "⚡",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "🔥") {
        player.action -= 2;
        player.damages =
          player.damages + (dataDamages * 3 - worldBossData.level);
        worldBossData.damages =
          worldBossData.damages + (dataDamages * 3 - worldBossData.level);
        player.life = player.life - dataLife;
        player.experience = player.experience + worldBossData.level;
        player.golds = player.golds + worldBossData.level;
        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 3 - worldBossData.level,
          -dataLife,
          dataExperience,
          dataGolds,
          "⚡",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "🧬") {
        //TODO
        //ENVOI MP
        //SAVE
      } else if (r.emoji.name === "❄️") {
        player.action -= 2;
        player.damages = player.damages + dataDamages * 2;
        worldBossData.damages = worldBossData.damages + dataDamages * 2;
        player.life = player.life - dataLife;
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;
        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 3 - worldBossData.level,
          -dataLife,
          dataExperience,
          dataGolds,
          "⚡",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else {
        return;
      }
    }
  } else if (player.class === "Tireur") {
    // Récupérer le message
    const message = fetchMessageById(channelCity, worldBossData.warriorId);
    // Récupérer toutes les réactions de l'utilisateur sur ce message
    const reactionsFromUser = message.reactions.cache.filter((r) =>
      r.users.cache.has(user.id)
    );
    // Effectuer des actions en fonction des réactions
    for (const r of reactionsFromUser.values()) {
      if (r.emoji.name === "🔭") {
        player.action -= 2;
        const crit = level.player * 3 * getRandomMultiplier();
        player.damages = player.damages + crit;
        worldBossData.damages = worldBossData.damages + crit;
        player.life = player.life - dataLife;
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;
        //ENVOI MP
        sendPrivateEmbed(crit, -dataLife, dataExperience, dataGolds, "🔭", 2);

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "💣") {
        player.action -= 2;
        player.damages = player.damages + dataDamages * 3;
        worldBossData.damages = worldBossData.damages + dataDamages * 2;
        player.life = player.life - dataLife;
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;
        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 2,
          -dataLife,
          dataExperience,
          dataGolds,
          "💣",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "🕸️") {
        player.action -= 2;
        player.damages = player.damages + dataDamages * 2;
        worldBossData.damages = worldBossData.damages + dataDamages * 2;
        player.life = player.life - player.level * 2;
        player.experience = player.experience + dataExperience;
        player.golds = player.golds + dataGolds;
        //ENVOI MP
        sendPrivateEmbed(
          dataDamages * 2,
          -player.level * 2,
          dataExperience,
          dataGolds,
          "🕸️",
          2
        );

        //save
        fs.writeFileSync(
          "worldBoss.json",
          JSON.stringify(worldBossData, null, 2)
        );
        fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

        worldBossEdit();
      } else if (r.emoji.name === "") {
        //TODO
      } else {
        return;
      }
    }
  } else if (player.class === "Aventurier") {
    // // Récupérer le message
    // const message = fetchMessageById(channelCity, worldBossData.warriorId);
    // // Récupérer toutes les réactions de l'utilisateur sur ce message
    // const reactionsFromUser = message.reactions.cache.filter(r => r.users.cache.has(user.id));
    // // Effectuer des actions en fonction des réactions
    // for (const r of reactionsFromUser.values()) {
    //   if (r.emoji.name === '🛡️') {
    //   }else if(r.emoji.name === '🫡'){
    //   }else if(r.emoji.name === '🪽'){
    //   }else if(r.emoji.name === '⚖️'){
    //   }
    // }
  } else {
    client.users.send(
      player.id,
      "Vous n'avez pas de classe. Veuillez en choisir une dans la ville."
    );
  }
}

async function worldBossAdventure(player, dataExperience, dataGolds) {
  player.action -= 1;
  player.experience = player.experience + dataExperience;
  player.golds = player.golds + dataGolds;

  let embed = new EmbedBuilder()
    .setTitle("WorldBoss Aventure")
    .setDescription("Voici le rapport de votre aventure.")
    .addFields(
      {
        name: "Point d'expériences",
        value:
          "(+" +
          dataExperience.toString() +
          ") => " +
          player.experience.toString(),
        inline: true,
      },
      {
        name: "golds",
        value: "(+" + dataGolds.toString() + ") => " + player.golds.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B" }
    );

  if (player.experience >= player.level * 13) {
    player.experience = 0;
    player.level += 1;
    player.life += 50;
    player.action += 5;
    embed.addFields(
      {
        name: "Gain de Niveau",
        value: "(+1) => " + player.level.toString(),
      },
      {
        name: "Point de vie",
        value: "(+50) => " + player.life.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B", inline: true },
      {
        name: "Point d'action",
        value: "(+5) => " + player.action.toString(),
        inline: true,
      }
    );
  } else {
    embed.addFields({
      name: "Point d'action",
      value: "(-1) => " + player.action.toString(),
    });
  }

  client.users.send(player.id, { embeds: [embed] });

  //save
  fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
}

async function worldBossRest(player, dataLife, dataGolds) {
  player.action -= 1;
  player.life = player.life + dataLife;
  player.golds = player.golds - (dataGolds * 10 + dataLife);

  let embed = new EmbedBuilder()
    .setTitle("WorldBoss Repos")
    .setDescription("Voici la facture de l'auberge.")
    .addFields(
      {
        name: "Point de vie",
        value: "(+" + dataLife.toString() + ") => " + player.life.toString(),
        inline: true,
      },
      {
        name: "golds",
        value:
          "(-" +
          (dataGolds + dataLife).toString() +
          ") => " +
          player.golds.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Point d'action",
        value: "(-1) => " + player.action.toString(),
      }
    );
  client.users.send(player.id, { embeds: [embed] });

  //save
  fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
}

client.once("ready", async () => {
  // Vérifications connection / datas
  console.log(`Connecté en tant que ${client.user.tag}`);
  console.log("Données du World Boss chargées:", worldBossData);
  console.log("Données des joueurs chargées:", playersData);

  // WORLD BOSS
  worldBossNewMessage();
  worldBossTimeout();

  // Ville
  cityNewMessage();
  warriorNewMessage();
  mageNewMessage();
  rogueNewMessage();
  adventurerNewMessage();

  // Maj embed 1000 ms = 1 sec
  setInterval(async () => {
    try {
      const message = await fetchMessageById(channelWB, worldBossData.id);
      if (message) {
        const elapsedTime = await worldBossElapsedTime();
        let timeLeft = 0;
        if (elapsedTime) {
          timeLeft = worldBossData.timeout - elapsedTime.seconds;
        }
        await message.edit({ embeds: [worldBossEmbedBuilder(timeLeft)] });
        console.log("Message mis à jour avec succès.");
      } else {
        console.error("Message introuvable.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du message :", error);
    }
  }, 1000);

  // Maj joueurs action pv +1 | timerinterval * 1000 ms
  setInterval(async () => {
    playersData.players.forEach((player) => {
      if (player.life > 0 && player.life > 100) {
        player.life += 1;
      }
      if (player.action < 5) {
        player.action += 1;
      }
    });
    fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
  }, worldBossData.interval * 1000);
});

client.on("messageReactionAdd", async (reaction, user) => {
  // Ignore les réactions du bot lui-même
  if (user.bot) return;

  let player = findPlayerById(user.id);
  if (!player) {
    player = {
      id: user.id,
      username: user.username,
      class: "N/A",
      level: 1,
      life: 100,
      action: 5,
      experience: 0,
      golds: 0,
      damages: 0,
      donation: 0,
    };
    playersData.players.push(player);
    fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
    return;
  } else {
    if (reaction.message.id === worldBossData.cityId) {
      const userReactions = reaction.message.reactions.cache.filter(
        (reaction) => reaction.users.cache.has(user.id)
      );
      if (userReactions.size > 1) {
        try {
          // Enlève la réaction ajoutée
          await reaction.users.remove(user.id);
        } catch (error) {
          console.error("Erreur en enlevant la réaction:", error);
        }
        client.users.send(user.id, `Vous avez déjà une classe`);
        return; // L'utilisateur a déjà une classe, on ne fait rien
      }

      if (reaction.emoji.name === "🧑‍🚀") {
        player.class = "Guerrier";
        client.users.send(user.id, `Vous êtes devenu guerrier !`);
      } else if (reaction.emoji.name === "🧙‍♂️") {
        player.class = "Mage";
        client.users.send(user.id, `Vous êtes devenu mage !`);
      } else if (reaction.emoji.name === "🧝‍♀️") {
        player.class = "Tireur";
        client.users.send(user.id, `Vous êtes devenu tireur !`);
      } else if (reaction.emoji.name === "🧑‍🎤") {
        player.class = "Aventurier";
        client.users.send(user.id, `Vous êtes devenu aventurier !`);
      } else {
        return;
      }

      fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
    } else if (reaction.message.id === worldBossData.warriorId) {
      if (player.class != "Guerrier") {
        try {
          // Enlève la réaction ajoutée
          await reaction.users.remove(user.id);
        } catch (error) {
          console.error("Erreur en enlevant la réaction:", error);
        }
      } else {
        const userReactions = reaction.message.reactions.cache.filter(
          (r) =>
            r.users.cache.has(user.id) && r.emoji.name !== reaction.emoji.name
        );
        for (const r of userReactions.values()) {
          await r.users.remove(user.id);
        }
      }
    } else if (reaction.message.id === worldBossData.mageId) {
      if (player.class != "Mage") {
        try {
          // Enlève la réaction ajoutée
          await reaction.users.remove(user.id);
        } catch (error) {
          console.error("Erreur en enlevant la réaction:", error);
        }
      } else {
        const userReactions = reaction.message.reactions.cache.filter(
          (r) =>
            r.users.cache.has(user.id) && r.emoji.name !== reaction.emoji.name
        );
        for (const r of userReactions.values()) {
          await r.users.remove(user.id);
        }
      }
    } else if (reaction.message.id === worldBossData.rogueId) {
      if (player.class != "Tireur") {
        try {
          // Enlève la réaction ajoutée
          await reaction.users.remove(user.id);
        } catch (error) {
          console.error("Erreur en enlevant la réaction:", error);
        }
      } else {
        const userReactions = reaction.message.reactions.cache.filter(
          (r) =>
            r.users.cache.has(user.id) && r.emoji.name !== reaction.emoji.name
        );
        for (const r of userReactions.values()) {
          await r.users.remove(user.id);
        }
      }
    } else if (reaction.message.id === worldBossData.adventurerId) {
      if (player.class != "Aventurier") {
        try {
          // Enlève la réaction ajoutée
          await reaction.users.remove(user.id);
        } catch (error) {
          console.error("Erreur en enlevant la réaction:", error);
        }
      } else {
        const userReactions = reaction.message.reactions.cache.filter(
          (r) =>
            r.users.cache.has(user.id) && r.emoji.name !== reaction.emoji.name
        );
        for (const r of userReactions.values()) {
          await r.users.remove(user.id);
        }
      }
    } else if (reaction.message.id === worldBossData.id) {
      try {
        // Enlève la réaction ajoutée
        await reaction.users.remove(user.id);
      } catch (error) {
        console.error("Erreur en enlevant la réaction:", error);
      }
      if (player.life > 0) {
        if (player.action > 0) {
          if (reaction.emoji.name === "🗡️") {
            const dataDamages = player.level * getRandomMultiplier();
            const dataLife = worldBossData.level * getRandomMultiplier();
            const dataExperience = worldBossData.level;
            const dataGolds = worldBossData.level;
            passifClass(
              player,
              dataDamages,
              dataLife,
              dataExperience,
              dataGolds
            );
            worldBossAttack(
              player,
              dataDamages,
              dataLife,
              dataExperience,
              dataGolds
            );
          } else if (reaction.emoji.name === "🐴") {
            const dataExperience = player.level * getRandomMultiplier();
            const dataGolds = player.level * getRandomMultiplier();
            worldBossAdventure(player, dataExperience, dataGolds);
          } else if (reaction.emoji.name === "🏹") {
            if (player.action > 1) {
              const dataDamages = player.level * getRandomMultiplier();
              const dataLife = worldBossData.level * getRandomMultiplier();
              const dataExperience = worldBossData.level;
              const dataGolds = worldBossData.level;
              passifClass(
                player,
                dataDamages,
                dataLife,
                dataExperience,
                dataGolds
              );
              worldBossSpecial(
                player,
                dataDamages,
                dataLife,
                dataExperience,
                dataGolds
              );
            } else {
              client.users.send(user.id, `Pas assez de points d'actions`);
              return;
            }
          } else if (reaction.emoji.name === "💤") {
            const dataLife = player.level * getRandomMultiplier();
            const dataGolds = player.level * getRandomMultiplier();
            worldBossRest(player, dataLife, dataGolds);
          }
        } else {
          client.users.send(user.id, `Pas assez de points d'actions`);
          return;
        }
      } else {
        client.users.send(
          user.id,
          `Vous êtes mort... Attendez la fin du combat.`
        );
        return;
      }
    }
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  // Ignore les réactions du bot lui-même
  if (user.bot) return;
});

client.on("messageCreate", (message) => {});

client.login(token);
