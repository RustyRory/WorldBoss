const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token, channelWB } = require('./config.json');
const fs = require('fs');


const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]}
);

let worldboss;

let players = [];

let messageTrackerWB, messageTrackerOther;

// Lire le fichier  Wordlboss JSON 
function loadWorldbossData() {
    fs.readFile('worldboss.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur en lisant le fichier worldboss.json:', err);
            return;
        }
        worldboss = JSON.parse(data);
        console.log('Données du World Boss chargées:', worldboss);
    });
}

// Sauvegarder les modifications dans le fichier Wordlboss JSON
function saveWorldbossData() {
    fs.writeFile('worldBoss.json', JSON.stringify(worldboss, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur en écrivant dans le fichier worldboss.json:', err);
            return;
        }
        console.log('Données du World Boss sauvegardées avec succès.');
    });
}

// Charger les données des joueurs depuis players.json
function loadPlayersData() {
    fs.readFile('players.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur en lisant le fichier players.json:', err);
            return;
        }
        try {
            const json = JSON.parse(data);
            players = json.players;
            console.log('Données des joueurs chargées:', players);
        } catch (jsonErr) {
            console.error('Erreur en parsant le fichier players.json:', jsonErr);
        }
    });
}

// Sauvegarder les données des joueurs dans players.json
function savePlayersData() {
    fs.writeFile('players.json', JSON.stringify({ players }, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur en écrivant dans le fichier players.json:', err);
            return;
        }
        console.log('Données des joueurs sauvegardées avec succès.');
    });
}

function getRandomMultiplier() {
    const random = Math.random(); // Génère un nombre aléatoire entre 0 et 1
    if (random < 1 / 4) {
        return 0;
    } else if (random < 2 / 4) {
        return 1;
    } else if (random < 3 / 4) {
        return 2;
    } else {
        return 4;
    }
}


// Fonction pour trouver un joueur par son ID
function findPlayerById(playerId) {
    return players.find(player => player.id === playerId);
}

// Fonction pour modifier la vie d'un joueur par son ID
function modifyPlayerLife(playerId, newLife) {
    const player = findPlayerById(playerId);
    if (player) {
        player.life = newLife;
        savePlayersData(); // Sauvegarder les données après modification
        console.log(`Vie de ${player.username} modifiée à ${newLife}.`);
        return true;
    }
    return false; // Retourner false si aucun joueur avec cet ID n'a été trouvé
}

// Fonction pour modifier les point d'action d'un joueur par son ID
function modifyPlayerAction(playerId, newAction) {
    const player = findPlayerById(playerId);
    if (player) {
        player.action = newAction;
        savePlayersData(); // Sauvegarder les données après modification
        console.log(`Points d'action de ${player.username} modifiée à ${newAction}.`);
        return true;
    }
    return false; // Retourner false si aucun joueur avec cet ID n'a été trouvé
}

// Fonction pour modifier les golds d'un joueur par son ID
function modifyPlayerGolds(playerId, newGolds) {
    const player = findPlayerById(playerId);
    if (player) {
        player.golds = newGolds;
        savePlayersData(); // Sauvegarder les données après modification
        console.log(`Golds de ${player.username} modifiée à ${newGolds}.`);
        return true;
    }
    return false; // Retourner false si aucun joueur avec cet ID n'a été trouvé
}

// Fonction pour modifier l'xp' d'un joueur par son ID
function modifyPlayerExp(playerId, newExp) {
    const player = findPlayerById(playerId);
    if (player) {
        player.experience = newExp;
        console.log(`Expérience de ${player.username} modifiée à ${newExp}.`);
        if(player.experience >= player.level*13){
            player.experience = 0;
            player.level++;
            player.life+=50;
            player.action = 5;
            console.log(`Niveau de ${player.username} modifiée à ${player.level}.`);
        }
        savePlayersData(); // Sauvegarder les données après modification
        
        return true;
    }
    return false; // Retourner false si aucun joueur avec cet ID n'a été trouvé
}

// Fonction pour modifier les dégats totaux d'un joueur par son ID
function modifyPlayerDmg(playerId, newDmg) {
    const player = findPlayerById(playerId);
    if (player) {
        player.degats = newDmg;
        savePlayersData(); // Sauvegarder les données après modification
        console.log(`Points d'action de ${player.username} modifiée à ${newDmg}.`);
        return true;
    }
    return false; // Retourner false si aucun joueur avec cet ID n'a été trouvé
}

// Ajouter 1 pdv à tous les joueurs
function addLifeToPlayers() {
    players.forEach(player => {
        player.life += 1;
    });
    savePlayersData();
    console.log(`Maj PDV`);
}

// Ajouter 1 action à tous les joueurs
function addActionToPlayers() {
    players.forEach(player => {
        if (player.action < 5)
            player.action += 1;
    });
    savePlayersData();
    console.log(`Maj Action`);
}

