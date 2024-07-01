const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
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

// Lire le fichier JSON au démarrage du bot
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

// Sauvegarder les modifications dans le fichier JSON
function saveWorldbossData() {
    fs.writeFile('worldBoss.json', JSON.stringify(worldboss, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Erreur en écrivant dans le fichier worldboss.json:', err);
            return;
        }
        console.log('Données du World Boss sauvegardées avec succès.');
    });
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

        const channel = client.channels.cache.get('1182340754023121006');
        await channel.send({ embeds: [worldBossStats] });
    }, 1000);
}


let messageTrackerWB, messageTrackerOther;

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    worldBossMessageBuilder();

    setInterval(async () => {
        console.log(`Maj Action`);
    }, 3600000); // 3600000 ms = 1 heure

    setInterval(async () => {
        console.log(`Maj PDV`);
    }, 60000); // 60000 ms = 1 minute

});


// Écouter l'événement messageCreate
client.on('messageCreate', async (message) => {
    // Mise en mémoire des messages du bot
    if (message.author.bot) {
        if(message.channel.id === '1182340754023121006'){
            await message.react('🅰️');
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
            console.log('attaque');
            worldboss.degatsSubits++;
            saveWorldbossData();
            reaction.message.delete();
            worldBossMessageBuilder();

        } else if (reaction.emoji.name === '💤') {
            console.log('repos');
            reaction.message.delete();
            worldBossMessageBuilder();
        }
    }
});


client.login(token);
