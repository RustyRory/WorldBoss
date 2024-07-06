const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const { token, channelWB } = require("./config.json");

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
        " | 🏹 | Partir en aventure (XP + Golds)\n" +
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
  await message.react("💤");
  await message.react("❤️");

  // Enregistrer l'ID du message pour les futures références
  worldBossData.id = message.id;
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
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

async function worldBossAttack(player, dataDamages, dataLife) {
  player.action -= 1;
  player.damages = player.damages + (dataDamages - worldBossData.level + 1);
  worldBossData.damages =
    worldBossData.damages + (dataDamages - worldBossData.level + 1);
  player.life = player.life - (dataLife - player.level);
  player.experience = player.experience + worldBossData.level;
  player.golds = player.golds + worldBossData.level;

  let embed = new EmbedBuilder()
    .setTitle("WorldBoss Attaque")
    .setDescription("Voici le rapport de combat de votre attaque.")
    .addFields(
      {
        name: "Point de dégats",
        value:
          "(" +
          (dataDamages - worldBossData.level).toString() +
          ") => " +
          worldBossData.damages.toString(),
        inline: true,
      },
      {
        name: "Point de vie",
        value:
          "(" +
          (dataLife - player.level).toString() +
          ") => " +
          player.life.toString(),
        inline: true,
      },
      { name: "\u200B", value: "\u200B" },
      {
        name: "Point d'expériences",
        value:
          "(+" +
          worldBossData.level.toString() +
          ") => " +
          player.experience.toString(),
        inline: true,
      },
      {
        name: "golds",
        value:
          "(+" +
          worldBossData.level.toString() +
          ") => " +
          player.golds.toString(),
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
  fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
  fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));

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

  setInterval(async () => {
    // Maj embed
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
  }, 1000); // 1000 ms = 1 sec

  setInterval(async () => {
    // Maj pv + action
    playersData.players.forEach((player) => {
      if (player.life > 0 && player.life > 100) {
        player.life += 1;
      }
      if (player.action < 5) {
        player.action += 1;
      }
    });
    fs.writeFileSync("worldBoss.json", JSON.stringify(worldBossData, null, 2));
    fs.writeFileSync("players.json", JSON.stringify(playersData, null, 2));
  }, worldBossData.interval * 1000); // 10000 ms = 10 sec
});

client.on("messageReactionAdd", async (reaction, user) => {
  // Ignore les réactions du bot lui-même
  if (user.bot) return;

  // Vérifie si la réaction est sur le message que nous suivons
  if (reaction.message.id === worldBossData.id) {
    try {
      // Enlève la réaction ajoutée
      await reaction.users.remove(user.id);
    } catch (error) {
      console.error("Erreur en enlevant la réaction:", error);
    }

    let player = findPlayerById(user.id);
    if (!player) {
      client.users.send(
        user.id,
        `Vous n'avez pas de personnage. Entrez !worldboss pour jouer et créer votre personnage.`
      );
      return;
    } else {
      if (player.life > 0) {
        if (player.action > 0) {
          if (reaction.emoji.name === "🗡️") {
            //
            const dataDamages = player.level * getRandomMultiplier();
            const dataLife = worldBossData.level * getRandomMultiplier();

            worldBossAttack(player, dataDamages, dataLife);
          } else if (reaction.emoji.name === "🏹") {
            const dataExperince = player.level * getRandomMultiplier();
            const dataGolds = player.level * getRandomMultiplier();
            worldBossAdventure(player, dataExperince, dataGolds);
          } else if (reaction.emoji.name === "💤") {
            const dataLife = player.level * getRandomMultiplier();
            const dataGolds = player.level * getRandomMultiplier();

            //player.golds - worldBossData.level * getRandomMultiplier()

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

client.on("messageCreate", (message) => {});

client.login(token);