// Fonction pour modifier les point d'action d'un joueur par son ID
function modifyWBLife(newlife) {
    worldboss.degatsSubits = newlife;
    console.log(`Points de dégats subit ${worldboss.nom} modifiée à ${newlife}.`);
    if(worldboss.degatsSubits >= worldboss.life){
        worldboss.degatsSubits = 0;
        worldboss.niveau++;
        worldboss.life = worldboss.niveau*13;
        console.log(`Points de dégats subit ${worldboss.nom} modifiée à ${newlife}.`);
    }
    saveWorldbossData();
}


function worldBossMessageBuilder(){
    // Charger les données du World Boss
    loadWorldbossData();
    // Attendre un peu pour s'assurer que les données sont chargées
    setTimeout(async () => {
        if (!worldboss) {
            console.error('Les données du World Boss n\'ont pas été chargées.');
            return;
        }
        
        const worldBossStats = new EmbedBuilder()
	    .setColor(0xFFFFFF)
	    .setTitle('Statistiques')
	    .setAuthor({ name: worldboss.nom ? worldboss.nom.toString() : 'N/A'})
	    .setDescription('Statistiques et interractions du world boss')
	    .addFields(
		    { name: 'Niveau', value: worldboss.niveau ? worldboss.niveau.toString() : 'N/A' },
		    { name: '\u200B', value: '\u200B' },
            { name: 'Dégâts Subits', value: worldboss.degatsSubits ? worldboss.degatsSubits.toString() : 'N/A', inline: true }
	    )
	    .setFooter({ text: '@RustyRory', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        const channel = client.channels.cache.get(channelWB);
        await channel.send({ embeds: [worldBossStats] });
    }, 100);
}

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    worldBossMessageBuilder();
    loadPlayersData();

    setInterval(async () => {
        addLifeToPlayers();
        addActionToPlayers();
    }, 3600000); // 3600000 ms = 1 heure

});


// Écouter l'événement messageCreate
client.on('messageCreate', async (message) => {
    // Mise en mémoire des messages du bot
    if (message.author.bot) {
        if(message.channel.id === channelWB){
            await message.react('🅰️');
            await message.react('🏹');
            await message.react('💤');
            messageTrackerWB = message.id;
        }
        else if(message.channel.id === '1257046797277331507'){
            messageTrackerOther = message.id;
        }
            
    }
    
});

client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore les réactions du bot lui-même
    if (user.bot) return;

    // Vérifie si la réaction est sur le message que nous suivons
    if (reaction.message.id === messageTrackerWB) {
        try {
            // Enlève la réaction ajoutée
            await reaction.users.remove(user.id);
        } catch (error) {
            console.error('Erreur en enlevant la réaction:', error);
        }

        if (reaction.emoji.name === '🅰️') {
            reaction.message.delete();
            let player = findPlayerById(user.id);
            if (!player) {
                console.log('Pas de joueur avec cet id');
                return;
            } else {
                if(player.action>0){
                    modifyPlayerAction(user.id, player.action-1);
                    modifyPlayerLife(user.id, player.life-worldboss.niveau*getRandomMultiplier());
                    modifyPlayerExp(user.id, player.experience+worldboss.niveau);
                    modifyPlayerGolds(user.id, player.golds+worldboss.niveau);
                    const dmg = player.level*getRandomMultiplier();
                    modifyPlayerDmg(user.id, player.degats+dmg);
                    modifyWBLife(worldboss.degatsSubits+dmg);
                    client.users.send(user.id, 'attaque');
                }else{
                    console.log('Pas assez de points d\'actions');
                }
                
            }
            worldBossMessageBuilder();

        } else if (reaction.emoji.name === '🏹') {
            reaction.message.delete();
            let player = findPlayerById(user.id);
            if (!player) {
                console.log('Pas de joueur avec cet id');
                return;
            } else {
                if(player.action>0){
                    modifyPlayerAction(user.id, player.action-1);
                    modifyPlayerExp(user.id, player.experience+worldboss.niveau*getRandomMultiplier());
                    modifyPlayerGolds(user.id, player.golds+worldboss.niveau*getRandomMultiplier());
                    client.users.send(user.id, 'aventure');
                }else{
                    console.log('Pas assez de points d\'actions');
                }
                
            }
            worldBossMessageBuilder();
        } else if (reaction.emoji.name === '💤') {
            console.log('repos');
            reaction.message.delete();
            let player = findPlayerById(user.id);
            if (!player) {
                console.log('Pas de joueur avec cet id');
                return;
            } else {
                if(player.action>0){
                    modifyPlayerAction(user.id, player.action-1);
                    modifyPlayerLife(user.id, player.experience+worldboss.niveau*getRandomMultiplier());
                    modifyPlayerGolds(user.id, player.golds-worldboss.niveau*getRandomMultiplier());
                    client.users.send(user.id, 'repos');
                }else{
                    console.log('Pas assez de points d\'actions');
                }
                
            }
            worldBossMessageBuilder();
        }

    }
});


client.login(token);
