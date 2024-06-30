const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]}
);


// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    const worldBossStats = new EmbedBuilder()
	.setColor(0x0099FF)
	.setTitle('Some title')
	.setURL('https://discord.js.org/')
	.setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
	.setDescription('Some description here')
	.setThumbnail('https://i.imgur.com/AfFp7pu.png')
	.addFields(
		{ name: 'Regular field title', value: 'Some value here' },
		{ name: '\u200B', value: '\u200B' },
		{ name: 'Inline field title', value: 'Some value here', inline: true },
		{ name: 'Inline field title', value: 'Some value here', inline: true },
	)
	.addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
	.setImage('https://i.imgur.com/AfFp7pu.png')
	.setTimestamp()
	.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

    
    const channel = client.channels.cache.get('1182340754023121006');
    channel.send({ embeds: [worldBossStats] });


});

let messageTrackerWB, messageTrackerOther;
// Écouter l'événement messageCreate
client.on('messageCreate', (message) => {
    // Mise en mémoire des messages du bot
    if (message.author.bot) {
        if(message.channel === client.channels.cache.get('1182340754023121006')){
            console.log(messageTrackerWB);
            messageTrackerWB = message.id;
            console.log(messageTrackerWB);
        }
        if(message.channel === client.channels.cache.get('1257046797277331507')){
            messageTrackerOther = message.id;
        }
            
    }
    
});

client.login(token);
